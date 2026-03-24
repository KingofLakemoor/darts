import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Tournament, Match, Player } from '../types';
import { Trophy, Target, Users, Play, CheckCircle2, Layout, List } from 'lucide-react';
import { generateBracket } from '../utils/bracket';
import { ScorerView } from './ScorerView';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface Props {
  tournament: Tournament;
}

export function BracketView({ tournament }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<'bracket' | 'list'>('bracket');
  const isAdmin = auth.currentUser?.email === 'kingoflakemoor@gmail.com';

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tournaments', tournament.id, 'matches'), (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });
    return () => unsubscribe();
  }, [tournament.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'players'), (snapshot) => {
      const playerMap: Record<string, Player> = {};
      snapshot.docs.forEach(doc => {
        playerMap[doc.id] = doc.data() as Player;
      });
      setPlayers(playerMap);
    });
    return () => unsubscribe();
  }, []);

  const startTournament = async () => {
    if (tournament.participants.length < 2) return;
    
    const batch = writeBatch(db);
    const generatedMatches = generateBracket(
      tournament.participants, 
      tournament.id,
      tournament.gameType,
      tournament.gameConfig
    );
    
    generatedMatches.forEach(match => {
      const matchRef = doc(collection(db, 'tournaments', tournament.id, 'matches'));
      batch.set(matchRef, match);
    });

    batch.update(doc(db, 'tournaments', tournament.id), { status: 'live' });
    await batch.commit();
  };

  const joinTournament = async () => {
    if (!auth.currentUser) return;
    const newParticipants = [...tournament.participants];
    if (!newParticipants.includes(auth.currentUser.uid)) {
      newParticipants.push(auth.currentUser.uid);
      await updateDoc(doc(db, 'tournaments', tournament.id), { participants: newParticipants });
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
      />
    );
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{tournament.name}</h2>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {tournament.participants.length} Players
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="capitalize">{tournament.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tournament.status === 'upcoming' && (
            <>
              {!tournament.participants.includes(auth.currentUser?.uid || '') && (
                <button
                  onClick={joinTournament}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Join Tournament
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={startTournament}
                  disabled={tournament.participants.length < 2}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  Start Tournament
                </button>
              )}
            </>
          )}
          
          {tournament.status !== 'upcoming' && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('bracket')}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'bracket' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Layout className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {tournament.status === 'upcoming' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Registered Players</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tournament.participants.map(uid => (
              <div key={uid} className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                  src={players[uid]?.photoURL || `https://ui-avatars.com/api/?name=${players[uid]?.name}`}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-white"
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm font-bold text-slate-900 text-center truncate w-full">
                  {players[uid]?.name || 'Loading...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournament.status !== 'upcoming' && viewMode === 'bracket' && (
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-12 min-w-max p-4">
            {rounds.map(round => (
              <div key={round} className="w-72 space-y-8">
                <div className="text-center mb-8">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Round {round}</span>
                </div>
                <div className="flex flex-col justify-around h-full gap-8">
                  {matches.filter(m => m.round === round).sort((a, b) => a.position - b.position).map(match => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      players={players} 
                      isAdmin={isAdmin}
                      onScore={() => setActiveMatch(match)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournament.status !== 'upcoming' && viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.sort((a, b) => b.round - a.round || a.position - b.position).map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              players={players} 
              isAdmin={isAdmin}
              onScore={() => setActiveMatch(match)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, players, isAdmin, onScore }: { 
  match: Match, 
  players: Record<string, Player>, 
  isAdmin: boolean,
  onScore: () => void 
}) {
  const p1 = players[match.player1Id];
  const p2 = players[match.player2Id];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-300 transition-all">
      <div className="p-4 space-y-3">
        <PlayerRow 
          player={p1} 
          score={match.score1} 
          isWinner={match.winnerId === match.player1Id} 
          isPlaceholder={!match.player1Id}
        />
        <div className="h-px bg-slate-50" />
        <PlayerRow 
          player={p2} 
          score={match.score2} 
          isWinner={match.winnerId === match.player2Id} 
          isPlaceholder={!match.player2Id}
        />
      </div>
      
      {isAdmin && match.status !== 'completed' && match.player1Id && match.player2Id && (
        <button
          onClick={onScore}
          className="w-full py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-3 h-3" />
          Score Match
        </button>
      )}
      
      {match.status === 'completed' && (
        <div className="py-2 bg-slate-50 text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Result</span>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, score, isWinner, isPlaceholder }: { 
  player?: Player, 
  score: number, 
  isWinner: boolean,
  isPlaceholder: boolean
}) {
  return (
    <div className={clsx(
      "flex items-center justify-between gap-4 transition-opacity",
      isPlaceholder ? "opacity-30" : "opacity-100"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <img 
            src={player?.photoURL || `https://ui-avatars.com/api/?name=${player?.name || '?'}`} 
            className="w-8 h-8 rounded-lg object-cover"
            referrerPolicy="no-referrer"
          />
          {isWinner && (
            <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border-2 border-white">
              <Trophy className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        <span className={clsx(
          "text-sm font-bold truncate",
          isWinner ? "text-slate-900" : "text-slate-500"
        )}>
          {player?.name || 'TBD'}
        </span>
      </div>
      <span className={clsx(
        "text-lg font-black tabular-nums",
        isWinner ? "text-indigo-600" : "text-slate-400"
      )}>
        {score}
      </span>
    </div>
  );
}
