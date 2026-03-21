import React, { useState, useEffect } from 'react';
import { Tournament, Player, Match, Permission } from '../types';
import { db, collection, onSnapshot, query, where, updateDoc, doc, addDoc } from '../firebase';
import { Trophy, GitBranch, Target, ChevronRight, User, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BracketViewProps {
  tournaments: Tournament[];
  players: Player[];
  currentUser: Player | null;
}

export default function BracketView({ tournaments, players, currentUser }: BracketViewProps) {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const hasPermission = (perm: Permission) => {
    if (currentUser?.email?.toLowerCase() === 'kingoflakemoor@gmail.com') return true;
    return currentUser?.permissions?.includes(perm);
  };

  const getPlayerName = (id: string) => {
    if (id === 'BYE') return 'BYE';
    if (id === 'TBD') return 'TBD';
    return players.find(p => p.id === id)?.name || id;
  };

  useEffect(() => {
    const active = tournaments.find(t => t.status === 'active') || tournaments[0];
    setActiveTournament(active || null);
  }, [tournaments]);

  useEffect(() => {
    if (!activeTournament) return;
    
    const q = query(collection(db, `tournaments/${activeTournament.id}/matches`));
    const unsub = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });
    return () => unsub();
  }, [activeTournament]);

  const handleUpdateScore = async (matchId: string, l1: number, l2: number, winnerId: string) => {
    if (!activeTournament) return;
    try {
      const currentMatch = matches.find(m => m.id === matchId);
      if (!currentMatch) return;

      const loserId = winnerId === currentMatch.player1Id ? currentMatch.player2Id : currentMatch.player1Id;

      const matchDoc = doc(db, `tournaments/${activeTournament.id}/matches`, matchId);
      await updateDoc(matchDoc, {
        legs1: l1,
        legs2: l2,
        winnerId,
        status: 'completed'
      });

      // Bracket Progression Logic
      const pos = currentMatch.bracketPosition || '';
      const [type, roundStr, matchStr] = pos.split('-');
      const round = parseInt(roundStr.replace('R', ''));
      const matchNum = parseInt(matchStr.replace('M', ''));

      if (type === 'WB') {
        // Move winner to next WB round
        const nextWBRound = round + 1;
        const nextWBMatchNum = Math.ceil(matchNum / 2);
        const nextWBPos = `WB-R${nextWBRound}-M${nextWBMatchNum}`;
        
        const nextWBMatch = matches.find(m => m.bracketPosition === nextWBPos);
        if (nextWBMatch) {
          const isP1 = matchNum % 2 !== 0;
          await updateDoc(doc(db, `tournaments/${activeTournament.id}/matches`, nextWBMatch.id), {
            [isP1 ? 'player1Id' : 'player2Id']: winnerId
          });
        } else if (round < 3) { // Create if doesn't exist and not at final round
           await addDoc(collection(db, `tournaments/${activeTournament.id}/matches`), {
            tournamentId: activeTournament.id,
            player1Id: winnerId,
            player2Id: 'TBD',
            score1: 0,
            score2: 0,
            legs1: 0,
            legs2: 0,
            status: 'pending',
            bracketPosition: nextWBPos
          });
        }

        // Move loser to LB
        const lbRound = (round - 1) * 2 + 1;
        const lbPos = `LB-R${lbRound}-M${matchNum}`;
        const lbMatch = matches.find(m => m.bracketPosition === lbPos);
        if (lbMatch) {
          const isP1 = matchNum % 2 !== 0;
          await updateDoc(doc(db, `tournaments/${activeTournament.id}/matches`, lbMatch.id), {
            [isP1 ? 'player1Id' : 'player2Id']: loserId
          });
        } else {
          await addDoc(collection(db, `tournaments/${activeTournament.id}/matches`), {
            tournamentId: activeTournament.id,
            player1Id: loserId,
            player2Id: 'TBD',
            score1: 0,
            score2: 0,
            legs1: 0,
            legs2: 0,
            status: 'pending',
            bracketPosition: lbPos
          });
        }
      } else if (type === 'LB') {
        // Move winner to next LB round
        const nextLBRound = round + 1;
        const nextLBMatchNum = Math.ceil(matchNum / 2);
        const nextLBPos = `LB-R${nextLBRound}-M${nextLBMatchNum}`;
        
        const nextLBMatch = matches.find(m => m.bracketPosition === nextLBPos);
        if (nextLBMatch) {
          const isP1 = matchNum % 2 !== 0;
          await updateDoc(doc(db, `tournaments/${activeTournament.id}/matches`, nextLBMatch.id), {
            [isP1 ? 'player1Id' : 'player2Id']: winnerId
          });
        }
      }

      setSelectedMatch(null);
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  if (!activeTournament) {
    return (
      <div className="p-20 text-center">
        <Trophy className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
        <h3 className="text-xl font-bold mb-2">No Active Tournament</h3>
        <p className="text-zinc-500">Start a tournament to view the bracket.</p>
      </div>
    );
  }

  const wbMatches = matches.filter(m => m.bracketPosition?.startsWith('WB'));
  const lbMatches = matches.filter(m => m.bracketPosition?.startsWith('LB'));

  return (
    <div className="p-6 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <GitBranch className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{activeTournament.name}</h3>
              <p className="text-zinc-500 text-sm">Double Elimination Bracket</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {tournaments.length > 1 && (
              <select 
                className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm"
                onChange={(e) => setActiveTournament(tournaments.find(t => t.id === e.target.value) || null)}
                value={activeTournament.id}
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="space-y-20">
          <section>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              Winners Bracket
              <div className="h-px flex-1 bg-white/5" />
            </h4>
            
            <div className="flex gap-12">
              <BracketRound 
                title="Round 1" 
                matches={wbMatches.filter(m => m.bracketPosition?.includes('R1'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
              <BracketRound 
                title="Semi Finals" 
                matches={wbMatches.filter(m => m.bracketPosition?.includes('R2'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
              <BracketRound 
                title="Winners Final" 
                matches={wbMatches.filter(m => m.bracketPosition?.includes('R3'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
            </div>
          </section>

          <section>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              Losers Bracket
              <div className="h-px flex-1 bg-white/5" />
            </h4>
            
            <div className="flex gap-12">
              <BracketRound 
                title="L-Round 1" 
                matches={lbMatches.filter(m => m.bracketPosition?.includes('R1'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
              <BracketRound 
                title="L-Round 2" 
                matches={lbMatches.filter(m => m.bracketPosition?.includes('R2'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
              <BracketRound 
                title="Losers Final" 
                matches={lbMatches.filter(m => m.bracketPosition?.includes('R3'))} 
                onMatchClick={setSelectedMatch}
                getPlayerName={getPlayerName}
              />
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {selectedMatch && (
          <MatchScorerModal 
            match={selectedMatch} 
            onClose={() => setSelectedMatch(null)} 
            onSave={handleUpdateScore}
            getPlayerName={getPlayerName}
            isAdmin={hasPermission('edit_scores')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BracketRound({ title, matches, onMatchClick, getPlayerName }: { title: string, matches: Match[], onMatchClick: (m: Match) => void, getPlayerName: (id: string) => string }) {
  if (matches.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 min-w-[280px]">
      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">{title}</div>
      <div className="flex flex-col justify-around flex-1 gap-12">
        {matches.map((match) => (
          <button 
            key={match.id} 
            onClick={() => onMatchClick(match)}
            className="relative group text-left w-full"
          >
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/30 transition-all">
              <div className={cn(
                "p-4 border-b border-white/5 flex items-center justify-between transition-colors",
                match.winnerId === match.player1Id ? "bg-amber-500/10" : "bg-white/5"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-bold">
                    {getPlayerName(match.player1Id).slice(0, 2).toUpperCase()}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    match.winnerId === match.player1Id ? "text-amber-500" : "text-zinc-400"
                  )}>
                    {getPlayerName(match.player1Id)}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-500">{match.legs1 || 0}</span>
              </div>
              <div className={cn(
                "p-4 flex items-center justify-between transition-colors",
                match.winnerId === match.player2Id ? "bg-amber-500/10" : "transparent"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-bold">
                    {getPlayerName(match.player2Id).slice(0, 2).toUpperCase()}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    match.winnerId === match.player2Id ? "text-amber-500" : "text-zinc-400"
                  )}>
                    {getPlayerName(match.player2Id)}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-500">{match.legs2 || 0}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchScorerModal({ match, onClose, onSave, getPlayerName, isAdmin }: { match: Match, onClose: () => void, onSave: (id: string, l1: number, l2: number, w: string) => void, getPlayerName: (id: string) => string, isAdmin: boolean }) {
  const [l1, setL1] = useState(match.legs1 || 0);
  const [l2, setL2] = useState(match.legs2 || 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">
            {isAdmin ? 'Admin: Edit Match' : 'Update Match (Best of 3)'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{getPlayerName(match.player1Id)}</div>
              <div className="text-[10px] text-zinc-600 mb-1">Legs Won</div>
              <input 
                type="number" 
                min="0"
                max="5"
                value={l1}
                onChange={(e) => setL1(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-black border border-white/10 rounded-2xl p-6 text-4xl font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="text-zinc-700 font-bold">VS</div>
            <div className="flex-1 text-center">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{getPlayerName(match.player2Id)}</div>
              <div className="text-[10px] text-zinc-600 mb-1">Legs Won</div>
              <input 
                type="number" 
                min="0"
                max="5"
                value={l2}
                onChange={(e) => setL2(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-black border border-white/10 rounded-2xl p-6 text-4xl font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onSave(match.id, l1, l2, match.player1Id)}
              disabled={!isAdmin && l1 < 2 && l2 < 2}
              className="py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold rounded-xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Check className="w-5 h-5" />
              P1 Wins
            </button>
            <button 
              onClick={() => onSave(match.id, l1, l2, match.player2Id)}
              disabled={!isAdmin && l1 < 2 && l2 < 2}
              className="py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold rounded-xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Check className="w-5 h-5" />
              P2 Wins
            </button>
          </div>
          {(!isAdmin && l1 < 2 && l2 < 2) && (
            <p className="text-center text-xs text-zinc-600">A player must win 2 legs to win the match.</p>
          )}
          {isAdmin && (
            <p className="text-center text-xs text-amber-500">Admin mode: You can force a winner with any score.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
