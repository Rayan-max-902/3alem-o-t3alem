import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');
db.pragma('foreign_keys = ON');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    institution TEXT,
    major TEXT,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    school TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS school_follows (
    user_id INTEGER NOT NULL,
    school_name TEXT NOT NULL,
    PRIMARY KEY (user_id, school_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS school_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    school_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    level TEXT NOT NULL,
    average REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
  CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
  CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
`);

// Seed Virtual Users for Messaging
const seedUser = (id: number, email: string, name: string, bio: string) => {
  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!exists) {
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, institution, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      email, 
      'virtual_user_no_password', 
      name, 
      'system', 
      '3ALEM O T3ALEM', 
      bio,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=006233&color=fff`
    );
  }
};

seedUser(999, 'mentor@3alem.ma', 'Mentor Orientation', 'Mentor officiel pour vous guider.');
seedUser(888, 'system@3alem.ma', 'Messagerie', 'Système de messagerie communautaire.');

// Migration: Add banner_url if it doesn't exist
try {
  db.prepare('SELECT banner_url FROM users LIMIT 1').get();
} catch (e) {
  console.log('Adding banner_url column to users table...');
  db.exec('ALTER TABLE users ADD COLUMN banner_url TEXT');
}

// Migration: Add major if it doesn't exist
try {
  db.prepare('SELECT major FROM users LIMIT 1').get();
} catch (e) {
  console.log('Adding major column to users table...');
  db.exec('ALTER TABLE users ADD COLUMN major TEXT');
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role, institution } = req.body;
    console.log('Signup attempt:', { email, name, role, institution });
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom sont requis' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      // For this demo, we make users verified by default to avoid friction
      const stmt = db.prepare('INSERT INTO users (email, password, name, role, institution, is_verified) VALUES (?, ?, ?, ?, ?, ?)');
      const result = stmt.run(email, hashedPassword, name, role, institution, 1);
      
      console.log('User created successfully:', email);
      res.status(201).json({ message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.', userId: result.lastInsertRowid });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
      const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('Invalid password for:', email);
        return res.status(401).json({ error: 'Identifiants invalides' });
      }
      
      if (!user.is_verified) {
        console.log('User not verified:', email);
        return res.status(403).json({ error: 'Veuillez vérifier votre email' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      console.log('Login successful for:', email);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          institution: user.institution,
          major: user.major,
          bio: user.bio,
          avatar_url: user.avatar_url,
          banner_url: user.banner_url
        } 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  app.get('/api/auth/verify', (req, res) => {
    const { token } = req.query;
    const user: any = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);
    
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    
    db.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?').run(user.id);
    res.json({ message: 'Email verified successfully' });
  });

  app.put('/api/auth/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const { name, institution, major, bio, avatar_url, banner_url } = req.body;
      
      db.prepare(`
        UPDATE users 
        SET name = ?, institution = ?, major = ?, bio = ?, avatar_url = ?, banner_url = ? 
        WHERE id = ?
      `).run(name, institution, major, bio, avatar_url, banner_url, decoded.userId);

      const updatedUser = db.prepare('SELECT id, name, email, role, institution, major, bio, avatar_url, banner_url FROM users WHERE id = ?').get(decoded.userId);
      res.json({ user: updatedUser });
    } catch (e) {
      console.error('Profile update error:', e);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // --- POST ROUTES ---
  app.get('/api/posts', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    
    if (authHeader) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    }

    const posts = db.prepare(`
      SELECT 
        posts.*, 
        users.name as user_name, 
        users.role as user_role, 
        users.institution as user_institution, 
        users.avatar_url as user_avatar_url,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = posts.id) as liked_by_me,
        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments_count
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY posts.created_at DESC
    `).all(userId || 0);
    
    res.json(posts);
  });

  app.post('/api/posts', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const { content, school } = req.body;
      const stmt = db.prepare('INSERT INTO posts (user_id, content, school) VALUES (?, ?, ?)');
      const result = stmt.run(decoded.userId, content, school);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.post('/api/posts/:id/like', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const postId = req.params.id;
      
      const existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').get(decoded.userId, postId);
      
      if (existing) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(decoded.userId, postId);
        db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
        res.json({ liked: false });
      } else {
        db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(decoded.userId, postId);
        db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
        res.json({ liked: true });
      }
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.get('/api/posts/:id/comments', (req, res) => {
    const comments = db.prepare(`
      SELECT comments.*, users.name as user_name, users.avatar_url as user_avatar_url
      FROM comments 
      JOIN users ON comments.user_id = users.id 
      WHERE post_id = ?
      ORDER BY comments.created_at ASC
    `).all(req.params.id);
    res.json(comments);
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const { content } = req.body;
      const postId = req.params.id;
      
      const stmt = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)');
      const result = stmt.run(postId, decoded.userId, content);
      
      const newComment = db.prepare(`
        SELECT comments.*, users.name as user_name, users.avatar_url as user_avatar_url
        FROM comments 
        JOIN users ON comments.user_id = users.id 
        WHERE comments.id = ?
      `).get(result.lastInsertRowid);
      
      res.status(201).json(newComment);
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.get('/api/users/:id/stats', (req, res) => {
    const userId = req.params.id;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId) as any;
    const likesReceived = db.prepare(`
      SELECT SUM(likes_count) as count FROM posts WHERE user_id = ?
    `).get(userId) as any;
    const commentsReceived = db.prepare(`
      SELECT COUNT(*) as count FROM comments 
      JOIN posts ON comments.post_id = posts.id 
      WHERE posts.user_id = ?
    `).get(userId) as any;
    
    res.json({
      posts: postsCount.count || 0,
      likes: likesReceived.count || 0,
      comments: commentsReceived.count || 0
    });
  });

  app.get('/api/schools/followed', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const followed = db.prepare('SELECT school_name FROM school_follows WHERE user_id = ?').all(decoded.userId);
      res.json(followed.map((f: any) => f.school_name));
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.post('/api/schools/:name/toggle-follow', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const schoolName = req.params.name;
      
      const exists = db.prepare('SELECT 1 FROM school_follows WHERE user_id = ? AND school_name = ?').get(decoded.userId, schoolName);
      
      if (exists) {
        db.prepare('DELETE FROM school_follows WHERE user_id = ? AND school_name = ?').run(decoded.userId, schoolName);
        res.json({ followed: false });
      } else {
        db.prepare('INSERT INTO school_follows (user_id, school_name) VALUES (?, ?)').run(decoded.userId, schoolName);
        res.json({ followed: true });
      }
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // --- REGISTRATIONS ---
  app.post('/api/registrations', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const { school_name, full_name, email, phone, level, average, message } = req.body;
      
      db.prepare(`
        INSERT INTO school_registrations (user_id, school_name, full_name, email, phone, level, average, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(decoded.userId, school_name, full_name, email, phone, level, average, message);
      
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.get('/api/registrations', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(decoded.userId) as any;
      
      // Simple admin check by email
      if (user.email !== 'moatadidrayan7@gmail.com') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const registrations = db.prepare(`
        SELECT school_registrations.*, users.name as user_name 
        FROM school_registrations 
        JOIN users ON school_registrations.user_id = users.id
        ORDER BY created_at DESC
      `).all();
      
      res.json(registrations);
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.patch('/api/registrations/:id/status', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(decoded.userId) as any;
      
      if (user.email !== 'moatadidrayan7@gmail.com') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const { status } = req.body;
      db.prepare('UPDATE school_registrations SET status = ? WHERE id = ?').run(status, req.params.id);
      
      res.json({ success: true });
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Catch-all for /api to prevent falling through to Vite/SPA
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
  });

  // --- WEBSOCKETS ---
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'auth') {
        try {
          const decoded: any = jwt.verify(data.token, JWT_SECRET);
          userId = decoded.userId;
          if (userId) clients.set(userId, ws);
        } catch (e) {
          ws.close();
        }
      } else if (data.type === 'message' && userId) {
        const { receiverId, content } = data;
        db.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(userId, receiverId, content);
        
        const receiverWs = clients.get(receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({ type: 'message', senderId: userId, content }));
        }
      }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
