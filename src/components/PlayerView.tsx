import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Player } from '../types';
import { Users, Trophy, Target, TrendingUp, Search, Shield, Skull } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';

export function PlayerView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isSyndicate } = useTheme();

  useEffect(() => {
    const q = query(collection(db, 'players'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Player)));
    });
  }, []);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={clsx(
            "text-5xl font-bold tracking-tight mb-2",
            isSyndicate ? "text-nasty-cream font-rocker" : "text-slate-900"
          )}>Players</h1>
          <p className={clsx(
            "text-lg",
            isSyndicate ? "text-steel-gray" : "text-slate-500"
          )}>The elite community of Dart Club 602.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className={clsx("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", isSyndicate ? "text-syndicate-red" : "text-slate-400")} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={clsx(
              "w-full pl-12 pr-4 py-3 outline-none transition-all shadow-sm rounded-2xl",
              isSyndicate 
                ? "bg-onyx border border-syndicate-red/30 text-nasty-cream focus:ring-2 focus:ring-syndicate-red" 
                : "bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500"
            )}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map(player => (
          <div key={player.uid} className={clsx(
            "p-8 rounded-3xl border transition-all group",
            isSyndicate 
              ? "bg-onyx border-syndicate-red/30 hover:border-syndicate-red hover:shadow-[0_0_30px_rgba(139,0,0,0.2)] merrowed-border" 
              : "bg-white border-slate-200 shadow-sm hover:shadow-md"
          )}>
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <img 
                  src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
                  className={clsx(
                    "w-16 h-16 rounded-2xl object-cover transition-all",
                    isSyndicate 
                      ? (player.isVested ? "stitched-red" : "border-2 border-steel-gray")
                      : "ring-4 ring-slate-50 group-hover:ring-indigo-50"
                  )}
                  referrerPolicy="no-referrer"
                />
                {isSyndicate && player.isVested && (
                  <div className="absolute -top-2 -right-2 bg-syndicate-red p-1 rounded-full shadow-lg">
                    <Shield className="w-4 h-4 text-nasty-cream" />
                  </div>
                )}
              </div>
              <div>
                <h3 className={clsx(
                  "text-xl font-bold",
                  isSyndicate ? "text-nasty-cream font-rocker" : "text-slate-900"
                )}>{player.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-xs font-bold uppercase tracking-widest",
                    isSyndicate ? "text-syndicate-red" : "text-indigo-600"
                  )}>{player.role}</span>
                  {isSyndicate && player.isVested && (
                    <span className="text-[10px] font-black text-bounty-gold uppercase tracking-tighter">Vested</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Wins" value={player.stats?.wins || 0} icon={<Trophy className="w-4 h-4 text-amber-500" />} />
              <StatBox label="Avg Score" value={player.stats?.avgScore || 0} icon={<Target className={clsx("w-4 h-4", isSyndicate ? "text-syndicate-red" : "text-indigo-500")} />} />
              <StatBox label="High Score" value={player.stats?.highScore || 0} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
              <StatBox label="Losses" value={player.stats?.losses || 0} icon={<Users className="w-4 h-4 text-slate-400" />} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
  const { isSyndicate } = useTheme();
  return (
    <div className={clsx(
      "p-4 rounded-2xl border",
      isSyndicate ? "bg-onyx/50 border-syndicate-red/20" : "bg-slate-50 border-slate-100"
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className={clsx(
          "text-[10px] font-black uppercase tracking-widest",
          isSyndicate ? "text-steel-gray" : "text-slate-400"
        )}>{label}</span>
      </div>
      <p className={clsx(
        "text-xl font-black tabular-nums",
        isSyndicate ? "text-nasty-cream" : "text-slate-900"
      )}>{value}</p>
    </div>
  );
}
