import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Player, Tournament, Season, Match, X01Config, Venue } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './lib/ThemeContext';
import { AdminPanel } from './components/AdminPanel';
import { TournamentView } from './components/TournamentView';
import { PlayerView } from './components/PlayerView';
import { StatsView } from './components/StatsView';
import { ScorerView } from './components/ScorerView';
import { StandaloneScorer } from './components/StandaloneScorer';
import { SyndicateScorer } from './components/SyndicateScorer';
import { EventDashboard } from './components/EventDashboard';
import { ThemeProvider } from './lib/ThemeContext';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  LogIn,
  ChevronRight,
  Target,
  BarChart3,
  Skull,
  Zap,
  Monitor,
  Menu,
  X,
  Calculator,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'players' | 'stats' | 'admin' | 'dashboard' | 'scorer' | 'syndicate'>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/venue')) return 'dashboard';
    if (path.startsWith('/players')) return 'players';
    if (path.startsWith('/stats')) return 'stats';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/scorer')) return 'scorer';
    if (path.startsWith('/syndicate')) return 'syndicate';
    return 'tournaments';
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { theme, toggleTheme, isSyndicate, isDark, isLight } = useTheme();

  useEffect(() => {
    // Apply theme class to body
    document.body.classList.remove('theme-syndicate', 'theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    const paths: Record<string, string> = {
      dashboard: '/venue',
      players: '/players',
      stats: '/stats',
      admin: '/admin',
      scorer: '/scorer',
      syndicate: '/syndicate',
      tournaments: '/'
    };
    const currentPath = window.location.pathname;
    const targetPath = paths[activeTab];
    if (currentPath !== targetPath && targetPath !== undefined) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/venue')) setActiveTab('dashboard');
      else if (path.startsWith('/players')) setActiveTab('players');
      else if (path.startsWith('/stats')) setActiveTab('stats');
      else if (path.startsWith('/admin')) setActiveTab('admin');
      else if (path.startsWith('/scorer')) setActiveTab('scorer');
      else if (path.startsWith('/syndicate')) setActiveTab('syndicate');
      else setActiveTab('tournaments');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const playerDoc = await getDoc(doc(db, 'players', firebaseUser.uid));
        if (playerDoc.exists()) {
          setPlayer({ uid: playerDoc.id, ...playerDoc.data() } as Player);
        } else {
          // Check for placeholder account with same email
          const playersRef = collection(db, 'players');
          const q = query(playersRef, where('email', '==', firebaseUser.email), where('isPlaceholder', '==', true));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const placeholderDoc = querySnapshot.docs[0];
            const placeholderData = placeholderDoc.data() as Player;
            
            // Merge data
            const mergedPlayer: Player = {
              ...placeholderData,
              uid: firebaseUser.uid,
              photoURL: firebaseUser.photoURL || placeholderData.photoURL || '',
              isPlaceholder: false
            };
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'players', firebaseUser.uid), mergedPlayer);
            
            // Update tournament participants
            const tournamentsRef = collection(db, 'tournaments');
            const qTournaments = query(tournamentsRef, where('participants', 'array-contains', placeholderDoc.id));
            const tournamentsSnapshot = await getDocs(qTournaments);

            tournamentsSnapshot.docs.forEach((tDoc) => {
              const tData = tDoc.data() as Tournament;
              const newParticipants = tData.participants.map(pId =>
                pId === placeholderDoc.id ? firebaseUser.uid : pId
              );
              batch.update(doc(db, 'tournaments', tDoc.id), { participants: newParticipants });
            });
            
            // Delete placeholder
            batch.delete(doc(db, 'players', placeholderDoc.id));

            await batch.commit();
            
            setPlayer(mergedPlayer);
          } else {
            const newPlayer: Player = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'player',
              stats: { wins: 0, losses: 0, avgScore: 0, highScore: 0 }
            };
            await setDoc(doc(db, 'players', firebaseUser.uid), newPlayer);
            setPlayer(newPlayer);
          }
        }
      } else {
        setPlayer(null);
        const path = window.location.pathname;
        if (path.startsWith('/scorer')) {
          setActiveTab('scorer');
        } else if (path.startsWith('/stats')) {
          setActiveTab('stats');
        } else {
          setActiveTab('dashboard');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'venues'), (snapshot) => {
      setVenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue)));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setTournaments(docs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'seasons'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSeason({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Season);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      console.error('Login error:', error);
      // Ignore user cancelled error
      if (error && typeof error === "object" && "code" in error && error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        alert('Sign-in failed. Please try again or check your browser settings.');
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className={clsx(
        "min-h-screen flex items-center justify-center",
        isSyndicate ? "bg-onyx" : isDark ? "bg-slate-900" : "bg-slate-50"
      )}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Target className={clsx(
            "w-12 h-12",
            isSyndicate ? "text-syndicate-red" : isDark ? "text-indigo-400" : "text-indigo-600"
          )} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "min-h-screen flex flex-col transition-colors duration-300 relative",
      isSyndicate ? "bg-onyx text-nasty-cream" : isDark ? "bg-slate-900 text-slate-50" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={clsx(
                  "fixed top-0 left-0 bottom-0 w-72 border-r flex flex-col z-50 transition-colors duration-300 shadow-2xl",
                  isSyndicate ? "bg-onyx border-syndicate-red/30" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "p-2 rounded-xl",
                        isSyndicate ? "bg-syndicate-red" : isDark ? "bg-indigo-500" : "bg-indigo-600"
                      )}>
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <span className={clsx(
                        "text-xl font-bold tracking-tight",
                        isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
                      )}>Dart Club 602</span>
                    </div>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className={clsx(
                        "p-2 rounded-lg transition-colors",
                        isSyndicate ? "hover:bg-syndicate-red/10 text-steel-gray" : isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-2">
                    <NavIcon 
                      icon={<Monitor className="w-5 h-5" />} 
                      active={activeTab === 'dashboard'} 
                      onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                      label="Venue Dashboard"
                    />
                    <NavIcon
                      icon={<Calculator className="w-5 h-5" />}
                      active={activeTab === 'scorer'}
                      onClick={() => { setActiveTab('scorer'); setIsSidebarOpen(false); }}
                      label="Offline Scoreboard"
                    />
                    {user && (
                      <>
                        <NavIcon
                          icon={<Trophy className="w-5 h-5" />}
                          active={activeTab === 'tournaments'}
                          onClick={() => { setActiveTab('tournaments'); setIsSidebarOpen(false); }}
                          label="Tournaments"
                        />
                        <NavIcon
                          icon={<Users className="w-5 h-5" />}
                          active={activeTab === 'players'}
                          onClick={() => { setActiveTab('players'); setIsSidebarOpen(false); }}
                          label="Players"
                        />
                        <NavIcon
                          icon={<BarChart3 className="w-5 h-5" />}
                          active={activeTab === 'stats'}
                          onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
                          label="Statistics"
                        />
                        {(player?.role === 'admin' || player?.role === 'coordinator') && (
                          <NavIcon
                            icon={<Settings className="w-5 h-5" />}
                            active={activeTab === 'admin'}
                            onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}
                            label="Admin Panel"
                          />
                        )}
                      </>
                    )}
                  </nav>
                </div>

                <div className={clsx(
                  "mt-auto p-8 border-t transition-colors duration-300",
                  isSyndicate ? "border-syndicate-red/30" : isDark ? "border-slate-800" : "border-slate-100"
                )}>
                  <div className="mb-6 flex items-center justify-between">
                    <span className={clsx("text-sm font-medium", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500")}>
                      Theme
                    </span>
                    <button
                      onClick={toggleTheme}
                      disabled={isSyndicate}
                      className={clsx(
                        "p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                        isSyndicate ? "bg-onyx/50 text-syndicate-red" :
                        isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" :
                        "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                      title={isSyndicate ? "Theme locked in Syndicate Mode" : `Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
                    >
                      {isSyndicate ? <Skull className="w-5 h-5" /> : isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>

                  {user ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <img
                          src={player?.photoURL || `https://ui-avatars.com/api/?name=${player?.name}`}
                          alt={player?.name}
                          className={clsx(
                            "w-10 h-10 rounded-xl object-cover",
                            isSyndicate ? "stitched-red" : isDark ? "ring-2 ring-slate-800" : "ring-2 ring-slate-100"
                          )}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            "text-sm font-bold truncate",
                            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
                          )}>{player?.name}</p>
                          <p className={clsx(
                            "text-xs capitalize",
                            isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
                          )}>{player?.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                          isSyndicate
                            ? "text-steel-gray hover:text-syndicate-red hover:bg-onyx/50"
                            : isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                        )}
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                        isSyndicate
                          ? "bg-syndicate-red/20 text-syndicate-red hover:bg-syndicate-red/30"
                          : isDark ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      )}
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </button>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-12 pt-24 lg:pt-24 relative">
            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={clsx(
                "fixed top-6 left-6 z-30 p-3 rounded-2xl shadow-xl transition-all active:scale-95",
                isSyndicate
                  ? "bg-syndicate-red text-white shadow-syndicate-red/20" 
                  : isDark ? "bg-slate-800 text-slate-300 border border-slate-700 shadow-black/50" : "bg-white text-slate-900 border border-slate-200 shadow-slate-200/50"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <EventDashboard />
              )}
              {activeTab === 'tournaments' && (
                <TournamentView tournaments={tournaments} season={activeSeason} venues={venues} />
              )}
              {activeTab === 'players' && (
                <PlayerView />
              )}
              {activeTab === 'stats' && (
                <StatsView />
              )}
              {activeTab === 'scorer' && (
                <StandaloneScorer />
              )}
              {activeTab === 'syndicate' && (
                <SyndicateScorer />
              )}
              {activeTab === 'admin' && (player?.role === 'admin' || player?.role === 'coordinator') && (
                <AdminPanel currentUser={player} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function NavIcon({ icon, active, onClick, label, variant }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string, variant?: 'default' | 'syndicate' }) {
  const { isSyndicate, isDark } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 font-semibold text-sm",
        active 
          ? isSyndicate
            ? "bg-syndicate-red text-nasty-cream shadow-[0_0_20px_rgba(139,0,0,0.4)] merrowed-border"
            : isDark ? "bg-indigo-500 text-white shadow-lg shadow-indigo-900 translate-x-1" : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1"
          : isSyndicate
            ? "text-steel-gray hover:bg-onyx/50 hover:text-nasty-cream"
            : isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
