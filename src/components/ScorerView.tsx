import { X01HistoryState, CricketHistoryState } from "../types";
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Match, Player, X01Config, CricketConfig } from '../types';
import { X, Target, Trophy, ChevronRight, Minus, Plus, Delete, RotateCcw, Check, Zap, Shield, Skull, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';

interface Props {
  match: Match;
  tournamentId: string;
  player1: Player;
  player2: Player;
  onClose: () => void;
  isSyndicateTournament?: boolean;
}

export function ScorerView({ match, tournamentId, player1, player2, onClose, isSyndicateTournament }: Props) {
  const { isSyndicate: globalIsSyndicate, isDark } = useTheme();
  const isSyndicate = isSyndicateTournament || globalIsSyndicate;
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
  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
  const [x01History, setX01History] = useState<X01HistoryState[]>([]);
  const [cricketHistory, setCricketHistory] = useState<CricketHistoryState[]>([]);
  const [modifier, setModifier] = useState<'single' | 'double' | 'triple'>('single');
  const [totalDarts1, setTotalDarts1] = useState(0);
  const [totalDarts2, setTotalDarts2] = useState(0);

  // Cricket State
  const cricketConfig = match.gameConfig as CricketConfig;
  const [cricketMarks1, setCricketMarks1] = useState<Record<number, number>>({
    20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0
  });
  const [cricketMarks2, setCricketMarks2] = useState<Record<number, number>>({
    20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0
  });
  const [cricketPoints1, setCricketPoints1] = useState(0);
  const [cricketPoints2, setCricketPoints2] = useState(0);

  // Syndicate State
  const [vaultProgress, setVaultProgress] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Set match to live when scoring starts
    if (match.status === 'pending') {
      updateDoc(doc(db, 'matches', match.id), { status: 'live' });
    }
  }, [match.id, match.status]);

  const getCheckoutSuggestion = (score: number, outRule: 'single' | 'double' | 'triple' = 'double'): string => {
    if (score > 170 || score < 2) return "";
    if (outRule === 'single' && (score <= 20 || score === 25)) return score.toString();

    if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
    if (score === 50) return "DB";

    const checkouts: Record<number, string> = {
      170: "T20 T20 DB", 167: "T20 T19 DB", 164: "T19 T19 DB", 161: "T20 T17 DB", 160: "T20 T20 D20",
      158: "T20 T20 D19", 157: "T20 T19 D20", 156: "T20 T20 D18", 155: "T20 T19 D19", 154: "T19 T19 D20",
      153: "T20 T19 D18", 152: "T20 T20 D16", 151: "T20 T17 D20", 150: "T19 T19 D18", 149: "T20 T19 D16",
      148: "T20 T20 D14", 147: "T20 T17 D18", 146: "T19 T19 D16", 145: "T20 T15 D20", 144: "T20 T20 D12",
      143: "T20 T17 D16", 142: "T20 T14 D20", 141: "T20 T19 D12", 140: "T20 T20 D10", 139: "T19 T14 D20",
      138: "T20 T18 D12", 137: "T20 T19 D10", 136: "T20 T16 D14", 135: "DB T15 D20", 134: "T20 T14 D16",
      133: "T20 T19 D8", 132: "T20 T16 D12", 131: "T19 T14 D16", 130: "T20 T20 D5", 129: "T19 T16 D12",
      128: "T18 T14 D16", 127: "T20 T17 D8", 126: "T19 T19 D6", 125: "25 T20 D20", 124: "T20 T14 D11",
      123: "T19 T16 D9", 122: "T18 T18 D7", 121: "T20 T11 D14", 120: "T20 20 D20", 119: "T19 T12 D13",
      118: "T20 18 D20", 117: "T20 17 D20", 116: "T19 19 D20", 115: "T19 18 D20", 114: "T20 14 D20",
      113: "T19 16 D20", 112: "T20 12 D20", 111: "T19 14 D20", 110: "T20 10 D20", 109: "T19 12 D20",
      108: "T19 11 D20", 107: "T19 10 D20", 106: "T20 6 D20", 105: "T19 8 D20", 104: "T18 10 D20",
      103: "T19 6 D20", 102: "T16 14 D20", 101: "T20 9 D16", 100: "T20 D20", 99: "T19 10 D16",
      98: "T20 D19", 97: "T19 D20", 96: "T20 D18", 95: "T19 D19", 94: "T18 D20",
      93: "T19 D18", 92: "T20 D16", 91: "T17 D20", 90: "T18 D18", 89: "T19 D16",
      88: "T16 D20", 87: "T17 D18", 86: "T18 D16", 85: "T15 D20", 84: "T20 D12",
      83: "T17 D16", 82: "T14 D20", 81: "T15 D18", 80: "T20 D10", 79: "T13 D20",
      78: "T18 D12", 77: "T15 D16", 76: "T20 D8", 75: "T17 D12", 74: "T14 D16",
      73: "T19 D8", 72: "T16 D12", 71: "T13 D16", 70: "T18 D8", 69: "T15 D12",
      68: "T20 D4", 67: "T17 D8", 66: "T10 D18", 65: "25 D20", 64: "T16 D8",
      63: "T13 D12", 62: "T10 D16", 61: "25 D18", 60: "20 D20", 59: "19 D20",
      58: "18 D20", 57: "17 D20", 56: "16 D20", 55: "15 D20", 54: "14 D20",
      53: "13 D20", 52: "12 D20", 51: "11 D20", 50: "10 D20", 49: "9 D20",
      48: "8 D20", 47: "15 D16", 46: "6 D20", 45: "13 D16", 44: "12 D16",
      43: "11 D16", 42: "10 D16", 41: "9 D16", 40: "D20", 39: "7 D16",
      38: "D19", 37: "5 D16", 36: "D18", 35: "3 D16", 34: "D17",
      33: "17 D8", 32: "D16", 31: "15 D8", 30: "D15", 29: "13 D8",
      28: "D14", 27: "19 D4", 26: "D13", 25: "9 D8", 24: "D12",
      23: "7 D8", 22: "D11", 21: "13 D4", 20: "D10", 19: "11 D4",
      18: "D9", 17: "9 D4", 16: "D8", 15: "7 D4", 14: "D7",
      13: "5 D4", 12: "D6", 11: "3 D4", 10: "D5", 9: "1 D4",
      8: "D4", 7: "3 D2", 6: "D3", 5: "1 D2", 4: "D2",
      3: "1 D1", 2: "D1",
    };

    return checkouts[score] || "";
  };

  const saveMatch = async (isFinal: boolean) => {
    if (auth.currentUser?.uid !== match.player1Id && auth.currentUser?.uid !== match.player2Id) {
      alert("You are not authorized to score this match.");
      return;
    }

    setSaving(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
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
          collection(db, 'matches'),
          where('tournamentId', '==', tournamentId),
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

  const handleX01Dart = (value: number) => {
    let points = value;
    if (modifier === 'double') points *= 2;
    if (modifier === 'triple') points = value === 25 ? 50 : points * 3;

    const stateSnapshot = {
      score1,
      score2,
      currentDarts: [...currentDarts],
      totalDarts1,
      totalDarts2,
      activePlayer,
      legs1,
      legs2,
      sets1,
      sets2
    };
    setX01History(prev => [...prev, stateSnapshot]);

    const currentScore = activePlayer === 1 ? score1 : score2;
    const newScore = currentScore - points;

    // Syndicate effects
    if (isSyndicate) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      setVaultProgress((prev: number) => Math.min(100, prev + (points / 100)));
    }

    const newDarts = [...currentDarts, points];
    
    // Check for win or bust
    const isWin = newScore === 0 && (modifier === 'double' || (value === 25 && (modifier as string) === 'double')); // Double out rule
    // Simplified: check if outRule is double
    const doubleOut = x01Config.outRule === 'double';
    const canWin = !doubleOut || (modifier as string) === 'double' || (value === 25 && (modifier as string) === 'double');
    
    if (newScore === 0 && canWin) {
      // Win!
      if (activePlayer === 1) {
        const newLegs = legs1 + 1;
        if (newLegs >= x01Config.legs) {
          setSets1(sets1 + 1);
          setLegs1(0);
          setLegs2(0);
        } else {
          setLegs1(newLegs);
        }
      } else {
        const newLegs = legs2 + 1;
        if (newLegs >= x01Config.legs) {
          setSets2(sets2 + 1);
          setLegs1(0);
          setLegs2(0);
        } else {
          setLegs2(newLegs);
        }
      }
      setScore1(x01Config.startScore);
      setScore2(x01Config.startScore);
      setCurrentDarts([]);
      setTotalDarts1(prev => activePlayer === 1 ? prev + newDarts.length : prev);
      setTotalDarts2(prev => activePlayer === 2 ? prev + newDarts.length : prev);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else if (newScore < 0 || (newScore === 1 && x01Config.outRule !== 'single') || (newScore === 0 && !canWin)) {
      // Bust
      const turnPoints = currentDarts.reduce((a, b) => a + b, 0);
      if (activePlayer === 1) {
        setScore1(score1 + turnPoints);
      } else {
        setScore2(score2 + turnPoints);
      }
      setCurrentDarts([]);
      setTotalDarts1(prev => activePlayer === 1 ? prev + 3 : prev);
      setTotalDarts2(prev => activePlayer === 2 ? prev + 3 : prev);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else {
      if (activePlayer === 1) setScore1(newScore);
      else setScore2(newScore);

      if (newDarts.length === 3) {
        setCurrentDarts([]);
        setTotalDarts1(prev => activePlayer === 1 ? prev + 3 : prev);
        setTotalDarts2(prev => activePlayer === 2 ? prev + 3 : prev);
        setActivePlayer(activePlayer === 1 ? 2 : 1);
        
        // Auto-save progress after each round for real-time updates
        const matchRef = doc(db, 'matches', match.id);
        updateDoc(matchRef, {
          score1: sets1,
          score2: sets2,
          legs1,
          legs2,
          status: 'live'
        }).catch(err => console.error('Auto-save error:', err));
      } else {
        setCurrentDarts(newDarts);
      }
    }

    setModifier('single');
  };

  const handleUndoX01 = () => {
    if (x01History.length === 0) return;
    const lastState = x01History[x01History.length - 1];
    setScore1(lastState.score1);
    setScore2(lastState.score2);
    setCurrentDarts(lastState.currentDarts);
    setTotalDarts1(lastState.totalDarts1);
    setTotalDarts2(lastState.totalDarts2);
    setActivePlayer(lastState.activePlayer);
    setLegs1(lastState.legs1 || 0);
    setLegs2(lastState.legs2 || 0);
    setSets1(lastState.sets1 || 0);
    setSets2(lastState.sets2 || 0);
    setX01History(prev => prev.slice(0, -1));
  };

  const handleUndoCricket = () => {
    if (cricketHistory.length === 0) return;
    const lastState = cricketHistory[cricketHistory.length - 1];
    setCricketMarks1(lastState.cricketMarks1);
    setCricketMarks2(lastState.cricketMarks2);
    setCricketPoints1(lastState.cricketPoints1);
    setCricketPoints2(lastState.cricketPoints2);
    setActivePlayer(lastState.activePlayer);
    setCurrentDarts(lastState.currentDarts || []);
    setCricketHistory(prev => prev.slice(0, -1));
  };

  const handleUndo = match.gameType === 'X01' ? handleUndoX01 : handleUndoCricket;

  const handleCricketMark = (num: number, multiplier: number = 1) => {
    if (num === 25 && multiplier === 3) multiplier = 2;

    const stateSnapshot = {
      cricketMarks1: { ...cricketMarks1 },
      cricketMarks2: { ...cricketMarks2 },
      cricketPoints1,
      cricketPoints2,
      activePlayer,
      currentDarts: [...currentDarts],
    };
    setCricketHistory(prev => [...prev, stateSnapshot]);
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
            setPoints((prev: number) => prev + num);
          } else {
            setOpponentPoints((prev: number) => prev + num);
          }
        }
      }
    }

    newMarks[num] = currentMarks;
    setMarks(newMarks);
    
    const newDarts = [...currentDarts, num];
    if (newDarts.length === 3) {
      setCurrentDarts([]);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else {
      setCurrentDarts(newDarts);
    }

    // Check for win
    const allClosed = Object.values(newMarks).every((m: number) => m >= 3);
    const leading = cricketConfig.mode === 'Standard' 
      ? (activePlayer === 1 ? cricketPoints1 >= cricketPoints2 : cricketPoints2 >= cricketPoints1)
      : (activePlayer === 1 ? cricketPoints1 <= cricketPoints2 : cricketPoints2 <= cricketPoints1);

    if (allClosed && leading) {
      // Game over logic
    }
  };

  const handleCricketMiss = () => {
    const stateSnapshot = {
      cricketMarks1: { ...cricketMarks1 },
      cricketMarks2: { ...cricketMarks2 },
      cricketPoints1,
      cricketPoints2,
      activePlayer,
      currentDarts: [...currentDarts],
    };
    setCricketHistory(prev => [...prev, stateSnapshot]);

    const newDarts = [...currentDarts, 0];
    if (newDarts.length === 3) {
      setCurrentDarts([]);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else {
      setCurrentDarts(newDarts);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx(
        "relative w-full h-full flex items-center justify-center p-0",
        isSyndicate ? "leather-bg" : isDark ? "bg-slate-950/95 backdrop-blur-xl md:rounded-[3rem]" : "bg-slate-950/95 backdrop-blur-xl md:rounded-[3rem]"
      )}
    >
      <div className={clsx(
        "w-full h-full md:h-auto md:max-w-6xl overflow-hidden shadow-2xl flex flex-col",
        isSyndicate ? "merrowed-border leather-bg border-syndicate-red" : isDark ? "bg-slate-900 md:rounded-[3rem] border border-slate-800" : "bg-slate-900 md:rounded-[3rem] border border-slate-800"
      )}>
        {/* Syndicate Vault Progress */}
        {isSyndicate && (
          <div className="px-8 pt-8 pb-0">
            <div className="flex justify-between items-end mb-2">
              <span className="font-rocker text-[10px] tracking-widest text-syndicate-red uppercase">The Vault</span>
              <span className="font-mono text-[10px] text-bounty-gold">MILESTONE: 100%</span>
            </div>
            <div className="h-6 w-full bg-onyx border border-steel-gray rounded-full overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${vaultProgress}%` }}
                className="h-full vault-liquid relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[pulse_2s_infinite]" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={clsx(
          "p-4 border-b flex items-center justify-between text-xs font-bold uppercase tracking-widest",
          isSyndicate ? "border-syndicate-red/30 bg-onyx text-steel-gray" : isDark ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-800 bg-slate-900 text-slate-400"
        )}>
          <div className="flex-1">
            {match.gameType === 'X01' ? (getCheckoutSuggestion(activePlayer === 1 ? score1 : score2, x01Config?.outRule) || "Game On!") : "Good luck!"}
          </div>
          <div className="flex gap-6">
            <span>Avg: <span className={isSyndicate ? "text-nasty-cream" : "text-white"}>{(activePlayer === 1 ? (score1 === x01Config.startScore ? 0 : (x01Config.startScore - score1) / (totalDarts1 / 3 || 1)) : (score2 === x01Config.startScore ? 0 : (x01Config.startScore - score2) / (totalDarts2 / 3 || 1))).toFixed(2)}</span></span>
            <span>Darts: <span className={isSyndicate ? "text-nasty-cream" : "text-white"}>{activePlayer === 1 ? totalDarts1 + currentDarts.length : totalDarts2 + currentDarts.length}</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Scoreboard */}
          <div className={clsx(
            "flex-1 grid grid-rows-2 divide-y",
            isSyndicate ? "divide-syndicate-red/20" : "divide-slate-800"
          )}>
            <PlayerScore 
              player={player1} 
              score={match.gameType === 'X01' ? score1 : cricketPoints1} 
              legs={legs1} 
              sets={sets1} 
              isActive={activePlayer === 1}
              marks={match.gameType === 'Cricket' ? cricketMarks1 : undefined}
              isShaking={isShaking && activePlayer === 1}
              darts={activePlayer === 1 ? currentDarts : []}
              roundTotal={activePlayer === 1 ? currentDarts.reduce((a, b) => a + b, 0) : 0}
              suggestionParts={match.gameType === 'X01' && activePlayer === 1 ? getCheckoutSuggestion(score1, x01Config?.outRule)?.split(' ').filter(Boolean) : []}
            />
            <PlayerScore 
              player={player2} 
              score={match.gameType === 'X01' ? score2 : cricketPoints2} 
              legs={legs2} 
              sets={sets2} 
              isActive={activePlayer === 2}
              marks={match.gameType === 'Cricket' ? cricketMarks2 : undefined}
              isShaking={isShaking && activePlayer === 2}
              darts={activePlayer === 2 ? currentDarts : []}
              roundTotal={activePlayer === 2 ? currentDarts.reduce((a, b) => a + b, 0) : 0}
              suggestionParts={match.gameType === 'X01' && activePlayer === 2 ? getCheckoutSuggestion(score2, x01Config?.outRule)?.split(' ').filter(Boolean) : []}
            />
          </div>

          {/* Controls */}
          <div className={clsx(
            "p-2",
            isSyndicate ? "bg-onyx" : "bg-slate-950"
          )}>
            {match.gameType === 'X01' ? (
              <div className="grid grid-cols-5 gap-1">
                <div className="col-span-4 grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                    <KeyButton 
                      key={n} 
                      onClick={() => handleX01Dart(n)}
                      className={clsx(
                        modifier !== 'single' && "border-syndicate-red/50"
                      )}
                    >
                      {modifier === 'double' ? `D${n}` : modifier === 'triple' ? `T${n}` : n}
                    </KeyButton>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <KeyButton onClick={() => handleX01Dart(0)} className="text-sm">OUT</KeyButton>
                  <KeyButton onClick={() => handleX01Dart(25)} className="text-sm">SB</KeyButton>
                  <KeyButton 
                    onClick={() => setModifier(modifier === 'double' ? 'single' : 'double')}
                    className={clsx(
                      "text-sm",
                      modifier === 'double' ? (isSyndicate ? "bg-syndicate-red text-nasty-cream" : "bg-indigo-600 text-white") : ""
                    )}
                  >
                    D
                  </KeyButton>
                  <KeyButton 
                    onClick={() => setModifier(modifier === 'triple' ? 'single' : 'triple')}
                    className={clsx(
                      "text-sm",
                      modifier === 'triple' ? (isSyndicate ? "bg-syndicate-red text-nasty-cream" : "bg-indigo-600 text-white") : ""
                    )}
                  >
                    T
                  </KeyButton>
                  <KeyButton onClick={handleUndo} className="text-sm">
                    <RotateCcw className="w-5 h-5 mx-auto" />
                  </KeyButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {[20, 19, 18, 17, 16, 15, 25].map(num => (
                  <div key={num} className="space-y-2">
                    <button
                      onClick={() => handleCricketMark(num, 1)}
                      className={clsx(
                        "w-full py-6 rounded-2xl border font-black text-xl transition-all shadow-lg",
                        isSyndicate 
                          ? "bg-onyx border-syndicate-red/30 text-nasty-cream hover:border-syndicate-red" 
                          : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      )}
                    >
                      {num === 25 ? 'B' : num}
                    </button>
                    <div className="flex gap-2 justify-center mt-2">
                      <button 
                        onClick={() => handleCricketMark(num, 2)} 
                        className={clsx(
                          "flex-1 py-3 text-sm font-bold rounded-lg border transition-colors",
                          isSyndicate 
                            ? "bg-onyx border-syndicate-red/20 text-syndicate-red hover:text-nasty-cream" 
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                      >D</button>
                      <button 
                        onClick={() => handleCricketMark(num, 3)} 
                        className={clsx(
                          "flex-1 py-3 text-sm font-bold rounded-lg border transition-colors",
                          isSyndicate 
                            ? "bg-onyx border-syndicate-red/20 text-syndicate-red hover:text-nasty-cream" 
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        )}
                      >T</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleCricketMiss}
                  className={clsx(
                    "col-span-4 md:col-span-7 mt-2 py-4 rounded-2xl font-bold text-xl transition-all shadow-lg",
                    isSyndicate ? "bg-onyx border-syndicate-red/30 text-nasty-cream hover:border-syndicate-red" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  )}
                >
                  MISS
                </button>
                <button
                  onClick={() => {
                    setCurrentDarts([]);
                    setActivePlayer(activePlayer === 1 ? 2 : 1);
                  }}
                  className={clsx(
                    "col-span-4 md:col-span-7 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl",
                    isSyndicate 
                      ? "bg-syndicate-red text-nasty-cream shadow-syndicate-red/20" 
                      : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500"
                  )}
                >
                  <Zap className="w-5 h-5" />
                  Next Player
                </button>
                <button
                  onClick={handleUndoCricket}
                  className={clsx(
                    "col-span-4 md:col-span-7 mt-2 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    isSyndicate ? "bg-onyx border border-syndicate-red/30 text-syndicate-red hover:bg-syndicate-red/10" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  Undo Last Mark
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={clsx(
          "p-6 border-t flex gap-4",
          isSyndicate ? "border-syndicate-red/30 bg-onyx" : "border-slate-800 bg-slate-900"
        )}>
          <button
            onClick={() => saveMatch(false)}
            disabled={saving || (auth.currentUser?.uid !== match.player1Id && auth.currentUser?.uid !== match.player2Id)}
            className={clsx(
              "flex-1 py-4 rounded-2xl font-bold transition-all border disabled:opacity-50",
              isSyndicate 
                ? "bg-onyx border-syndicate-red/30 text-syndicate-red hover:bg-syndicate-red/10" 
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            )}
          >
            Save Progress
          </button>
          <button
            onClick={() => saveMatch(true)}
            disabled={saving || (auth.currentUser?.uid !== match.player1Id && auth.currentUser?.uid !== match.player2Id)}
            className={clsx(
              "flex-1 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl",
              isSyndicate 
                ? "bg-syndicate-red text-nasty-cream shadow-syndicate-red/20" 
                : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500"
            )}
          >
            <Trophy className="w-5 h-5" />
            Finalize Match
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PlayerScore({ player, score, legs, sets, isActive, marks, isShaking, darts, roundTotal, suggestionParts = [] }: {
  player: Player, 
  score: number, 
  legs: number, 
  sets: number, 
  isActive: boolean,
  marks?: Record<number, number>,
  isShaking?: boolean,
  darts?: number[],
  roundTotal?: number,
  suggestionParts?: string[]
}) {
  const { isSyndicate, isDark } = useTheme();

  return (
    <motion.div 
      animate={{ 
        x: isShaking ? [0, -10, 10, -10, 10, 0] : 0
      }}
      className={clsx(
        "p-4 transition-all duration-500 relative overflow-hidden flex flex-col justify-between",
        isActive 
          ? (isSyndicate ? "bg-syndicate-red/10" : "bg-indigo-600/10") 
          : "bg-transparent opacity-60"
      )}
    >
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className={clsx(
            "absolute top-0 left-0 w-1 h-full",
            isSyndicate ? "bg-syndicate-red" : "bg-indigo-500"
          )}
        />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`}
              className={clsx(
                "w-10 h-10 rounded-xl object-cover ring-2 transition-all duration-500",
                isActive 
                  ? (isSyndicate ? "ring-syndicate-red scale-105 shadow-lg" : "ring-indigo-500 scale-105 shadow-lg") 
                  : (isSyndicate ? "ring-steel-gray opacity-50" : "ring-slate-800 opacity-50"),
                isSyndicate && player.isVested && "stitched-red"
              )}
              referrerPolicy="no-referrer"
            />
            {isSyndicate && player.hasBounty && (
              <div className="absolute -top-1 -right-1 bg-bounty-gold p-0.5 rounded-full shadow-lg">
                <Crosshair className="w-3 h-3 text-onyx" />
              </div>
            )}
          </div>
          <div>
            <h3 className={clsx(
              "text-sm font-bold transition-colors",
              isActive 
                ? (isSyndicate ? "text-nasty-cream font-rocker" : "text-white") 
                : (isSyndicate ? "text-steel-gray font-rocker" : "text-slate-500")
            )}>{player.name}</h3>
          </div>
        </div>
        <div className={clsx(
          "text-2xl font-black tabular-nums",
          isActive ? (isSyndicate ? "text-nasty-cream" : "text-white") : "text-slate-600"
        )}>
          {score}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2].map(i => {
            const hasDart = darts?.[i] !== undefined;
            const suggestionIndex = i - (darts?.length || 0);
            const suggestionText = !hasDart && isActive && suggestionParts && suggestionIndex >= 0 && suggestionIndex < suggestionParts.length
              ? suggestionParts[suggestionIndex]
              : '';

            return (
              <div
                key={i}
                className={clsx(
                  "h-10 flex-1 rounded-lg border flex items-center justify-center font-mono text-sm font-bold",
                  isSyndicate ? "bg-onyx border-syndicate-red/20 text-nasty-cream" : "bg-slate-800 border-slate-700 text-white"
                )}
              >
                {hasDart ? darts[i] : <span className={clsx("opacity-30 font-light", isSyndicate ? "text-syndicate-red/80" : "text-slate-400")}>{suggestionText}</span>}
              </div>
            );
          })}
        </div>
        <div className={clsx(
          "w-12 text-right font-mono text-xl font-black",
          isActive ? (isSyndicate ? "text-syndicate-red" : "text-indigo-400") : "text-slate-700"
        )}>
          {roundTotal || 0}
        </div>
      </div>

      <div className="text-center relative">
        <span className={clsx(
          "text-8xl font-black tracking-tighter tabular-nums transition-all duration-500",
          isActive 
            ? (isSyndicate ? "text-nasty-cream scale-110 font-mono" : "text-white scale-110") 
            : (isSyndicate ? "text-steel-gray/30 font-mono" : "text-slate-700")
        )}>
          {score}
        </span>
        {isSyndicate && player.hasBounty && isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-bounty-gold/20 animate-pulse" />
            <div className="h-full w-px bg-bounty-gold/20 absolute animate-pulse" />
          </div>
        )}
      </div>

      {marks && (
        <div className="mt-8 grid grid-cols-7 gap-2">
          {[20, 19, 18, 17, 16, 15, 25].map(num => (
            <div key={num} className="flex flex-col items-center gap-1">
              <span className={clsx(
                "text-[10px] font-bold",
                isSyndicate ? "text-steel-gray" : "text-slate-500"
              )}>{num === 25 ? 'B' : num}</span>
              <div className="flex flex-col gap-0.5 h-4 justify-end">
                {marks[num] >= 3 ? (
                  <div className={clsx(
                    "w-4 h-4 rounded-sm flex items-center justify-center",
                    isSyndicate ? "bg-syndicate-red" : "bg-emerald-400"
                  )}>
                    <Check className="w-3 h-3 text-slate-900" strokeWidth={4} />
                  </div>
                ) : (
                  [1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={clsx(
                        "w-4 h-1 rounded-full transition-all",
                        marks[num] >= i
                          ? (isSyndicate ? "bg-syndicate-red" : "bg-emerald-400")
                          : (isSyndicate ? "bg-onyx" : "bg-slate-800")
                      )}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function KeyButton({ children, onClick, className = '' }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const { isSyndicate, isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-16 rounded-2xl border text-2xl font-bold transition-all active:scale-95 shadow-lg",
        isSyndicate 
          ? "bg-onyx border-syndicate-red/30 text-nasty-cream hover:border-syndicate-red font-rocker" 
          : isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
        className
      )}
    >
      {children}
    </button>
  );
}
