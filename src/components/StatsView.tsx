import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Player } from '../types';
import { TrendingUp, Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';

export function StatsView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isSyndicate, isDark } = useTheme();

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
          <h1 className={clsx(
            "text-5xl font-bold tracking-tight mb-2",
            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
          )}>Statistics</h1>
          <p className={clsx(
            "text-lg",
            isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
          )}>Detailed performance metrics for all club members.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className={clsx("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400")} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={clsx(
              "w-full pl-12 pr-4 py-3 outline-none transition-all shadow-sm rounded-2xl",
              isSyndicate 
                ? "bg-onyx border border-syndicate-red/30 text-nasty-cream focus:ring-2 focus:ring-syndicate-red" 
                : isDark ? "bg-slate-900 border border-slate-800 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500"
            )}
          />
        </div>
      </header>

      <div className={clsx(
        "rounded-[2.5rem] border shadow-xl overflow-hidden",
        isSyndicate ? "bg-onyx border-syndicate-red/30 merrowed-border" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={clsx(
                "border-b",
                isSyndicate ? "bg-onyx border-syndicate-red/30" : isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
              )}>
                <th className={clsx(
                  "p-6 font-black text-[10px] uppercase tracking-widest sticky left-0 z-10",
                  isSyndicate ? "bg-onyx text-steel-gray" : isDark ? "bg-slate-900 text-slate-400" : "bg-slate-50 text-slate-400"
                )}>Player</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Won Legs %</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Avg</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>9-Avg</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Dbl CO %</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Sgl CO %</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Top Leg</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Top Finish</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Top Score</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>Top Avg</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>180s</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>170+</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>130+</th>
                <th className={clsx("p-6 font-black text-[10px] uppercase tracking-widest text-center", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-400")}>90+</th>
              </tr>
            </thead>
            <tbody className={clsx(
              "divide-y",
              isSyndicate ? "divide-syndicate-red/10" : isDark ? "divide-slate-800" : "divide-slate-100"
            )}>
              {filteredPlayers.map(player => {
                const stats = player.stats;
                const wonLegsPerc = (stats?.totalLegs && stats?.wonLegs) ? ((stats.wonLegs / stats.totalLegs) * 100).toFixed(1) : '0.0';
                const dblCO = (stats?.dblCheckoutAttempts && stats?.dblCheckout) ? ((stats.dblCheckout / stats.dblCheckoutAttempts) * 100).toFixed(1) : '0.0';
                const sglCO = (stats?.sglCheckoutAttempts && stats?.sglCheckout) ? ((stats.sglCheckout / stats.sglCheckoutAttempts) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={player.uid} className={clsx(
                    "transition-colors group",
                    isSyndicate ? "hover:bg-syndicate-red/5" : isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"
                  )}>
                    <td className={clsx(
                      "p-6 sticky left-0 z-10 border-r",
                      isSyndicate ? "bg-onyx border-syndicate-red/10 group-hover:bg-syndicate-red/5" : isDark ? "bg-slate-900 border-slate-800 group-hover:bg-slate-800/50" : "bg-white border-slate-100 group-hover:bg-slate-50/50"
                    )}>
                      <div className="flex items-center gap-4">
                        <img 
                          src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
                          className={clsx(
                            "w-10 h-10 rounded-xl object-cover",
                            isSyndicate ? "stitched-red" : isDark ? "ring-2 ring-slate-800" : "ring-2 ring-slate-100"
                          )}
                          referrerPolicy="no-referrer"
                        />
                        <span className={clsx("font-bold whitespace-nowrap", isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900")}>{player.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{wonLegsPerc}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-syndicate-red" : isDark ? "text-indigo-400" : "text-indigo-600")}>{stats?.avg?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500")}>{stats?.nineAvg?.toFixed(1) || '0.0'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>{dblCO}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isDark ? "text-emerald-400" : "text-emerald-500")}>{sglCO}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{stats?.topLeg || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{stats?.topFinish || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{stats?.topScore || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx("text-sm font-black", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{stats?.topAvg?.toFixed(1) || '-'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <div className={clsx(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black",
                        isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700"
                      )}>
                        {stats?.count180s || 0}
                      </div>
                    </td>
                    <td className={clsx("p-6 text-center text-sm font-bold", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-600")}>{stats?.count170plus || 0}</td>
                    <td className={clsx("p-6 text-center text-sm font-bold", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-600")}>{stats?.count130plus || 0}</td>
                    <td className={clsx("p-6 text-center text-sm font-bold", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-600")}>{stats?.count90plus || 0}</td>
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
