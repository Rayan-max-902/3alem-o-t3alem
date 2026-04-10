import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  UserCircle, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Heart, 
  Share2, 
  MapPin, 
  GraduationCap, 
  School,
  Send,
  X,
  RefreshCw,
  Search
} from 'lucide-react';
import { cn, formatDate } from './lib/utils';

// --- TYPES ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'eleve';
  institution?: string;
  major?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
}

interface Post {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  user_institution: string;
  user_avatar_url?: string;
  content: string;
  school?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  liked_by_me?: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

// --- UTILS ---
async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  } else {
    const text = await res.text();
    console.error(`safeFetchJson: Expected JSON from ${url} but got:`, text);
    throw new Error("Le serveur a renvoyé une réponse invalide.");
  }
}

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'feed' | 'profile' | 'auth' | 'admin_registrations'>((localStorage.getItem('view') as any) || 'feed');

  const handleSetView = (newView: 'feed' | 'profile' | 'auth' | 'admin_registrations') => {
    setView(newView);
    localStorage.setItem('view', newView);
  };
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [userLikesCount, setUserLikesCount] = useState(0);
  const [userCommentsCount, setUserCommentsCount] = useState(0);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedSchoolForRegistration, setSelectedSchoolForRegistration] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchUserStats(u.id);
      }
    } else {
      setView('feed');
    }
  }, [token]);

  const fetchUserStats = async (userId?: number) => {
    const id = userId || user?.id;
    if (!token || !id) return;
    try {
      const data = await safeFetchJson(`/api/users/${id}/stats`);
      setUserPostsCount(data.posts);
      setUserLikesCount(data.likes);
      setUserCommentsCount(data.comments);
    } catch (e) {
      console.error("fetchUserStats error:", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('view');
    setToken(null);
    setUser(null);
    handleSetView('feed');
  };

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen zellige-pattern text-[#1a1a1a] font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-[#006233]/10 z-50 px-4 md:px-[8%] h-20 flex items-center justify-between shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => handleSetView('feed')}
        >
          <div className="h-16 w-auto bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
            <img 
              src="https://storage.googleapis.com/test-media-ais/moatadidrayan7%40gmail.com/1744218892418_logo.jpg" 
              alt="3alem t3alem Logo" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="px-4 py-2 bg-[#006233] rounded-lg text-white font-black text-lg">3ALEM O T3ALEM</div>';
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-10">
          <NavItem 
            icon={<Home size={22} />} 
            label="Accueil" 
            active={view === 'feed'} 
            onClick={() => handleSetView('feed')} 
          />
          <NavItem 
            icon={<UserCircle size={22} />} 
            label="Profil" 
            active={view === 'profile'} 
            onClick={() => {
              if (!user) setIsAuthModalOpen(true);
              else handleSetView('profile');
            }} 
          />
          <NavItem 
            icon={<MessageSquare size={22} />} 
            label="Messages" 
            onClick={() => {
              if (!user) setIsAuthModalOpen(true);
              else setChatUser({ id: 888, name: 'Messagerie', email: '', role: 'student' });
            }} 
          />

          {user?.email === 'moatadidrayan7@gmail.com' && (
            <NavItem 
              icon={<RefreshCw size={22} />} 
              label="Admin" 
              active={view === 'admin_registrations'} 
              onClick={() => handleSetView('admin_registrations')} 
            />
          )}
          
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center text-[10px] font-bold text-[#666] hover:text-[#c1272d] active:scale-95 transition-all"
            >
              <LogOut size={22} />
              Déconnexion
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-morocco-primary text-sm active:scale-95 transition-all"
            >
              Se connecter
            </button>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pt-28 pb-10 px-4 md:px-[8%] max-w-7xl mx-auto">
        {view === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-8">
            <aside className="hidden lg:block space-y-6">
              <ProfileCard 
                user={user} 
                setView={handleSetView} 
                onJoin={(mode) => {
                  setAuthModalMode(mode);
                  setIsAuthModalOpen(true);
                }}
              />
              <StatsCard postsCount={userPostsCount} likesCount={userLikesCount} commentsCount={userCommentsCount} />
              <div className="moroccan-card p-6 bg-gradient-to-br from-[#006233] to-[#004d28] text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-black text-lg mb-2">Besoin d'aide ?</h4>
                  <p className="text-xs opacity-90 mb-4">Nos mentors sont là pour vous guider dans votre choix d'orientation.</p>
                  <button 
                    onClick={() => setChatUser({ id: 999, name: 'Mentor Orientation', email: 'mentor@3alem.ma', role: 'student' })}
                    className="bg-white text-[#006233] px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#d4af37] hover:text-white active:scale-95 transition-all"
                  >
                    Contacter un mentor
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12">
                  <GraduationCap size={100} />
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              {user && (
                <div className="moroccan-card p-5 flex gap-4 items-center bg-white/80 backdrop-blur-sm border-2 border-[#006233]/5">
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=006233&color=fff&bold=true`} 
                    className="w-14 h-14 rounded-2xl shadow-md object-cover"
                    alt="avatar"
                  />
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex-1 bg-[#fdfbf7] border border-[#e5e7eb] rounded-2xl px-6 py-4 text-left text-[#666] hover:border-[#006233] hover:bg-white active:scale-[0.99] transition-all group"
                  >
                    Partagez un conseil d'orientation...
                    <Plus className="inline-block float-right text-[#006233] group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              )}
              <Feed 
                user={user} 
                refreshTrigger={refreshTrigger}
                onMessage={(u) => setChatUser(u)} 
                onCommentAdded={() => fetchUserStats()} 
                onRegister={(schoolName) => {
                  setSelectedSchoolForRegistration(schoolName);
                  setIsRegistrationModalOpen(true);
                }}
              />
            </section>

            <aside className="hidden lg:block">
              <SchoolsCard 
                user={user} 
                onRegister={(schoolName) => {
                  setSelectedSchoolForRegistration(schoolName);
                  setIsRegistrationModalOpen(true);
                }} 
              />
            </aside>
          </div>
        )}

        {view === 'profile' && user && (
          <ProfilePage 
            user={user} 
            postsCount={userPostsCount} 
            likesCount={userLikesCount}
            commentsCount={userCommentsCount}
            onEdit={() => setIsEditProfileModalOpen(true)} 
            onCommentAdded={() => fetchUserStats()}
            onRegister={(schoolName) => {
              setSelectedSchoolForRegistration(schoolName);
              setIsRegistrationModalOpen(true);
            }}
          />
        )}

        {view === 'admin_registrations' && user?.email === 'moatadidrayan7@gmail.com' && (
          <AdminRegistrations />
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {isRegistrationModalOpen && user && selectedSchoolForRegistration && (
          <RegistrationModal 
            schoolName={selectedSchoolForRegistration}
            user={user}
            onClose={() => setIsRegistrationModalOpen(false)}
          />
        )}
        {isAuthModalOpen && (
          <AuthModal 
            initialMode={authModalMode}
            onClose={() => setIsAuthModalOpen(false)} 
            onSuccess={(u, t) => {
              setToken(t);
              setUser(u);
              setIsAuthModalOpen(false);
              // Removed window.location.reload() for better performance
            }} 
          />
        )}
        {isPostModalOpen && user && (
          <PostModal 
            user={user} 
            token={token!} 
            onClose={() => setIsPostModalOpen(false)} 
            onSuccess={() => {
              setIsPostModalOpen(false);
              fetchUserStats();
              triggerRefresh();
              // Removed window.location.reload() for better performance
            }}
          />
        )}
        {isEditProfileModalOpen && user && (
          <EditProfileModal 
            user={user} 
            onClose={() => setIsEditProfileModalOpen(false)}
            onUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setIsEditProfileModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* CHAT WIDGET */}
      {chatUser && (
        <ChatWidget 
          user={user!} 
          targetUser={chatUser} 
          onClose={() => setChatUser(null)} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center text-[11px] font-bold active:scale-95 transition-all relative",
        active ? "text-[#006233] scale-110" : "text-[#666] hover:text-[#006233]"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        active ? "bg-[#006233]/10" : "hover:bg-[#f3f2ef]"
      )}>
        {icon}
      </div>
      <span className="mt-1">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute -bottom-4 w-1 h-1 bg-[#006233] rounded-full" 
        />
      )}
    </button>
  );
}

function ProfileCard({ user, setView, onJoin }: { user: User | null, setView: (v: 'feed' | 'profile' | 'auth') => void, onJoin?: (mode: 'login' | 'signup') => void }) {
  if (!user) return (
    <div className="moroccan-card p-8 text-center bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006233] via-[#d4af37] to-[#c1272d]" />
      <h1 className="font-black text-[#006233] mb-4 text-4xl md:text-5xl leading-tight">Marhba Bik!</h1>
      <p className="text-sm text-[#666] mb-8 leading-relaxed font-medium">Rejoignez la plus grande communauté d'étudiants au Maroc.</p>
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => onJoin?.('signup')}
          className="btn-morocco-primary w-full py-4 text-sm active:scale-95 transition-all shadow-lg shadow-[#006233]/20"
        >
          S'inscrire maintenant
        </button>
        <button 
          onClick={() => onJoin?.('login')}
          className="w-full py-3 text-xs font-bold text-[#666] hover:text-[#006233] transition-colors"
        >
          Déjà un compte ? Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="moroccan-card group">
      <div className="h-20 bg-gradient-to-br from-[#006233] to-[#004d28] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 zellige-pattern" />
      </div>
      <div className="px-5 pb-6 text-center">
        <img 
          src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=fff&color=006233&bold=true`} 
          className="w-20 h-20 rounded-2xl mx-auto -mt-10 border-4 border-white shadow-xl relative z-10 group-hover:scale-105 transition-transform object-cover"
          alt="avatar"
        />
        <h3 className="mt-4 font-black text-xl text-[#1a1a1a]">{user.name}</h3>
        <p className="text-xs font-medium text-[#666] mt-1">{user.institution || 'Non spécifié'}</p>
        
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className={cn(
            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
            user.role === 'student' ? "bg-[#006233]/10 text-[#006233]" : "bg-[#c1272d]/10 text-[#c1272d]"
          )}>
            {user.role === 'student' ? 'Étudiant' : 'Élève Bac'}
          </span>
        </div>
      </div>
      <div className="border-t border-[#f3f2ef] p-4 bg-[#fdfbf7]">
        <button 
          onClick={() => setView('profile')}
          className="w-full text-xs font-black text-[#006233] hover:text-[#c1272d] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Voir mon profil <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function StatsCard({ postsCount, likesCount, commentsCount }: { postsCount: number, likesCount: number, commentsCount: number }) {
  return (
    <div className="moroccan-card p-6">
      <h4 className="text-xs font-black text-[#666] mb-4 uppercase tracking-widest">Activité</h4>
      <div className="space-y-4">
        <StatRow label="Conseils publiés" value={postsCount.toString()} color="#006233" />
        <StatRow label="Likes reçus" value={likesCount.toString()} color="#c1272d" />
        <StatRow label="Commentaires" value={commentsCount.toString()} color="#d4af37" />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center group cursor-pointer">
      <span className="text-xs font-medium text-[#666] group-hover:text-[#1a1a1a] transition-colors">{label}</span>
      <span className="text-sm font-black px-2 py-0.5 rounded-md" style={{ color, backgroundColor: `${color}10` }}>{value}</span>
    </div>
  );
}

function SchoolDetailModal({ school, onClose, onRegister }: { school: any, onClose: () => void, onRegister?: (name: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="h-32 bg-gradient-to-r from-[#006233] to-[#d4af37] relative">
          <div className="absolute inset-0 opacity-20 zellige-pattern" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/40 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-8 pb-8 -mt-10 relative z-10">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center font-black text-[#006233] text-2xl border-4 border-white mb-4">
            {school.name.substring(0, 3)}
          </div>
          
          <h2 className="text-2xl font-black text-[#1a1a1a] mb-1">{school.name}</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-[#006233]/10 text-[#006233] text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
              {school.type}
            </span>
            <span className="bg-[#c1272d]/10 text-[#c1272d] text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
              {school.public ? 'Public' : 'Privé'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#006233]/5">
              <p className="text-[10px] font-bold text-[#999] uppercase mb-1">Durée</p>
              <p className="text-sm font-black text-[#006233]">{school.duree}</p>
            </div>
            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#006233]/5">
              <p className="text-[10px] font-bold text-[#999] uppercase mb-1">Accès</p>
              <p className="text-sm font-black text-[#006233]">{school.niveau}</p>
            </div>
            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#006233]/5">
              <p className="text-[10px] font-bold text-[#999] uppercase mb-1">Seuil</p>
              <p className="text-sm font-black text-[#c1272d]">{school.seuil || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Villes disponibles</h4>
              <div className="flex flex-wrap gap-2">
                {school.villes.map((v: string) => (
                  <span key={v} className="bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-black px-3 py-1 rounded-lg border border-[#d4af37]/20">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Description</h4>
              <p className="text-sm text-[#666] leading-relaxed font-medium">
                {school.description}
              </p>
            </div>

            {school.filieres && school.filieres.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Filières</h4>
                <div className="flex flex-wrap gap-2">
                  {school.filieres.map((f: string) => (
                    <span key={f} className="bg-[#f3f2ef] text-[#1a1a1a] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-[#dce6e9]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={onClose}
              className="flex-1 bg-[#f3f2ef] text-[#666] py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
              Fermer
            </button>
            {onRegister && (
              <button 
                onClick={() => {
                  onRegister(school.name);
                  onClose();
                }}
                className="flex-[2] bg-[#006233] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-[#006233]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                S'inscrire
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SchoolsCard({ user, onRegister }: { user: User | null, onRegister?: (name: string) => void }) {
  const schools = [
    {
      "name": "ENSA",
      "type": "Ingénieur",
      "villes": ["Agadir", "Fès", "Tanger", "Marrakech", "Oujda", "Kénitra", "Safi", "El Jadida"],
      "public": true,
      "duree": "5 ans",
      "niveau": "Bac",
      "seuil": "12 - 14",
      "description": "Réseau d'écoles nationales des sciences appliquées formant des ingénieurs d'état dans diverses spécialités techniques et industrielles.",
      "filieres": ["Génie Informatique", "Génie Civil", "Génie Industriel", "Réseaux & Télécoms", "Génie Logiciel", "Génie Électrique", "Automobile", "Électromécanique"]
    },
    {
      "name": "ENCG",
      "type": "Commerce",
      "villes": ["Casablanca", "Settat", "Agadir", "Marrakech", "Tanger", "Fès", "Oujda", "Kénitra"],
      "public": true,
      "duree": "5 ans",
      "niveau": "Bac",
      "seuil": "11.5 - 13.5",
      "description": "Réseau d'écoles nationales de commerce et de gestion offrant des formations de haut niveau en management, finance et marketing.",
      "filieres": ["Finance", "Marketing", "Audit", "Management", "Comptabilité", "Commerce International"]
    },
    {
      "name": "EMI",
      "type": "Ingénieur",
      "villes": ["Rabat"],
      "public": true,
      "duree": "3 ans",
      "niveau": "CPGE",
      "seuil": "Très élevé",
      "description": "L'École Mohammadia d'Ingénieurs est la plus ancienne et l'une des plus prestigieuses écoles d'ingénieurs au Maroc.",
      "filieres": ["Génie Civil", "Génie Industriel", "Informatique", "Génie Électrique", "Génie Mécanique"]
    },
    {
      "name": "CPGE",
      "type": "Prépa",
      "villes": ["Rabat", "Casablanca", "Marrakech", "Fès", "Tanger", "Meknès", "Agadir"],
      "public": true,
      "duree": "2 ans",
      "niveau": "Bac",
      "seuil": "14 - 16+",
      "description": "Classes préparatoires aux grandes écoles d'ingénieurs et de commerce nationales et internationales.",
      "filieres": ["MPSI", "PCSI", "TSI", "ECS", "MP", "PSI", "PT"]
    },
    {
      "name": "BTS",
      "type": "Technique",
      "villes": ["Casablanca", "Rabat", "Agadir", "Marrakech", "Fès", "Tanger"],
      "public": true,
      "duree": "2 ans",
      "niveau": "Bac",
      "seuil": "10 - 12",
      "description": "Brevet de Technicien Supérieur offrant une formation technique courte et professionnalisante.",
      "filieres": ["Comptabilité", "Informatique de Gestion", "Commerce", "Bâtiment", "Électrotechnique"]
    },
    {
      "name": "ISCAE",
      "type": "Commerce",
      "villes": ["Casablanca", "Rabat"],
      "public": true,
      "duree": "5 ans",
      "niveau": "Bac+2",
      "seuil": "Très élevé",
      "description": "L'Institut Supérieur de Commerce et d'Administration des Entreprises est la référence en management au Maroc.",
      "filieres": ["Finance", "Audit", "Stratégie", "Marketing", "RH"]
    },
    {
      "name": "EMSI",
      "type": "Ingénieur Privé",
      "villes": ["Casablanca", "Rabat", "Marrakech", "Tanger"],
      "public": false,
      "duree": "5 ans",
      "niveau": "Bac",
      "seuil": "10 - 12",
      "description": "École Marocaine des Sciences de l'Ingénieur, leader de l'enseignement technique privé au Maroc.",
      "filieres": ["Génie Informatique", "Réseaux", "Génie Industriel", "Automatisme", "BTP"]
    },
    {
      "name": "FST",
      "type": "Université",
      "villes": ["Settat", "Mohammedia", "Tanger", "Fès", "Marrakech", "Béni Mellal"],
      "public": true,
      "duree": "3-5 ans",
      "niveau": "Bac",
      "seuil": "10 - 12",
      "description": "Facultés des Sciences et Techniques offrant des parcours Licence, Master et Ingénieur.",
      "filieres": ["Mathématiques", "Informatique", "Physique", "Chimie", "Biologie", "Génie des Procédés"]
    },
    {
      "name": "EST",
      "type": "Technique",
      "villes": ["Casablanca", "Fès", "Agadir", "Salé", "Safi", "Meknès", "Oujda"],
      "public": true,
      "duree": "2 ans",
      "niveau": "Bac",
      "seuil": "10 - 12",
      "description": "Écoles Supérieures de Technologie formant des techniciens supérieurs (DUT) hautement qualifiés.",
      "filieres": ["Développement Informatique", "Gestion des Entreprises", "Réseaux", "Génie Électrique"]
    },
    {
      "name": "Médecine",
      "type": "Santé",
      "villes": ["Rabat", "Casablanca", "Fès", "Marrakech", "Oujda", "Agadir", "Tanger"],
      "public": true,
      "duree": "7 ans",
      "niveau": "Bac",
      "seuil": "14.5 - 16",
      "description": "Facultés de Médecine et de Pharmacie formant les futurs professionnels de santé du Maroc.",
      "filieres": ["Médecine Générale", "Pharmacie", "Médecine Dentaire"]
    },
    {
      "name": "ENA",
      "type": "Architecture",
      "villes": ["Rabat", "Fès", "Tétouan", "Marrakech", "Agadir", "Oujda"],
      "public": true,
      "duree": "6 ans",
      "niveau": "Bac",
      "seuil": "14 - 16",
      "description": "École Nationale d'Architecture, l'unique établissement public formant des architectes d'état.",
      "filieres": ["Architecture", "Urbanisme", "Paysage"]
    }
  ];
  
  const [followed, setFollowed] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchFollowedSchools();
    }
  }, [user]);

  const fetchFollowedSchools = async () => {
    try {
      const data = await safeFetchJson('/api/schools/followed', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setFollowed(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFollow = async (schoolName: string) => {
    if (!user) return;
    try {
      const data = await safeFetchJson(`/api/schools/${encodeURIComponent(schoolName)}/toggle-follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setFollowed(prev => 
        data.followed ? [...prev, schoolName] : prev.filter(s => s !== schoolName)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const displayedSchools = showAll ? schools : schools.slice(0, 6);

  return (
    <>
      <div className="moroccan-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-black text-[#1a1a1a]">Écoles à la une</h4>
          <div className="w-8 h-8 bg-[#d4af37]/10 rounded-full flex items-center justify-center">
            <School size={16} className="text-[#d4af37]" />
          </div>
        </div>
        <div className={cn("space-y-5", showAll && "max-h-[500px] overflow-y-auto pr-2 custom-scrollbar")}>
          {displayedSchools.map(school => (
            <div key={school.name} className="flex items-center justify-between group">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setSelectedSchool(school)}
              >
                <div className="w-10 h-10 bg-[#f3f2ef] rounded-xl flex items-center justify-center font-black text-[#006233] text-[10px] text-center p-1 leading-tight group-hover:bg-[#006233]/10 transition-colors">
                  {school.name.split(' ').map(w => w[0]).join('').substring(0, 3)}
                </div>
                <div>
                  <p className="text-sm font-black group-hover:text-[#006233] transition-colors line-clamp-1">{school.name}</p>
                  <p className="text-[10px] text-[#999]">{school.type} • {school.villes.length} villes</p>
                </div>
              </div>
              <button 
                onClick={() => toggleFollow(school.name)}
                className={cn(
                  "text-[10px] font-black px-4 py-1.5 rounded-xl active:scale-95 transition-all uppercase tracking-wider shrink-0 ml-2",
                  followed.includes(school.name) 
                    ? "bg-[#f3f2ef] text-[#666]" 
                    : "bg-[#006233]/5 text-[#006233] hover:bg-[#006233] hover:text-white"
                )}
              >
                {followed.includes(school.name) ? 'Suivi' : 'Suivre'}
              </button>
            </div>
          ))}
        </div>
        
        {user?.role === 'eleve' && onRegister && (
          <div className="mt-6 pt-6 border-t border-[#f3f2ef]">
            <p className="text-[10px] font-black text-[#999] uppercase tracking-widest mb-3">Actions rapides</p>
            <button 
              onClick={() => setShowAll(true)}
              className="w-full bg-[#c1272d]/5 text-[#c1272d] py-3 rounded-xl text-xs font-black hover:bg-[#c1272d] hover:text-white transition-all active:scale-95"
            >
              S'inscrire à une école
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-6 py-3 text-xs font-black text-[#666] hover:text-[#006233] active:scale-[0.98] transition-all border-t border-[#f3f2ef]"
        >
          {showAll ? 'Réduire la liste' : 'Voir toutes les écoles'}
        </button>
      </div>

      <AnimatePresence>
        {selectedSchool && (
          <SchoolDetailModal 
            school={selectedSchool} 
            onClose={() => setSelectedSchool(null)} 
            onRegister={user?.role === 'eleve' ? onRegister : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Feed({ user, refreshTrigger, onMessage, onCommentAdded, onRegister }: { user: User | null, refreshTrigger?: number, onMessage: (u: User) => void, onCommentAdded?: () => void, onRegister?: (name: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts(posts.length === 0);
  }, [user, refreshTrigger]);

  const fetchPosts = async (isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await safeFetchJson('/api/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw className="animate-spin text-[#006233]" size={32} />
      <p className="text-sm font-bold text-[#666]">Chargement du fil d'actualité...</p>
    </div>
  );

  return (
    <div className="space-y-4 relative">
      {refreshing && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-[#006233]/10 flex items-center gap-2 z-20">
          <RefreshCw className="animate-spin text-[#006233]" size={14} />
          <span className="text-[10px] font-black text-[#006233] uppercase">Mise à jour...</span>
        </div>
      )}
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          user={user} 
          onMessage={onMessage} 
          onCommentAdded={onCommentAdded}
          onRegister={onRegister}
        />
      ))}
    </div>
  );
}

interface PostCardProps {
  key?: React.Key;
  post: Post;
  user: User | null;
  onMessage: (u: User) => void;
  onCommentAdded?: () => void;
  onRegister?: (name: string) => void;
}

function PostCard({ post, user, onMessage, onCommentAdded, onRegister }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [shared, setShared] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    try {
      const data = await safeFetchJson(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setLiked(data.liked);
      setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await safeFetchJson(`/api/posts/${post.id}/comments`);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;
    try {
      const data = await safeFetchJson(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ content: commentContent })
      });
      setComments([...comments, data]);
      setCommentsCount(prev => prev + 1);
      setCommentContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="moroccan-card p-6 bg-white hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#006233]/10"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-4">
          <img 
            src={post.user_avatar_url || `https://ui-avatars.com/api/?name=${post.user_name}&background=006233&color=fff&bold=true`} 
            className="w-14 h-14 rounded-2xl shadow-sm object-cover"
            alt="avatar"
          />
          <div>
            <h4 className="text-base font-black text-[#1a1a1a]">{post.user_name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                post.user_role === 'student' ? "bg-[#006233]/10 text-[#006233]" : "bg-[#c1272d]/10 text-[#c1272d]"
              )}>
                {post.user_role === 'student' ? 'Étudiant' : 'Élève'}
              </span>
              <span className="text-[10px] text-[#999] font-medium">• {post.user_institution}</span>
            </div>
            <p className="text-[10px] text-[#bbb] mt-1 font-mono">{formatDate(post.created_at)}</p>
          </div>
        </div>
        <button className="text-[#ccc] hover:text-[#006233] transition-colors">
          <Share2 size={18} />
        </button>
      </div>
      
      <div className="text-[15px] text-[#444] mb-6 leading-relaxed font-medium">
        {post.content}
        {post.school && (
          <div className="mt-4 flex items-center justify-between">
            <span className="bg-[#fdfbf7] border border-[#006233]/10 text-[#006233] font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">
              #{post.school}
            </span>
            {user?.role === 'eleve' && onRegister && (
              <button 
                onClick={() => onRegister(post.school!)}
                className="bg-[#006233] text-white text-[10px] font-black px-4 py-1.5 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow-md shadow-[#006233]/10"
              >
                S'inscrire
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-[#f3f2ef]">
        <button 
          onClick={handleLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black active:scale-95 transition-all",
            liked ? "bg-[#c1272d]/10 text-[#c1272d]" : "text-[#666] hover:bg-[#f3f2ef]"
          )}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
          {likesCount > 0 ? likesCount : (liked ? 'Aimé' : "J'aime")}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-[#666] hover:bg-[#f3f2ef] active:scale-95 transition-all",
            showComments && "bg-[#d4af37]/10 text-[#d4af37]"
          )}
        >
          <MessageSquare size={20} />
          {commentsCount > 0 ? `${commentsCount} Commentaires` : 'Commenter'}
        </button>
        <button 
          onClick={handleShare}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black active:scale-95 transition-all",
            shared ? "bg-[#006233]/10 text-[#006233]" : "text-[#666] hover:bg-[#f3f2ef]"
          )}
        >
          <Send size={20} />
          {shared ? 'Copié' : 'Partager'}
        </button>
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-[#f3f2ef] space-y-4">
          {user && (
            <form onSubmit={handleComment} className="flex gap-3">
              <img 
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=006233&color=fff&bold=true`} 
                className="w-8 h-8 rounded-lg object-cover"
                alt="avatar"
              />
              <div className="flex-1 flex gap-2">
                <input 
                  type="text"
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Votre commentaire..."
                  className="flex-1 bg-[#f3f2ef] border border-[#dce6e9] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#006233]"
                />
                <button 
                  type="submit"
                  disabled={!commentContent.trim()}
                  className="bg-[#006233] text-white p-2 rounded-xl disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingComments ? (
              <p className="text-center text-xs text-[#999]">Chargement...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-xs text-[#999]">Aucun commentaire pour le moment.</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img 
                    src={comment.user_avatar_url || `https://ui-avatars.com/api/?name=${comment.user_name}&background=006233&color=fff&bold=true`} 
                    className="w-8 h-8 rounded-lg object-cover"
                    alt="avatar"
                  />
                  <div className="flex-1 bg-[#fdfbf7] p-3 rounded-2xl border border-[#006233]/5">
                    <p className="text-xs font-black text-[#1a1a1a] mb-1">{comment.user_name}</p>
                    <p className="text-sm text-[#444] leading-relaxed">{comment.content}</p>
                    <p className="text-[9px] text-[#bbb] mt-2 font-mono">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function AuthModal({ initialMode = 'login', onClose, onSuccess }: { initialMode?: 'login' | 'signup', onClose: () => void, onSuccess: (u: User, t: string) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'eleve'>('student');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const data = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, institution })
      });
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (mode === 'signup') {
        alert('Compte créé ! Veuillez vérifier votre email (voir console serveur pour le lien de simulation).');
        setMode('login');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[#006233]">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h2>
            <button onClick={onClose} className="text-[#666] hover:text-black">
              <X size={24} />
            </button>
          </div>

          {error && <div className="bg-red-50 text-[#c1272d] p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Nom Complet</label>
                  <input 
                    required
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#0a66c2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Statut</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setRole('student')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                        role === 'student' ? "bg-[#006233] text-white border-[#006233]" : "bg-white text-[#666] border-[#dce6e9]"
                      )}
                    >
                      Étudiant
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('eleve')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                        role === 'eleve' ? "bg-[#c1272d] text-white border-[#c1272d]" : "bg-white text-[#666] border-[#dce6e9]"
                      )}
                    >
                      Élève (Bac)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Établissement</label>
                  <input 
                    required
                    type="text" 
                    value={institution} 
                    onChange={e => setInstitution(e.target.value)}
                    placeholder={role === 'student' ? "Ex: UM5 Rabat" : "Ex: Lycée My Youssef"}
                    className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#0a66c2]"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Email</label>
              <input 
                required
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Mot de passe</label>
              <input 
                required
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233]"
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input 
                type="checkbox" 
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#dce6e9] text-[#006233] focus:ring-[#006233]"
              />
              <label htmlFor="rememberMe" className="text-xs font-bold text-[#666] cursor-pointer select-none">
                Se souvenir de moi
              </label>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#006233] text-white py-3 rounded-full font-bold hover:bg-[#004d28] active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#006233]/20"
            >
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#666]">
            {mode === 'login' ? (
              <p>Nouveau sur la plateforme ? <button onClick={() => setMode('signup')} className="text-[#006233] font-black hover:underline">Créer un compte</button></p>
            ) : (
              <p>Déjà un compte ? <button onClick={() => setMode('login')} className="text-[#006233] font-black hover:underline">Se connecter</button></p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PostModal({ user, token, onClose, onSuccess }: { user: User, token: string, onClose: () => void, onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [school, setSchool] = useState('ENSA');
  const [loading, setLoading] = useState(false);

  const schools = ["ENSA", "ENCG", "FST", "UM5 Rabat", "EMI", "EHTP", "Medecine", "ISCAE", "ENA"];

  const handleSubmit = async () => {
    if (!content) return;
    setLoading(true);
    try {
      await safeFetchJson('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, school })
      });
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Nouvelle Publication</h3>
            <button onClick={onClose} className="text-[#666] hover:text-black">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-[#666] mb-1 uppercase">École concernée</label>
            <select 
              value={school}
              onChange={e => setSchool(e.target.value)}
              className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2 outline-none focus:border-[#006233]"
            >
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Partagez vos conseils, expériences ou questions..."
            className="w-full h-40 bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-3 outline-none focus:border-[#006233] resize-none mb-4"
          />

          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-full font-bold text-[#666] hover:bg-[#f3f2ef] active:scale-95 transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content}
              className="bg-[#006233] text-white px-8 py-2 rounded-full font-bold hover:bg-[#004d28] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#006233]/20"
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RegistrationModal({ schoolName, user, onClose }: { schoolName: string, user: User, onClose: () => void }) {
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const [average, setAverage] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await safeFetchJson('/api/registrations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          school_name: schoolName,
          full_name: fullName,
          email,
          phone,
          level,
          average: parseFloat(average),
          message
        })
      });
      
      setSuccess(true);
      
      // Prepare WhatsApp message
      const whatsappNumber = "212709793474";
      const text = `*Nouvelle Inscription - 3ALEM O T3ALEM*%0A%0A` +
                   `*École:* ${schoolName}%0A` +
                   `*Nom:* ${fullName}%0A` +
                   `*Niveau:* ${level}%0A` +
                   `*Moyenne:* ${average}%0A` +
                   `*Téléphone:* ${phone}%0A` +
                   `*Email:* ${email}%0A` +
                   (message ? `*Message:* ${message}` : "");
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-[32px] p-8 text-center"
        >
          <div className="w-20 h-20 bg-[#006233]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send size={32} className="text-[#006233]" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1a1a] mb-4">Demande Envoyée !</h2>
          <p className="text-[#666] mb-8 leading-relaxed">
            Votre demande d'inscription à <strong>{schoolName}</strong> a été envoyée avec succès à l’équipe <strong>3ALEM O T3ALEM</strong>.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-[#006233] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#006233]/20"
          >
            D'accord
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl my-8"
      >
        <div className="bg-[#006233] p-8 text-white relative">
          <h2 className="text-2xl font-black">Inscription : {schoolName}</h2>
          <p className="text-white/70 text-sm mt-2">Remplissez le formulaire pour postuler à cette école.</p>
          <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Nom Complet</label>
              <input 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Email</label>
              <input 
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Téléphone</label>
              <input 
                required
                placeholder="06..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Niveau Actuel</label>
              <select 
                required
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all appearance-none"
              >
                <option value="">Sélectionner...</option>
                <option value="Bac">Bac</option>
                <option value="Bac+1">Bac+1</option>
                <option value="Bac+2">Bac+2</option>
                <option value="Licence">Licence</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Moyenne (Note)</label>
            <input 
              required
              type="number"
              step="0.01"
              placeholder="Ex: 15.50"
              value={average}
              onChange={e => setAverage(e.target.value)}
              className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#999]">Message (Optionnel)</label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-[#fdfbf7] border border-[#006233]/10 rounded-xl px-4 py-3 outline-none focus:border-[#006233] transition-all h-24 resize-none"
            />
          </div>

          <div className="space-y-4">
            <button 
              disabled={loading}
              className="w-full bg-[#006233] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#006233]/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
            <p className="text-[10px] text-center text-[#999] font-medium leading-relaxed px-4">
              En envoyant votre demande, vos informations seront transmises à l'équipe 3ALEM O T3ALEM pour étude et suivi de votre dossier d'inscription.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await safeFetchJson('/api/registrations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRegistrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await safeFetchJson(`/api/registrations/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      fetchRegistrations();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center py-20 text-[#666]">Chargement des demandes...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-[#1a1a1a]">Demandes d'Inscription</h2>
        <div className="bg-[#006233] text-white px-4 py-2 rounded-xl text-xs font-black">
          {registrations.length} Demandes
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {registrations.map(reg => (
          <div key={reg.id} className="moroccan-card bg-white p-8 flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#006233]/10 rounded-2xl flex items-center justify-center font-black text-[#006233]">
                  {reg.full_name[0]}
                </div>
                <div>
                  <h4 className="font-black text-lg">{reg.full_name}</h4>
                  <p className="text-xs text-[#999] font-bold uppercase tracking-widest">{reg.school_name}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ml-auto md:ml-0",
                  reg.status === 'pending' ? "bg-yellow-100 text-yellow-700" : 
                  reg.status === 'accepted' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {reg.status === 'pending' ? 'En attente' : reg.status === 'accepted' ? 'Accepté' : 'Refusé'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#fdfbf7] p-3 rounded-xl border border-[#006233]/5">
                  <p className="text-[9px] font-bold text-[#999] uppercase">Moyenne</p>
                  <p className="text-sm font-black text-[#c1272d]">{reg.average}</p>
                </div>
                <div className="bg-[#fdfbf7] p-3 rounded-xl border border-[#006233]/5">
                  <p className="text-[9px] font-bold text-[#999] uppercase">Niveau</p>
                  <p className="text-sm font-black text-[#006233]">{reg.level}</p>
                </div>
                <div className="bg-[#fdfbf7] p-3 rounded-xl border border-[#006233]/5">
                  <p className="text-[9px] font-bold text-[#999] uppercase">Téléphone</p>
                  <p className="text-sm font-black text-[#1a1a1a]">{reg.phone}</p>
                </div>
                <div className="bg-[#fdfbf7] p-3 rounded-xl border border-[#006233]/5">
                  <p className="text-[9px] font-bold text-[#999] uppercase">Email</p>
                  <p className="text-sm font-black text-[#1a1a1a] truncate">{reg.email}</p>
                </div>
              </div>

              {reg.message && (
                <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#006233]/5 italic text-sm text-[#666]">
                  "{reg.message}"
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2 justify-center">
              <button 
                onClick={() => updateStatus(reg.id, 'accepted')}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-green-700 transition-colors"
              >
                Accepter
              </button>
              <button 
                onClick={() => updateStatus(reg.id, 'refused')}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-red-700 transition-colors"
              >
                Refuser
              </button>
              <button 
                onClick={() => updateStatus(reg.id, 'processed')}
                className="flex-1 bg-[#006233] text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-[#004d28] transition-colors"
              >
                Traité
              </button>
            </div>
          </div>
        ))}

        {registrations.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-[#006233]/10">
            <p className="text-[#999] font-bold">Aucune demande reçue pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ user, postsCount, likesCount, commentsCount, onEdit, onCommentAdded, onRegister }: { user: User, postsCount: number, likesCount: number, commentsCount: number, onEdit: () => void, onCommentAdded?: () => void, onRegister?: (name: string) => void }) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPosts();
  }, [user.id]);

  const fetchUserPosts = async () => {
    try {
      const data = await safeFetchJson('/api/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const filtered = data.filter((p: any) => p.user_id === user.id);
      setUserPosts(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Profil de ${user.name} | 3ALEM O T3ALEM`,
          url: profileUrl
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Lien du profil copié dans le presse-papier !');
      }
    } catch (err) {
      console.error('Erreur de partage:', err);
      // Fallback for some browsers/iframes
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Lien du profil copié !');
      } catch (e) {
        alert('Impossible de copier le lien. Voici l\'URL : ' + profileUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-8">
      <div className="moroccan-card bg-white relative overflow-hidden">
        <div className="h-64 relative overflow-hidden group">
          {user.banner_url ? (
            <img 
              src={user.banner_url} 
              className="w-full h-full object-cover"
              alt="banner"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#006233] via-[#d4af37] to-[#c1272d] relative">
              <div className="absolute inset-0 opacity-20 zellige-pattern" />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}
          <button 
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
          <img 
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=fff&color=006233&size=180&bold=true`} 
            className="w-48 h-48 rounded-3xl border-8 border-white shadow-2xl bg-white object-cover"
            alt="avatar"
          />
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-[#1a1a1a]">{user.name}</h1>
              <span className="bg-[#006233] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">Membre</span>
            </div>
            <p className="text-[#666] text-xl font-medium mt-1">
              {user.role === 'student' ? 'Étudiant' : 'Élève'} • {user.institution}
            </p>
            {user.major && (
              <p className="text-[#006233] font-bold mt-1">
                Filière : {user.major}
              </p>
            )}
            <div className="flex items-center gap-6 mt-4 text-sm text-[#999]">
              <span className="flex items-center gap-2 font-bold"><MapPin size={16} className="text-[#c1272d]" /> Maroc</span>
              <span className="flex items-center gap-2 font-bold"><School size={16} className="text-[#006233]" /> {user.institution}</span>
            </div>
          </div>
          <div className="flex gap-3 pb-4">
            <button onClick={onEdit} className="btn-morocco-primary active:scale-95 transition-all">
              Modifier Profil
            </button>
            <button 
              onClick={handleShare}
              className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-[#f3f2ef] text-[#666] hover:border-[#006233] hover:text-[#006233] active:scale-95 transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-4">
        <div className="moroccan-card bg-white p-6 text-center">
          <p className="text-3xl font-black text-[#006233]">{postsCount}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#999] mt-1">Conseils</p>
        </div>
        <div className="moroccan-card bg-white p-6 text-center">
          <p className="text-3xl font-black text-[#d4af37]">{likesCount}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#999] mt-1">Likes Reçus</p>
        </div>
        <div className="moroccan-card bg-white p-6 text-center">
          <p className="text-3xl font-black text-[#c1272d]">{commentsCount}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#999] mt-1">Commentaires</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="moroccan-card p-8 bg-white">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#006233] rounded-full" />
              À propos
            </h3>
            <p className="text-sm text-[#444] leading-relaxed mb-8 font-medium">
              {user.bio || "Passionné par l'ingénierie et le partage d'expérience. J'aide les élèves du Bac à choisir leur voie et à réussir leur orientation au Maroc."}
            </p>
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#c1272d] rounded-full" />
              Informations
            </h3>
            <div className="space-y-5">
              <InfoRow icon={<School size={20} className="text-[#006233]" />} label={user.institution || 'Non spécifié'} />
              <InfoRow icon={<GraduationCap size={20} className="text-[#d4af37]" />} label={user.major || 'Génie Informatique'} />
              <InfoRow icon={<MessageSquare size={20} className="text-[#c1272d]" />} label={user.email} />
            </div>
          </div>
        </aside>

        <main>
          <div className="moroccan-card p-8 bg-white min-h-[400px]">
            <h3 className="font-black text-xl mb-8 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#d4af37] rounded-full" />
              Mes Publications ({postsCount})
            </h3>
            
            {loading ? (
              <div className="text-center py-10 text-[#666]">Chargement de vos publications...</div>
            ) : userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#fdfbf7] rounded-3xl flex items-center justify-center mb-4 border-2 border-[#006233]/5">
                  <Plus size={32} className="text-[#006233]/20" />
                </div>
                <p className="text-[#999] font-bold">Vous n'avez pas encore publié de conseils.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user} 
                    onMessage={() => {}} 
                    onCommentAdded={onCommentAdded}
                    onRegister={onRegister}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function EditProfileModal({ user, onClose, onUpdate }: { user: User, onClose: () => void, onUpdate: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [major, setMajor] = useState(user.major || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(user.banner_url || '');
  const [loading, setLoading] = useState(false);

  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 400, 400, 0.7);
    setAvatarUrl(compressed);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 1200, 400, 0.6);
    setBannerUrl(compressed);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, bio, institution, major, avatar_url: avatarUrl, banner_url: bannerUrl })
      });
      onUpdate(data.user);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[#006233]">Modifier Profil</h2>
            <button onClick={onClose} className="text-[#666] hover:text-black">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Banner Upload */}
            <div>
              <label className="block text-xs font-bold text-[#666] mb-2 uppercase">Bannière du profil</label>
              <div className="relative h-32 w-full rounded-xl overflow-hidden group border-2 border-dashed border-[#006233]/20">
                {bannerUrl ? (
                  <img src={bannerUrl} className="w-full h-full object-cover" alt="banner preview" />
                ) : (
                  <div className="w-full h-full bg-[#fdfbf7] flex items-center justify-center text-[#999] text-xs font-bold">
                    Aucune bannière
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg font-bold text-sm">Changer la bannière</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative group">
                <img 
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${name}&background=fff&color=006233&size=120&bold=true`} 
                  className="w-24 h-24 rounded-3xl border-4 border-[#006233]/10 object-cover shadow-md"
                  alt="preview"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Plus size={24} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                  />
                </label>
              </div>
              <p className="text-[10px] font-bold text-[#999] mt-2 uppercase">Photo de profil</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Nom</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Établissement</label>
              <input 
                type="text" 
                value={institution} 
                onChange={e => setInstitution(e.target.value)}
                className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Filière / Spécialité</label>
              <input 
                type="text" 
                value={major} 
                onChange={e => setMajor(e.target.value)}
                placeholder="Ex: Génie Civil, Bac SM, etc."
                className="w-full bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#666] mb-1 uppercase">Bio</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)}
                className="w-full h-32 bg-[#f3f2ef] border border-[#dce6e9] rounded-lg px-4 py-2.5 outline-none focus:border-[#006233] resize-none"
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#006233] text-white py-3 rounded-full font-bold hover:bg-[#004d28] active:scale-[0.98] transition-all mt-4 shadow-lg shadow-[#006233]/20 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#666]">
      <div className="text-[#191919]">{icon}</div>
      <span>{label}</span>
    </div>
  );
}

function ChatWidget({ user, targetUser, onClose }: { user: User, targetUser: User, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({ 
        type: 'auth', 
        token: localStorage.getItem('token') 
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender_id: data.senderId,
            receiver_id: user.id,
            content: data.content,
            created_at: new Date().toISOString()
          }]);
        }
      } catch (e) {
        console.error('WS Message error:', e);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [user?.id]);

  const sendMsg = () => {
    if (!input || !ws || !user) return;
    ws.send(JSON.stringify({
      type: 'message',
      receiverId: targetUser.id,
      content: input
    }));
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: targetUser.id,
      content: input,
      created_at: new Date().toISOString()
    }]);
    setInput('');
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-0 right-8 w-80 bg-white border border-[#006233]/20 rounded-t-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden">
      <div className="bg-[#006233] text-white p-4 flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <span className="font-black text-sm tracking-wide">{targetUser.name}</span>
        </div>
        <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={20} /></button>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7] zellige-pattern">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={cn(
              "max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm",
              msg.sender_id === user.id 
                ? "bg-[#006233] text-white self-end ml-auto rounded-tr-none" 
                : "bg-white text-[#1a1a1a] self-start rounded-tl-none border border-[#006233]/10"
            )}
          >
            {msg.content}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-[#006233]/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={20} className="text-[#006233]/20" />
            </div>
            <p className="text-[#999] text-[10px] font-bold">Démarrer une conversation avec {targetUser.name}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#f3f2ef] flex gap-2 bg-white">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMsg()}
          placeholder="Écrivez un message..."
          className="flex-1 bg-[#fdfbf7] border border-[#e5e7eb] rounded-xl px-4 py-2 text-xs outline-none focus:border-[#006233] transition-all"
        />
        <button 
          onClick={sendMsg}
          className="w-10 h-10 bg-[#006233] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#006233]/20"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
