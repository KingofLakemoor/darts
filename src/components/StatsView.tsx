import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Player } from '../types';
import { TrendingUp, Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatsView() {
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
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">Statistics</h1>
          <p className="text-slate-500 text-lg">Detailed performance metrics for all club members.</p>
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

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Player</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Won Legs %</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Avg</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">9-Avg</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Dbl CO %</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Sgl CO %</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Top Leg</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Top Finish</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Top Score</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Top Avg</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">180s</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">170+</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">130+</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">90+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.map(player => {
                const stats = player.stats;
                const wonLegsPerc = (stats?.totalLegs && stats?.wonLegs) ? ((stats.wonLegs / stats.totalLegs) * 100).toFixed(1) : '0.0';
                const dblCO = (stats?.dblCheckoutAttempts && stats?.dblCheckout) ? ((stats.dblCheckout / stats.dblCheckoutAttempts) * 100).toFixed(1) : '0.0';
                const sglCO = (stats?.sglCheckoutAttempts && stats?.sglCheckout) ? ((stats.sglCheckout / stats.sglCheckoutAttempts) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={player.uid} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100">
                      <div className="flex items-center gap-4">
                        <img 
                          src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-bold text-slate-900 whitespace-nowrap">{player.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-900">{wonLegsPerc}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-indigo-600">{stats?.avg?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-500">{stats?.nineAvg?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-emerald-600">{dblCO}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-emerald-500">{sglCO}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-900">{stats?.topLeg || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-900">{stats?.topFinish || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-900">{stats?.topScore || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-sm font-black text-slate-900">{stats?.topAvg?.toFixed(1) || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 text-xs font-black">
                        {stats?.count180s || 0}
                      </div>
                    </td>
                    <td className="p-6 text-center text-sm font-bold text-slate-600">{stats?.count170plus || 0}</td>
                    <td className="p-6 text-center text-sm font-bold text-slate-600">{stats?.count130plus || 0}</td>
                    <td className="p-6 text-center text-sm font-bold text-slate-600">{stats?.count90plus || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
