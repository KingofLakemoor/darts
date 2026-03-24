import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Player } from '../types';
import { Users, Trophy, Target, TrendingUp, Search } from 'lucide-react';

export function PlayerView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">Players</h1>
          <p className="text-slate-500 text-lg">The elite community of Dart Club 602.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map(player => (
          <div key={player.uid} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-5 mb-8">
              <img 
                src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 group-hover:ring-indigo-50 transition-all"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{player.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Wins" value={player.stats?.wins || 0} icon={<Trophy className="w-4 h-4 text-amber-500" />} />
              <StatBox label="Avg Score" value={player.stats?.avgScore || 0} icon={<Target className="w-4 h-4 text-indigo-500" />} />
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
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
