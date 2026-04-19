import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Tournament, Match, Player } from '../types';
import { Trophy, Target, Users, Play, CheckCircle2, Layout, List, Shield, Skull, FastForward, XCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { generateBracket } from '../utils/bracket';
import { removeUndefinedFields } from '../utils/firestore';
import { ScorerView } from './ScorerView';
import { TournamentResultsView } from './TournamentResultsView';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { useTheme } from '../lib/ThemeContext';
import { formatPlayerNames } from '../utils/playerNames';

interface Props {
  tournament: Tournament;
}

export function BracketView({ tournament }: Props) {
  const { isSyndicate, isDark } = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<'bracket' | 'list' | 'results'>(tournament.status === 'completed' ? 'results' : 'bracket');
  const [zoomLevel, setZoomLevel] = useState(1);
  const currentPlayer = Object.values(players).find(p => p.uid === auth.currentUser?.uid);
  const hasAdminPrivileges = currentPlayer?.role === 'admin' || currentPlayer?.role === 'coordinator';

  useEffect(() => {
    const q = query(collection(db, 'matches'), where('tournamentId', '==', tournament.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });
    return () => unsubscribe();
  }, [tournament.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'players'), (snapshot) => {
      const fetchedPlayers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Player));
      const formattedPlayers = formatPlayerNames(fetchedPlayers);

      const playerMap: Record<string, Player> = {};
      formattedPlayers.forEach(p => {
        playerMap[p.uid] = p;
      });
      setPlayers(playerMap);
    });
    return () => unsubscribe();
  }, []);

  const startTournament = async () => {
    if (tournament.participants.length < 2) return;
    
    try {
      const batch = writeBatch(db);
      const generatedMatches = generateBracket(
        tournament.participants,
        tournament.id,
        tournament.gameType,
        tournament.gameConfig,
        [],
        tournament.type,
        tournament.roundRobinConfig
      );

      generatedMatches.forEach(match => {
        const matchRef = doc(collection(db, 'matches'));
        // Strip undefined fields to prevent Firestore errors
        const sanitizedMatch = removeUndefinedFields(match);
        batch.set(matchRef, sanitizedMatch);
      });

      batch.update(doc(db, 'tournaments', tournament.id), { status: 'live' });
      await batch.commit();
    } catch (error) {
      console.error("Error starting tournament:", error);
      alert("Failed to start tournament. Check console for details.");
    }
  };

  const joinTournament = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        participants: arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      console.error("Error joining tournament:", error);
      alert("Failed to join tournament. Check console for details.");
    }
  };

  const handleClearMatch = async (match: Match) => {
    try {
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        status: 'completed'
      });
    } catch (error) {
      console.error("Error clearing match:", error);
      alert("Failed to clear match. Check console.");
    }
  };

  const handleAdvance = async (match: Match, forcedWinnerId?: string) => {
    try {
      const winnerId = forcedWinnerId || match.player1Id || match.player2Id;
      if (!winnerId) return;

      const batch = writeBatch(db);
      const matchRef = doc(db, 'matches', match.id);

      batch.update(matchRef, {
        status: 'completed',
        winnerId: winnerId,
        score1: match.player1Id === winnerId ? 1 : 0,
        score2: match.player2Id === winnerId ? 1 : 0,
      });

      if (tournament.type !== 'round-robin') {
        const nextPosition = Math.floor(match.position / 2);
        const nextRound = match.round + 1;

        const q = query(
          collection(db, 'matches'),
          where('tournamentId', '==', tournament.id),
          where('round', '==', nextRound),
          where('position', '==', nextPosition)
        );

        const nextMatchSnap = await getDocs(q);
        if (!nextMatchSnap.empty) {
          const nextMatch = nextMatchSnap.docs[0];
          const isPlayer1 = match.position % 2 === 0;

          batch.update(nextMatch.ref, {
            [isPlayer1 ? 'player1Id' : 'player2Id']: winnerId
          });
        } else {
          const tournamentRef = doc(db, 'tournaments', tournament.id);
          batch.update(tournamentRef, {
            winnerId,
            status: 'completed'
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error advancing match:", error);
      alert("Failed to advance. Check console.");
    }
  };

  if (activeMatch) {
    return (
      <ScorerView 
        match={activeMatch} 
        tournamentId={tournament.id}
        player1={players[activeMatch.player1Id]}
        player2={players[activeMatch.player2Id]}
        onClose={() => setActiveMatch(null)}
        isSyndicateTournament={tournament.isSyndicate}
        tournamentType={tournament.type}
        hasAdminPrivileges={hasAdminPrivileges}
      />
    );
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className={clsx(
        "p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300",
        isSyndicate ? "bg-onyx border-syndicate-red/30 merrowed-border" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div>
          <h2 className={clsx(
            "text-3xl font-bold mb-2",
            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
          )}>{tournament.name}</h2>
          <div className={clsx(
            "flex items-center gap-4 font-medium",
            isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <span className="flex items-center gap-2">
              <Users className={clsx("w-5 h-5", isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400")} />
              {tournament.participants.length} Players
            </span>
            <span className={clsx("w-1 h-1 rounded-full", isSyndicate ? "bg-syndicate-red/50" : isDark ? "bg-slate-600" : "bg-slate-300")} />
            <span className="capitalize">{tournament.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tournament.status === 'upcoming' && (
            <>
              {!tournament.participants.includes(auth.currentUser?.uid || '') && (
                <button
                  onClick={joinTournament}
                  className={clsx(
                    "px-8 py-3 rounded-2xl font-bold transition-all shadow-lg",
                    isSyndicate 
                      ? "bg-syndicate-red text-nasty-cream shadow-syndicate-red/20" 
                      : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                  )}
                >
                  Join Tournament
                </button>
              )}
              {hasAdminPrivileges && (
                <button
                  onClick={startTournament}
                  disabled={tournament.participants.length < 2}
                  className={clsx(
                    "px-8 py-3 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-50",
                    isSyndicate 
                      ? "bg-syndicate-red text-nasty-cream shadow-syndicate-red/20" 
                      : isDark ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
                  )}
                >
                  <Play className="w-5 h-5" />
                  Start Tournament
                </button>
              )}
            </>
          )}
          
          {tournament.status !== 'upcoming' && (
            <div className="flex items-center gap-3">
              {viewMode === 'bracket' && (
                <div className={clsx(
                  "flex items-center p-1 rounded-xl gap-1",
                  isSyndicate ? "bg-onyx/50 border border-syndicate-red/20" : isDark ? "bg-slate-800" : "bg-slate-100"
                )}>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      isSyndicate ? "text-steel-gray hover:text-nasty-cream hover:bg-syndicate-red/20" : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700" : "text-slate-500 hover:text-slate-900 hover:bg-white"
                    )}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className={clsx(
                      "px-2 py-1 text-xs font-bold transition-all min-w-[3rem] text-center",
                      isSyndicate ? "text-syndicate-red font-mono hover:text-nasty-cream" : isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    )}
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      isSyndicate ? "text-steel-gray hover:text-nasty-cream hover:bg-syndicate-red/20" : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700" : "text-slate-500 hover:text-slate-900 hover:bg-white"
                    )}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className={clsx(
                "flex p-1 rounded-xl",
                isSyndicate ? "bg-onyx/50 border border-syndicate-red/20" : isDark ? "bg-slate-800" : "bg-slate-100"
              )}>
              <button 
                onClick={() => setViewMode('bracket')}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'bracket' 
                    ? (isSyndicate ? "bg-syndicate-red text-nasty-cream shadow-sm" : isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm")
                    : (isSyndicate ? "text-steel-gray hover:text-nasty-cream" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                )}
              >
                <Layout className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' 
                    ? (isSyndicate ? "bg-syndicate-red text-nasty-cream shadow-sm" : isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm")
                    : (isSyndicate ? "text-steel-gray hover:text-nasty-cream" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                )}
              >
                <List className="w-5 h-5" />
              </button>
                {tournament.status === 'completed' && (
                  <button
                    onClick={() => setViewMode('results')}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'results'
                        ? (isSyndicate ? "bg-syndicate-red text-nasty-cream shadow-sm" : isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm")
                        : (isSyndicate ? "text-steel-gray hover:text-nasty-cream" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                    )}
                  >
                    <Trophy className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {tournament.status === 'upcoming' && (
        <div className={clsx(
          "p-8 rounded-3xl border transition-colors duration-300",
          isSyndicate ? "bg-onyx border-syndicate-red/30 merrowed-border" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <h3 className={clsx(
            "text-xl font-bold mb-6",
            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
          )}>Registered Players</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tournament.participants.map(uid => (
              <div key={uid} className={clsx(
                "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-colors duration-300",
                isSyndicate ? "bg-onyx/50 border-syndicate-red/20" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <img 
                  src={players[uid]?.photoURL || `https://ui-avatars.com/api/?name=${players[uid]?.name}`}
                  className={clsx(
                    "w-12 h-12 rounded-xl object-cover ring-2",
                    isSyndicate ? "ring-syndicate-red/30" : isDark ? "ring-slate-800" : "ring-white",
                    isSyndicate && players[uid]?.isVested && "stitched-red"
                  )}
                  referrerPolicy="no-referrer"
                />
                <span className={clsx(
                  "text-sm font-bold text-center truncate w-full",
                  isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
                )}>
                  {players[uid]?.name || 'Loading...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournament.status !== 'upcoming' && viewMode === 'bracket' && tournament.type !== 'round-robin' && (
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-12 min-w-max p-4" style={{ zoom: zoomLevel } as React.CSSProperties}>
            {rounds.map(round => (
              <div key={round} className="w-72 space-y-8">
                <div className="text-center mb-8">
                  <span className={clsx(
                    "text-xs font-black uppercase tracking-widest",
                    isSyndicate ? "text-syndicate-red/60 font-mono" : "text-slate-400"
                  )}>Round {round}</span>
                </div>
                <div className="flex flex-col justify-around h-full gap-8">
                  {matches.filter(m => m.round === round).sort((a, b) => a.position - b.position).map(match => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      players={players} 
                      hasAdminPrivileges={hasAdminPrivileges}
                      currentUserId={auth.currentUser?.uid}
                      onScore={() => setActiveMatch(match)}
                      onAdvance={(winnerId) => handleAdvance(match, winnerId)}
                      onClear={() => handleClearMatch(match)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournament.status !== 'upcoming' && viewMode === 'bracket' && tournament.type === 'round-robin' && (
        <div className="space-y-8" style={{ zoom: zoomLevel } as React.CSSProperties}>
          {rounds.map(pod => (
            <div key={pod} className="space-y-4">
              <h3 className={clsx(
                "text-lg font-bold px-2",
                isSyndicate ? "text-syndicate-red font-rocker" : isDark ? "text-slate-200" : "text-slate-800"
              )}>Pod {pod}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.filter(m => m.round === pod).sort((a, b) => a.position - b.position).map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    players={players}
                    hasAdminPrivileges={hasAdminPrivileges}
                    currentUserId={auth.currentUser?.uid}
                    onScore={() => setActiveMatch(match)}
                    onAdvance={(winnerId) => handleAdvance(match, winnerId)}
                    onClear={() => handleClearMatch(match)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tournament.status !== 'upcoming' && viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.sort((a, b) => b.round - a.round || a.position - b.position).map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              players={players} 
              hasAdminPrivileges={hasAdminPrivileges}
              currentUserId={auth.currentUser?.uid}
              onScore={() => setActiveMatch(match)}
              onAdvance={(winnerId) => handleAdvance(match, winnerId)}
              onClear={() => handleClearMatch(match)}
            />
          ))}
        </div>
      )}

      {tournament.status === 'completed' && viewMode === 'results' && (
        <TournamentResultsView
          tournament={tournament}
          matches={matches}
          players={players}
        />
      )}
    </div>
  );
}

function MatchCard({ match, players, hasAdminPrivileges, currentUserId, onScore, onAdvance, onClear }: {
  match: Match, 
  players: Record<string, Player>, 
  hasAdminPrivileges: boolean,
  currentUserId?: string,
  onScore: () => void,
  onAdvance: (winnerId?: string) => void,
  onClear: () => void
}) {
  const p1 = players[match.player1Id];
  const p2 = players[match.player2Id];
  const { isSyndicate, isDark } = useTheme();

  const getDisplayScore = (playerNum: 1 | 2) => {
    if (match.status === 'live') {
      const currentScore = playerNum === 1 ? match.currentScore1 : match.currentScore2;
      if (currentScore !== undefined) return currentScore;
      if (match.gameType === 'X01') return (match.gameConfig as any)?.startScore || 301;
      return 0; // Default for Cricket
    }
    // Completed or upcoming match
    return playerNum === 1 ? match.legs1 : match.legs2;
  };

  return (
    <div className={clsx(
      "rounded-2xl border shadow-sm overflow-hidden group transition-all duration-300",
      isSyndicate 
        ? "bg-onyx border-syndicate-red/30 hover:border-syndicate-red merrowed-border" 
        : isDark ? "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-black/20" : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
    )}>
      <div className="p-4 space-y-3">
        <PlayerRow 
          player={p1} 
          score={getDisplayScore(1)}
          isWinner={match.winnerId === match.player1Id} 
          isPlaceholder={!match.player1Id}
          legs={match.legs1}
          isLive={match.status === 'live'}
        />
        <div className={clsx(
          "h-px",
          isSyndicate ? "bg-syndicate-red/10" : isDark ? "bg-slate-800" : "bg-slate-50"
        )} />
        <PlayerRow 
          player={p2} 
          score={getDisplayScore(2)}
          isWinner={match.winnerId === match.player2Id} 
          isPlaceholder={!match.player2Id}
          legs={match.legs2}
          isLive={match.status === 'live'}
        />
      </div>
      
      {(hasAdminPrivileges || currentUserId === match.player1Id || currentUserId === match.player2Id) && match.status !== 'completed' && match.player1Id && match.player2Id && (
        <button
          onClick={onScore}
          className={clsx(
            "w-full py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            isSyndicate 
              ? "bg-syndicate-red/10 text-syndicate-red hover:bg-syndicate-red hover:text-nasty-cream font-rocker" 
              : isDark ? "bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-400" : "bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600"
          )}
        >
          <Play className="w-3 h-3" />
          Score Match
        </button>
      )}

      {hasAdminPrivileges && match.status !== 'completed' && (
        <div className="flex w-full">
          {(!match.player1Id && !match.player2Id) ? (
             <button
              onClick={onClear}
              className={clsx(
                "w-full py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                isSyndicate ? "bg-syndicate-red/20 text-syndicate-red hover:bg-syndicate-red hover:text-nasty-cream font-rocker" : isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500 hover:bg-slate-200"
              )}
             >
               <XCircle className="w-3 h-3" />
               Clear Match
             </button>
          ) : (!match.player1Id || !match.player2Id) ? (
             <button
              onClick={() => onAdvance()}
              className={clsx(
                "w-full py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                 isSyndicate ? "bg-syndicate-red/20 text-syndicate-red hover:bg-syndicate-red hover:text-nasty-cream font-rocker" : isDark ? "bg-indigo-900/50 text-indigo-400 hover:bg-indigo-800" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              )}
             >
               <FastForward className="w-3 h-3" />
               Auto Advance
             </button>
          ) : (
            <div className="flex w-full divide-x divide-slate-800/50 border-t border-slate-800/50">
              <button
                onClick={() => onAdvance(match.player1Id)}
                className={clsx(
                  "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1",
                   isSyndicate ? "bg-syndicate-red/10 text-syndicate-red hover:bg-syndicate-red hover:text-nasty-cream font-rocker" : isDark ? "bg-slate-800 hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-400" : "bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                )}
              >
                Force P1 Win
              </button>
              <button
                onClick={() => onAdvance(match.player2Id)}
                className={clsx(
                  "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1",
                   isSyndicate ? "bg-syndicate-red/10 text-syndicate-red hover:bg-syndicate-red hover:text-nasty-cream font-rocker" : isDark ? "bg-slate-800 hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-400" : "bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                )}
              >
                Force P2 Win
              </button>
            </div>
          )}
        </div>
      )}
      
      {match.status === 'live' && (
        <div className={clsx(
          "py-2 text-center flex items-center justify-center gap-2",
          isSyndicate ? "bg-syndicate-red/10" : isDark ? "bg-emerald-500/10" : "bg-emerald-50"
        )}>
          <span className="relative flex h-2 w-2">
            <span className={clsx(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isSyndicate ? "bg-syndicate-red" : isDark ? "bg-emerald-400" : "bg-emerald-400"
            )}></span>
            <span className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              isSyndicate ? "bg-syndicate-red" : isDark ? "bg-emerald-500" : "bg-emerald-500"
            )}></span>
          </span>
          <span className={clsx(
            "text-[10px] font-black uppercase tracking-widest",
            isSyndicate ? "text-syndicate-red font-mono" : isDark ? "text-emerald-400" : "text-emerald-600"
          )}>Live Match</span>
        </div>
      )}
      
      {match.status === 'completed' && (
        <div className={clsx(
          "py-2 text-center",
          isSyndicate ? "bg-syndicate-red/5" : isDark ? "bg-slate-800/50" : "bg-slate-50"
        )}>
          <span className={clsx(
            "text-[10px] font-black uppercase tracking-widest",
            isSyndicate ? "text-syndicate-red/60 font-mono" : isDark ? "text-slate-500" : "text-slate-400"
          )}>Final Result</span>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, score, isWinner, isPlaceholder, legs, isLive }: {
  player?: Player, 
  score: number, 
  isWinner: boolean,
  isPlaceholder: boolean,
  legs?: number,
  isLive?: boolean
}) {
  const { isSyndicate, isDark } = useTheme();

  return (
    <div className={clsx(
      "flex items-center justify-between gap-4 transition-opacity",
      isPlaceholder ? "opacity-30" : "opacity-100"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <img 
            src={player?.photoURL || `https://ui-avatars.com/api/?name=${player?.name || '?'}`} 
            className={clsx(
              "w-8 h-8 rounded-lg object-cover",
              isSyndicate && player?.isVested && "stitched-red ring-1 ring-syndicate-red/30"
            )}
            referrerPolicy="no-referrer"
          />
          {isWinner && (
            <div className={clsx(
              "absolute -top-1 -right-1 rounded-full p-0.5 border-2",
              isSyndicate ? "bg-syndicate-red border-onyx" : "bg-amber-400 border-white"
            )}>
              <Trophy className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        <span className={clsx(
          "text-sm font-bold truncate",
          isWinner 
            ? (isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900")
            : (isSyndicate ? "text-steel-gray font-rocker" : isDark ? "text-slate-400" : "text-slate-500")
        )}>
          {player?.name || 'TBD'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isLive && legs !== undefined && (
          <span className={clsx(
            "text-xs font-bold uppercase tracking-widest opacity-60 mr-2",
            isSyndicate ? "text-syndicate-red" : isDark ? "text-indigo-400" : "text-indigo-600"
          )}>
            L: {legs}
          </span>
        )}
        <span className={clsx(
          "text-lg font-black tabular-nums",
          isWinner
            ? (isSyndicate ? "text-syndicate-red font-mono" : isDark ? "text-indigo-400" : "text-indigo-600")
            : (isSyndicate ? "text-steel-gray/30 font-mono" : isDark ? "text-slate-600" : "text-slate-400")
        )}>
          {score}
        </span>
      </div>
    </div>
  );
}
