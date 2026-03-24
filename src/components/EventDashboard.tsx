import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Tournament, Match, Player, Season } from '../types';
import { Trophy, Target, Clock, Users, Zap, Skull, Shield, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export function EventDashboard() {
  const { isSyndicate } = useTheme();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [liveTournament, setLiveTournament] = useState<Tournament | null>(null);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);

  useEffect(() => {
    // Fetch active season
    const seasonQuery = query(collection(db, 'seasons'), where('active', '==', true), limit(1));
    const unsubSeason = onSnapshot(seasonQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSeason({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Season);
      }
    });

    // Fetch players
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const playerMap: Record<string, Player> = {};
      const playerList: Player[] = [];
      snapshot.docs.forEach(doc => {
        const p = { uid: doc.id, ...doc.data() } as Player;
        playerMap[doc.id] = p;
        playerList.push(p);
      });
      setPlayers(playerMap);
      setTopPlayers(playerList.sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0)).slice(0, 5));
    });

    // Fetch live matches
    const liveMatchesQuery = query(collection(db, 'matches'), where('status', '==', 'live'), limit(4));
    const unsubLive = onSnapshot(liveMatchesQuery, (snapshot) => {
      setLiveMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });

    // Fetch live tournament
    const liveTournamentQuery = query(collection(db, 'tournaments'), where('status', '==', 'live'), limit(1));
    const unsubTournament = onSnapshot(liveTournamentQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLiveTournament({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Tournament);
      } else {
        setLiveTournament(null);
      }
    });

    // Fetch recent results
    const recentResultsQuery = query(
      collection(db, 'matches'), 
      where('status', '==', 'completed'), 
      orderBy('round', 'desc'),
      limit(5)
    );
    const unsubRecent = onSnapshot(recentResultsQuery, (snapshot) => {
      setRecentResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });

    return () => {
      unsubSeason();
      unsubPlayers();
      unsubLive();
      unsubTournament();
      unsubRecent();
    };
  }, []);

  return (
    <div className={clsx(
      "flex flex-col gap-8",
      isSyndicate ? "text-nasty-cream" : "text-slate-900"
    )}>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={clsx(
            "p-4 rounded-2xl shadow-xl",
            isSyndicate ? "bg-syndicate-red" : "bg-indigo-600"
          )}>
            <Target className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className={clsx(
              "text-4xl font-black tracking-tighter uppercase",
              isSyndicate ? "font-rocker text-nasty-cream" : "text-slate-900"
            )}>
              Dart Club <span className={isSyndicate ? "text-syndicate-red" : "text-indigo-600"}>602</span>
            </h1>
            <p className={clsx(
              "text-lg font-bold opacity-60",
              isSyndicate ? "font-mono" : ""
            )}>
              {activeSeason?.name || 'Live Event Dashboard'} • {format(new Date(), 'EEEE, MMMM do')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={clsx(
            "px-6 py-3 rounded-2xl border flex items-center gap-3",
            isSyndicate ? "bg-black/40 border-syndicate-red/30" : "bg-white border-slate-200 shadow-sm"
          )}>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black uppercase tracking-widest text-xs">Venue Live Feed</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: Live Matches & Tournament Status */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Live Matches Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className={clsx("w-6 h-6", isSyndicate ? "text-syndicate-red" : "text-indigo-600")} />
              <h2 className="text-xl font-black uppercase tracking-widest">Live Matches</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {liveMatches.length > 0 ? (
                  liveMatches.map((match) => (
                    <LiveMatchCard 
                      key={match.id} 
                      match={match} 
                      players={players} 
                      isSyndicate={isSyndicate} 
                    />
                  ))
                ) : (
                  <div className={clsx(
                    "col-span-2 p-12 rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center",
                    isSyndicate ? "border-syndicate-red/20 bg-black/20" : "border-slate-200 bg-white"
                  )}>
                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-bold opacity-40">Waiting for next matches to start...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Tournament Overview */}
          {liveTournament && (
            <section className={clsx(
              "p-8 rounded-[2.5rem] border relative overflow-hidden",
              isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : "bg-white border-slate-200 shadow-xl"
            )}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "p-3 rounded-xl",
                    isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : "bg-indigo-100 text-indigo-600"
                  )}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{liveTournament.name}</h2>
                    <p className="text-sm font-bold opacity-60 uppercase tracking-widest">{liveTournament.gameType} • {liveTournament.type}</p>
                  </div>
                </div>
                <div className={clsx(
                  "px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest",
                  isSyndicate ? "bg-syndicate-red text-white" : "bg-indigo-600 text-white"
                )}>
                  Tournament in Progress
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Participants</p>
                  <p className="text-3xl font-black">{liveTournament.participants.length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Matches Played</p>
                  <p className="text-3xl font-black">{recentResults.filter(r => r.tournamentId === liveTournament.id).length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Status</p>
                  <p className="text-3xl font-black text-emerald-500 uppercase">Live</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Leaderboard & Recent Results */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Season Leaderboard */}
          <section className={clsx(
            "p-8 rounded-[2.5rem] border",
            isSyndicate ? "bg-black/40 border-syndicate-red/20" : "bg-white border-slate-200 shadow-lg"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <Users className={clsx("w-5 h-5", isSyndicate ? "text-syndicate-red" : "text-indigo-600")} />
              <h2 className="text-lg font-black uppercase tracking-widest">Season Leaders</h2>
            </div>
            
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <div key={player.uid} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-sm font-black opacity-20">0{index + 1}</span>
                    <img 
                      src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
                      className={clsx(
                        "w-10 h-10 rounded-xl object-cover",
                        isSyndicate && player.isVested && "stitched-red"
                      )}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className={clsx(
                        "font-bold truncate max-w-[120px]",
                        isSyndicate ? "font-rocker" : ""
                      )}>{player.name}</p>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{player.stats?.wins || 0} Wins</p>
                    </div>
                  </div>
                  <div className={clsx(
                    "text-xl font-black",
                    index === 0 ? "text-amber-500" : "opacity-40"
                  )}>
                    {player.stats?.wins || 0}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Results */}
          <section className={clsx(
            "p-8 rounded-[2.5rem] border",
            isSyndicate ? "bg-onyx border-syndicate-red/30" : "bg-slate-900 text-white border-slate-800 shadow-xl"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <Clock className={clsx("w-5 h-5", isSyndicate ? "text-syndicate-red" : "text-indigo-400")} />
              <h2 className="text-lg font-black uppercase tracking-widest">Recent Results</h2>
            </div>

            <div className="space-y-6">
              {recentResults.map((match) => (
                <div key={match.id} className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                    <span>Round {match.round}</span>
                    <span>Final</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex items-center justify-between">
                      <span className={clsx(
                        "font-bold truncate",
                        match.winnerId === match.player1Id ? "text-emerald-500" : "opacity-40"
                      )}>{players[match.player1Id]?.name || 'Unknown'}</span>
                      <span className="font-black ml-2">{match.score1}</span>
                    </div>
                    <span className="opacity-20 font-black">VS</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-black mr-2">{match.score2}</span>
                      <span className={clsx(
                        "font-bold truncate text-right",
                        match.winnerId === match.player2Id ? "text-emerald-500" : "opacity-40"
                      )}>{players[match.player2Id]?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function LiveMatchCard({ match, players, isSyndicate }: { match: Match, players: Record<string, Player>, isSyndicate: boolean }) {
  const p1 = players[match.player1Id];
  const p2 = players[match.player2Id];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        "p-8 rounded-[2.5rem] border relative overflow-hidden group",
        isSyndicate 
          ? "bg-onyx border-syndicate-red/30 merrowed-border" 
          : "bg-white border-slate-200 shadow-xl"
      )}
    >
      {/* Live Pulse */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live</span>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={p1?.photoURL || `https://ui-avatars.com/api/?name=${p1?.name}`}
              className={clsx(
                "w-16 h-16 rounded-2xl object-cover shadow-lg",
                isSyndicate && p1?.isVested && "stitched-red"
              )}
              referrerPolicy="no-referrer"
            />
            <div>
              <p className={clsx("text-xl font-black", isSyndicate ? "font-rocker" : "")}>{p1?.name}</p>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Player 1</p>
            </div>
          </div>
          <div className={clsx(
            "text-5xl font-black tabular-nums",
            isSyndicate ? "text-syndicate-red" : "text-indigo-600"
          )}>
            {match.score1}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={clsx(
            "h-px flex-1",
            isSyndicate ? "bg-syndicate-red/20" : "bg-slate-100"
          )} />
          <span className="text-xs font-black uppercase tracking-widest opacity-20">Match Point</span>
          <div className={clsx(
            "h-px flex-1",
            isSyndicate ? "bg-syndicate-red/20" : "bg-slate-100"
          )} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={p2?.photoURL || `https://ui-avatars.com/api/?name=${p2?.name}`}
              className={clsx(
                "w-16 h-16 rounded-2xl object-cover shadow-lg",
                isSyndicate && p2?.isVested && "stitched-red"
              )}
              referrerPolicy="no-referrer"
            />
            <div>
              <p className={clsx("text-xl font-black", isSyndicate ? "font-rocker" : "")}>{p2?.name}</p>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Player 2</p>
            </div>
          </div>
          <div className={clsx(
            "text-5xl font-black tabular-nums",
            isSyndicate ? "text-syndicate-red" : "text-indigo-600"
          )}>
            {match.score2}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
        <motion.div 
          className={clsx(
            "h-full",
            isSyndicate ? "bg-syndicate-red" : "bg-indigo-600"
          )}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <p className={clsx("text-2xl font-black", color)}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {icon}
      <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-[2rem] border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center">
      <Clock className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-lg font-bold opacity-40">{message}</p>
    </div>
  );
}
