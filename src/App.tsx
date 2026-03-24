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
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Player, Tournament, Season } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminPanel } from './components/AdminPanel';
import { TournamentView } from './components/TournamentView';
import { PlayerView } from './components/PlayerView';
import { StatsView } from './components/StatsView';
import { ScorerView } from './components/ScorerView';
import { SyndicateScorer } from './components/SyndicateScorer';
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
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'players' | 'stats' | 'admin' | 'syndicate'>('syndicate');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const playerDoc = await getDoc(doc(db, 'players', firebaseUser.uid));
        if (playerDoc.exists()) {
          setPlayer(playerDoc.data() as Player);
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
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tournaments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setTournaments(docs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'seasons'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSeason({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Season);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Target className="w-12 h-12 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_70%)]" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center"
        >
          <div className="bg-indigo-600/20 p-4 rounded-3xl inline-block mb-8 backdrop-blur-xl border border-indigo-500/20">
            <Target className="w-16 h-16 text-indigo-400" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Dart Club <span className="text-indigo-500">602</span>
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-md mx-auto font-light leading-relaxed">
            The official scoring and tournament management system for the elite 602 dart community.
          </p>
          <button
            onClick={handleLogin}
            className="group relative bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all duration-300 flex items-center gap-3 mx-auto shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col z-20">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Dart Club 602</span>
            </div>

            <nav className="space-y-2">
              <NavIcon 
                icon={<Skull className="w-5 h-5" />} 
                active={activeTab === 'syndicate'} 
                onClick={() => setActiveTab('syndicate')}
                label="Syndicate Mode"
                variant="syndicate"
              />
              <NavIcon 
                icon={<Trophy className="w-5 h-5" />} 
                active={activeTab === 'tournaments'} 
                onClick={() => setActiveTab('tournaments')}
                label="Tournaments"
              />
              <NavIcon 
                icon={<Users className="w-5 h-5" />} 
                active={activeTab === 'players'} 
                onClick={() => setActiveTab('players')}
                label="Players"
              />
              <NavIcon 
                icon={<BarChart3 className="w-5 h-5" />} 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')}
                label="Statistics"
              />
              {player?.role === 'admin' && (
                <NavIcon 
                  icon={<Settings className="w-5 h-5" />} 
                  active={activeTab === 'admin'} 
                  onClick={() => setActiveTab('admin')}
                  label="Admin Panel"
                />
              )}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={player?.photoURL || `https://ui-avatars.com/api/?name=${player?.name}`} 
                alt={player?.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{player?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{player?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'syndicate' && (
                <SyndicateScorer />
              )}
              {activeTab === 'tournaments' && (
                <TournamentView tournaments={tournaments} season={activeSeason} />
              )}
              {activeTab === 'players' && (
                <PlayerView />
              )}
              {activeTab === 'stats' && (
                <StatsView />
              )}
              {activeTab === 'admin' && player?.role === 'admin' && (
                <AdminPanel />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function NavIcon({ icon, active, onClick, label, variant }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string, variant?: 'default' | 'syndicate' }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 font-semibold text-sm",
        active 
          ? variant === 'syndicate'
            ? "bg-syndicate-red text-nasty-cream shadow-[0_0_20px_rgba(139,0,0,0.4)] merrowed-border"
            : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
