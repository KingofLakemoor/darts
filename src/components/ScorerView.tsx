import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Player, X01Config, CricketConfig } from '../types';
import { X, Target, Trophy, ChevronRight, Minus, Plus, Delete, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  match: Match;
  tournamentId: string;
  player1: Player;
  player2: Player;
  onClose: () => void;
}

export function ScorerView({ match, tournamentId, player1, player2, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  
  // X01 State
  const x01Config = match.gameConfig as X01Config;
  const [score1, setScore1] = useState<number>(x01Config?.startScore || 301);
  const [score2, setScore2] = useState<number>(x01Config?.startScore || 301);
  const [legs1, setLegs1] = useState(match.legs1 || 0);
  const [legs2, setLegs2] = useState(match.legs2 || 0);
  const [sets1, setSets1] = useState(match.score1 || 0);
  const [sets2, setSets2] = useState(match.score2 || 0);
  const [input, setInput] = useState('');

  // Cricket State
  const cricketConfig = match.gameConfig as CricketConfig;
  const [cricketMarks1, setCricketMarks1] = useState<Record<number, number>>({ 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 });
  const [cricketMarks2, setCricketMarks2] = useState<Record<number, number>>({ 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 });
  const [cricketPoints1, setCricketPoints1] = useState(0);
  const [cricketPoints2, setCricketPoints2] = useState(0);

  const saveMatch = async (isFinal: boolean) => {
    setSaving(true);
    try {
      const matchRef = doc(db, 'tournaments', tournamentId, 'matches', match.id);
      const winnerId = isFinal ? (sets1 > sets2 ? match.player1Id : match.player2Id) : undefined;
      
      await updateDoc(matchRef, {
        score1: sets1,
        score2: sets2,
        legs1,
        legs2,
        status: isFinal ? 'completed' : 'live',
        winnerId
      });

      if (isFinal && winnerId) {
        const nextPosition = Math.floor(match.position / 2);
        const nextRound = match.round + 1;
        
        const q = query(
          collection(db, 'tournaments', tournamentId, 'matches'),
          where('round', '==', nextRound),
          where('position', '==', nextPosition)
        );
        
        const nextMatchSnap = await getDocs(q);
        if (!nextMatchSnap.empty) {
          const nextMatch = nextMatchSnap.docs[0];
          const isPlayer1 = match.position % 2 === 0;
          
          await updateDoc(nextMatch.ref, {
            [isPlayer1 ? 'player1Id' : 'player2Id']: winnerId
          });
        } else {
          await updateDoc(doc(db, 'tournaments', tournamentId), {
            winnerId,
            status: 'completed'
          });
        }
      }
      
      if (isFinal) onClose();
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleX01Input = (val: string) => {
    if (val === 'DEL') {
      setInput(input.slice(0, -1));
    } else if (val === 'ENTER') {
      const points = parseInt(input) || 0;
      if (points > 180) return;

      const currentScore = activePlayer === 1 ? score1 : score2;
      const newScore = currentScore - points;

      if (newScore === 0) {
        // Leg won!
        if (activePlayer === 1) {
          const newLegs = legs1 + 1;
          if (newLegs >= x01Config.legs) {
            setSets1(sets1 + 1);
            setLegs1(0);
            setLegs2(0);
          } else {
            setLegs1(newLegs);
          }
          setScore1(x01Config.startScore);
          setScore2(x01Config.startScore);
        } else {
          const newLegs = legs2 + 1;
          if (newLegs >= x01Config.legs) {
            setSets2(sets2 + 1);
            setLegs1(0);
            setLegs2(0);
          } else {
            setLegs2(newLegs);
          }
          setScore1(x01Config.startScore);
          setScore2(x01Config.startScore);
        }
      } else if (newScore > 1) {
        if (activePlayer === 1) setScore1(newScore);
        else setScore2(newScore);
      }
      
      setInput('');
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else {
      if (input.length < 3) setInput(input + val);
    }
  };

  const handleCricketMark = (num: number, multiplier: number = 1) => {
    const marks = activePlayer === 1 ? cricketMarks1 : cricketMarks2;
    const opponentMarks = activePlayer === 1 ? cricketMarks2 : cricketMarks1;
    const setMarks = activePlayer === 1 ? setCricketMarks1 : setCricketMarks2;
    const setPoints = activePlayer === 1 ? setCricketPoints1 : setCricketPoints2;
    const setOpponentPoints = activePlayer === 1 ? setCricketPoints2 : setCricketPoints1;

    let newMarks = { ...marks };
    let currentMarks = marks[num];
    let addedMarks = multiplier;

    for (let i = 0; i < multiplier; i++) {
      if (currentMarks < 3) {
        currentMarks++;
      } else {
        // Already closed, check if opponent has it closed
        if (opponentMarks[num] < 3) {
          if (cricketConfig.mode === 'Standard') {
            setPoints(prev => prev + num);
          } else {
            setOpponentPoints(prev => prev + num);
          }
        }
      }
    }

    newMarks[num] = currentMarks;
    setMarks(newMarks);
    
    // Check for win
    const allClosed = Object.values(newMarks).every(m => m >= 3);
    const leading = cricketConfig.mode === 'Standard' 
      ? (activePlayer === 1 ? cricketPoints1 >= cricketPoints2 : cricketPoints2 >= cricketPoints1)
      : (activePlayer === 1 ? cricketPoints1 <= cricketPoints2 : cricketPoints2 <= cricketPoints1);

    if (allClosed && leading) {
      // Game over logic
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-4"
    >
      <div className="bg-slate-900 w-full h-full md:h-auto md:max-w-6xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Match Scorer</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{match.gameType} • Best of {x01Config?.sets || 1} Sets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 divide-x divide-slate-800">
            <PlayerScore 
              player={player1} 
              score={match.gameType === 'X01' ? score1 : cricketPoints1} 
              legs={legs1} 
              sets={sets1} 
              isActive={activePlayer === 1}
              marks={match.gameType === 'Cricket' ? cricketMarks1 : undefined}
            />
            <PlayerScore 
              player={player2} 
              score={match.gameType === 'X01' ? score2 : cricketPoints2} 
              legs={legs2} 
              sets={sets2} 
              isActive={activePlayer === 2}
              marks={match.gameType === 'Cricket' ? cricketMarks2 : undefined}
            />
          </div>

          {/* Controls */}
          <div className="p-8 bg-slate-900/50">
            {match.gameType === 'X01' ? (
              <div className="max-w-md mx-auto">
                <div className="bg-slate-800 p-6 rounded-3xl mb-6 text-center border border-slate-700 shadow-inner">
                  <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                    {input || '0'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <KeyButton key={n} onClick={() => handleX01Input(n.toString())}>{n}</KeyButton>
                  ))}
                  <KeyButton onClick={() => handleX01Input('DEL')} className="text-red-400"><Delete className="w-6 h-6" /></KeyButton>
                  <KeyButton onClick={() => handleX01Input('0')}>0</KeyButton>
                  <KeyButton onClick={() => handleX01Input('ENTER')} className="bg-indigo-600 text-white hover:bg-indigo-500 border-none"><Check className="w-6 h-6" /></KeyButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {[20, 19, 18, 17, 16, 15, 25].map(num => (
                  <div key={num} className="space-y-2">
                    <button
                      onClick={() => handleCricketMark(num, 1)}
                      className="w-full py-6 rounded-2xl bg-slate-800 border border-slate-700 text-white font-black text-xl hover:bg-slate-700 transition-all shadow-lg"
                    >
                      {num === 25 ? 'B' : num}
                    </button>
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleCricketMark(num, 2)} className="px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-400 rounded-md border border-slate-700 hover:text-white">D</button>
                      <button onClick={() => handleCricketMark(num, 3)} className="px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-400 rounded-md border border-slate-700 hover:text-white">T</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setActivePlayer(activePlayer === 1 ? 2 : 1)}
                  className="col-span-4 md:col-span-7 mt-4 py-5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                >
                  Next Player
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
          <button
            onClick={() => saveMatch(false)}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all border border-slate-700 disabled:opacity-50"
          >
            Save Progress
          </button>
          <button
            onClick={() => saveMatch(true)}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Trophy className="w-5 h-5" />
            Finalize Match
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PlayerScore({ player, score, legs, sets, isActive, marks }: { 
  player: Player, 
  score: number, 
  legs: number, 
  sets: number, 
  isActive: boolean,
  marks?: Record<number, number>
}) {
  return (
    <div className={clsx(
      "p-8 transition-all duration-500 relative overflow-hidden",
      isActive ? "bg-indigo-600/10" : "bg-transparent"
    )}>
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute top-0 left-0 w-1 h-full bg-indigo-500"
        />
      )}
      
      <div className="flex items-center gap-4 mb-8">
        <img 
          src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
          className={clsx(
            "w-16 h-16 rounded-2xl object-cover ring-2 transition-all duration-500",
            isActive ? "ring-indigo-500 scale-110 shadow-2xl shadow-indigo-500/20" : "ring-slate-800 opacity-50"
          )}
          referrerPolicy="no-referrer"
        />
        <div>
          <h3 className={clsx(
            "text-xl font-bold transition-colors",
            isActive ? "text-white" : "text-slate-500"
          )}>{player.name}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider">Sets: {sets}</span>
            <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider">Legs: {legs}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className={clsx(
          "text-8xl font-black tracking-tighter tabular-nums transition-all duration-500",
          isActive ? "text-white scale-110" : "text-slate-700"
        )}>
          {score}
        </span>
      </div>

      {marks && (
        <div className="mt-8 grid grid-cols-7 gap-2">
          {[20, 19, 18, 17, 16, 15, 25].map(num => (
            <div key={num} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{num === 25 ? 'B' : num}</span>
              <div className="flex flex-col gap-0.5">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={clsx(
                      "w-4 h-1 rounded-full transition-all",
                      marks[num] >= i ? "bg-indigo-500" : "bg-slate-800"
                    )} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyButton({ children, onClick, className = '' }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-16 rounded-2xl bg-slate-800 border border-slate-700 text-2xl font-bold text-white hover:bg-slate-700 transition-all active:scale-95 shadow-lg",
        className
      )}
    >
      {children}
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
