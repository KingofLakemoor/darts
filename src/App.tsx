/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  User,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
  doc
} from './firebase';
import { Player, Tournament, View, Season } from './types';
import { 
  Trophy, 
  Users, 
  Target, 
  Layout, 
  LogOut, 
  LogIn, 
  Plus, 
  ChevronRight,
  Settings,
  History,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Components
import PlayerView from './components/PlayerView';
import TournamentView from './components/TournamentView';
import ScorerView from './components/ScorerView';
import BracketView from './components/BracketView';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Player | null>(null);
  const [view, setView] = useState<View>('home');
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkPlayerProfile = async () => {
      try {
        // 1. Check if profile exists by UID
        const playerDoc = await getDoc(doc(db, 'players', user.uid));
        const isDefaultAdmin = user.email?.toLowerCase() === 'kingoflakemoor@gmail.com';

        if (playerDoc.exists()) {
          // Ensure default admin has correct role/permissions even if profile existed
          if (isDefaultAdmin && playerDoc.data().role !== 'admin') {
            await updateDoc(doc(db, 'players', user.uid), {
              role: 'admin',
              permissions: ['manage_users', 'manage_seasons', 'manage_events', 'edit_scores']
            });
          }
          return;
        }

        // 2. Check if profile exists by email (to link manually added players)
        const q = query(collection(db, 'players'), where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Link existing profile to this UID
          const existingDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'players', existingDoc.id), {
            uid: user.uid,
            photoURL: user.photoURL // Update photo if available
          });
          return;
        }

        // 3. Create new player profile if none found
        const nameParts = (user.displayName || 'Anonymous User').split(' ');
        const firstName = nameParts[0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
        const formattedName = `${firstName} ${lastInitial}`.trim();

        await setDoc(doc(db, 'players', user.uid), {
          name: formattedName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
          role: isDefaultAdmin ? 'admin' : 'player',
          permissions: isDefaultAdmin ? ['manage_users', 'manage_seasons', 'manage_events', 'edit_scores'] : [],
          stats: {
            wins: 0,
            losses: 0,
            avgScore: 0
          }
        });
      } catch (error) {
        console.error("Error checking/creating player profile:", error);
      }
    };

    checkPlayerProfile();

    const unsubProfile = onSnapshot(doc(db, 'players', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUserProfile({ id: snapshot.id, ...snapshot.data() } as Player);
      }
    });

    const qPlayers = query(collection(db, 'players'), orderBy('name'));
    const unsubPlayers = onSnapshot(qPlayers, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });

    const qTournaments = query(collection(db, 'tournaments'), orderBy('date', 'desc'));
    const unsubTournaments = onSnapshot(qTournaments, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)));
    });

    const qSeasons = query(collection(db, 'seasons'), orderBy('startDate', 'desc'));
    const unsubSeasons = onSnapshot(qSeasons, (snapshot) => {
      setSeasons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
    });

    return () => {
      unsubProfile();
      unsubPlayers();
      unsubTournaments();
      unsubSeasons();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
              <img src="/logo.png" alt="Dart Club 602 Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 italic serif">DART CLUB 602</h1>
          <p className="text-zinc-400 mb-8 text-lg">Official Scoring & Bracket System (DCII)</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
          >
            <LogIn className="w-6 h-6" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'players': return <PlayerView players={players} />;
      case 'tournaments': return <TournamentView tournaments={tournaments} players={players} currentUser={currentUserProfile} seasons={seasons} />;
      case 'scorer': return <ScorerView players={players} />;
      case 'bracket': return <BracketView tournaments={tournaments} players={players} currentUser={currentUserProfile} />;
      case 'admin': return <AdminPanel currentUser={currentUserProfile} userEmail={user?.email} />;
      default: return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <DashboardCard 
        title="Live Scorer" 
        desc="Start a new match or join a live one" 
        icon={<Target className="w-8 h-8" />} 
        onClick={() => setView('scorer')}
        color="amber"
      />
          <DashboardCard 
            title="Tournaments" 
            desc="Manage brackets and league standings" 
            icon={<Trophy className="w-8 h-8" />} 
            onClick={() => setView('tournaments')}
            color="amber"
          />
          <DashboardCard 
            title="Players" 
            desc="View stats and league members" 
            icon={<Users className="w-8 h-8" />} 
            onClick={() => setView('players')}
            color="blue"
          />
          { (currentUserProfile?.role === 'admin' || user.email?.toLowerCase() === 'kingoflakemoor@gmail.com') ? (
            <DashboardCard 
              title="Admin Panel" 
              desc="Manage users, seasons, and events" 
              icon={<Shield className="w-8 h-8" />} 
              onClick={() => setView('admin')}
              color="purple"
            />
          ) : (
            <DashboardCard 
              title="History" 
              desc="Review past matches and results" 
              icon={<History className="w-8 h-8" />} 
              onClick={() => setView('bracket')}
              color="purple"
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar / Nav */}
      <nav className="fixed bottom-0 left-0 w-full md:w-20 md:h-full bg-zinc-900/50 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 flex md:flex-col items-center justify-between p-4 z-50">
        <div className="hidden md:flex flex-col items-center gap-8 mb-8">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain cursor-pointer" 
            onClick={() => setView('home')} 
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex md:flex-col items-center gap-6 md:gap-8 w-full justify-around md:justify-center">
          <NavIcon icon={<Layout />} active={view === 'home'} onClick={() => setView('home')} label="Home" />
          <NavIcon icon={<Target />} active={view === 'scorer'} onClick={() => setView('scorer')} label="Scorer" />
          <NavIcon icon={<Trophy />} active={view === 'tournaments'} onClick={() => setView('tournaments')} label="League" />
          <NavIcon icon={<Users />} active={view === 'players'} onClick={() => setView('players')} label="Players" />
          {(currentUserProfile?.role === 'admin' || user.email?.toLowerCase() === 'kingoflakemoor@gmail.com') && (
            <NavIcon icon={<Shield className="w-6 h-6" />} active={view === 'admin'} onClick={() => setView('admin')} label="Admin" />
          )}
        </div>

        <div className="hidden md:flex flex-col items-center gap-4 mt-auto">
          <button onClick={handleLogout} className="p-3 text-zinc-500 hover:text-white transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-20 pb-24 md:pb-0 min-h-screen">
        <header className="p-6 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-40">
          <div>
            <h2 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Dart Club 602</h2>
            <h1 className="text-2xl font-bold tracking-tight capitalize">{view === 'home' ? 'Dashboard' : view}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium flex items-center gap-2">
                {user.displayName}
                {(currentUserProfile?.role === 'admin' || user.email?.toLowerCase() === 'kingoflakemoor@gmail.com') && (
                  <Shield className="w-3 h-3 text-purple-500" />
                )}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                {(currentUserProfile?.role === 'admin' || user.email?.toLowerCase() === 'kingoflakemoor@gmail.com') ? 'League Admin' : 'League Member'}
              </span>
            </div>
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavIcon({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-xl transition-all group flex flex-col items-center",
        active ? "bg-amber-500/10 text-amber-500" : "text-zinc-500 hover:text-white"
      )}
    >
      {icon}
      <span className="text-[10px] mt-1 font-bold md:hidden">{label}</span>
      {active && <motion.div layoutId="activeNav" className="absolute -left-4 w-1 h-6 bg-amber-500 rounded-r-full hidden md:block" />}
    </button>
  );
}

function DashboardCard({ title, desc, icon, onClick, color }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void, color: 'emerald' | 'amber' | 'blue' | 'purple' }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <button 
      onClick={onClick}
      className="group p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-left hover:bg-zinc-900/60 transition-all flex flex-col gap-6"
    >
      <div className={cn("p-4 rounded-2xl border w-fit transition-transform group-hover:scale-110", colors[color])}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          {title}
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}
