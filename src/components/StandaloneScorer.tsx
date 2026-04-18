import { X01HistoryState, CricketHistoryState } from "../types";
import React, { useState } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';
import { Target, Play, RotateCcw, Zap, Settings2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type GameMode = 'X01' | 'Cricket';
type X01StartScore = 301 | 501 | 701;

export function StandaloneScorer() {
  const { isSyndicate, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('X01');
  const [startScore, setStartScore] = useState<X01StartScore>(301);
  const [x01OutRule, setX01OutRule] = useState<'single' | 'double'>('double');
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  // Game State
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [score1, setScore1] = useState<number>(301);
  const [score2, setScore2] = useState<number>(301);
  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
  const [x01History, setX01History] = useState<X01HistoryState[]>([]);
  const [cricketHistory, setCricketHistory] = useState<CricketHistoryState[]>([]);
  const [modifier, setModifier] = useState<'single' | 'double' | 'triple'>('single');
  const [totalDarts1, setTotalDarts1] = useState(0);
  const [totalDarts2, setTotalDarts2] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  // Cricket State
  const [cricketMarks1, setCricketMarks1] = useState<Record<number, number>>({
    20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0
  });
  const [cricketMarks2, setCricketMarks2] = useState<Record<number, number>>({
    20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0
  });
  const [cricketPoints1, setCricketPoints1] = useState(0);
  const [cricketPoints2, setCricketPoints2] = useState(0);

  const startGame = () => {
    setScore1(startScore);
    setScore2(startScore);
    setCurrentDarts([]);
    setX01History([]);
    setCricketHistory([]);
    setActivePlayer(1);
    setTotalDarts1(0);
    setTotalDarts2(0);
    setWinner(null);
    setModifier('single');
    setCricketMarks1({ 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 });
    setCricketMarks2({ 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 });
    setCricketPoints1(0);
    setCricketPoints2(0);
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    setWinner(null);
  };

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

  const handleX01Dart = (value: number) => {
    if (winner) return;

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
    };
    setX01History(prev => [...prev, stateSnapshot]);

    const currentScore = activePlayer === 1 ? score1 : score2;
    const newScore = currentScore - points;
    const newDarts = [...currentDarts, points];

    // Double out rule
    const canWin = x01OutRule === 'single' || (modifier as string) === 'double' || (value === 25 && (modifier as string) === 'double');

    if (newScore === 0 && canWin) {
      if (activePlayer === 1) {
        setScore1(0);
        setTotalDarts1(prev => prev + newDarts.length);
        setWinner(player1Name);
      } else {
        setScore2(0);
        setTotalDarts2(prev => prev + newDarts.length);
        setWinner(player2Name);
      }
      setCurrentDarts([]);
    } else if (newScore < 0 || (newScore === 1 && x01OutRule === 'double') || (newScore === 0 && !canWin)) {
      // Bust
      const turnPoints = currentDarts.reduce((a, b) => a + b, 0);
      setCurrentDarts([]);
      if (activePlayer === 1) {
        setScore1(score1 + turnPoints);
        setTotalDarts1(prev => prev + 3);
        setActivePlayer(2);
      } else {
        setScore2(score2 + turnPoints);
        setTotalDarts2(prev => prev + 3);
        setActivePlayer(1);
      }
    } else {
      if (activePlayer === 1) setScore1(newScore);
      else setScore2(newScore);

      if (newDarts.length === 3) {
        setCurrentDarts([]);
        if (activePlayer === 1) {
          setTotalDarts1(prev => prev + 3);
          setActivePlayer(2);
        } else {
          setTotalDarts2(prev => prev + 3);
          setActivePlayer(1);
        }
      } else {
        setCurrentDarts(newDarts);
      }
    }
    setModifier('single');
  };

  const handleCricketMark = (num: number, multiplier: number = 1) => {
    if (winner) return;
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

    let newMarks = { ...marks };
    let currentMarks = marks[num];

    for (let i = 0; i < multiplier; i++) {
      if (currentMarks < 3) {
        currentMarks++;
      } else {
        // Standard mode: score if opponent hasn't closed
        if (opponentMarks[num] < 3) {
          setPoints((prev: number) => prev + num);
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

    // Check win condition: all closed and points >= opponent
    const allClosed = Object.values(newMarks).every((m: number) => m >= 3);
    const leading = activePlayer === 1 ? cricketPoints1 >= cricketPoints2 : cricketPoints2 >= cricketPoints1;

    if (allClosed && leading) {
      setWinner(activePlayer === 1 ? player1Name : player2Name);
    }
  };

  const handleCricketMiss = () => {
    if (winner) return;

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

  const handleUndoCricket = () => {
    if (cricketHistory.length === 0 || winner) return;
    const lastState = cricketHistory[cricketHistory.length - 1];
    setCricketMarks1(lastState.cricketMarks1);
    setCricketMarks2(lastState.cricketMarks2);
    setCricketPoints1(lastState.cricketPoints1);
    setCricketPoints2(lastState.cricketPoints2);
    setActivePlayer(lastState.activePlayer);
    setCurrentDarts(lastState.currentDarts || []);
    setCricketHistory(prev => prev.slice(0, -1));
  };

  const handleUndoX01 = () => {
    if (x01History.length === 0 || winner) return;
    const lastState = x01History[x01History.length - 1];
    setScore1(lastState.score1);
    setScore2(lastState.score2);
    setCurrentDarts(lastState.currentDarts);
    setTotalDarts1(lastState.totalDarts1);
    setTotalDarts2(lastState.totalDarts2);
    setActivePlayer(lastState.activePlayer);
    setX01History(prev => prev.slice(0, -1));
  };


  if (isPlaying) {
    return (
      <div className={clsx(
        "relative w-full h-full flex items-center justify-center p-0",
        isSyndicate ? "leather-bg" : isDark ? "bg-slate-950/95 md:rounded-[3rem]" : "bg-slate-950/95 md:rounded-[3rem]"
      )}>
        <div className={clsx(
          "w-full h-full md:h-auto md:max-w-6xl overflow-hidden shadow-2xl flex flex-col",
          isSyndicate ? "merrowed-border leather-bg border-syndicate-red" : isDark ? "bg-slate-900 md:rounded-[3rem] border border-slate-800" : "bg-slate-900 md:rounded-[3rem] border border-slate-800"
        )}>
          {/* Header */}
          <div className={clsx(
            "p-4 border-b flex items-center justify-between text-xs font-bold uppercase tracking-widest",
            isSyndicate ? "border-syndicate-red/30 bg-onyx text-steel-gray" : isDark ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-800 bg-slate-900 text-slate-400"
          )}>
            <div className="flex items-center gap-4">
               <button
                  onClick={endGame}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  End Game
                </button>
                <div className={clsx(
                  "px-3 py-1 rounded-md",
                  isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : "bg-indigo-600/20 text-indigo-400"
                )}>
                  {gameMode === 'X01' ? `${startScore} SPRINT` : 'CRICKET'}
                </div>
            </div>

            <div className="flex-1 text-center">
              {gameMode === 'X01' && !winner ? (getCheckoutSuggestion(activePlayer === 1 ? score1 : score2, x01OutRule) || "Game On!") : "Good luck!"}
            </div>

            <div className="flex gap-6">
              {gameMode === 'X01' && (
                <>
                  <span>Avg: <span className={isSyndicate ? "text-nasty-cream" : "text-white"}>
                    {(activePlayer === 1 ? (score1 === startScore ? 0 : (startScore - score1) / (totalDarts1 / 3 || 1)) : (score2 === startScore ? 0 : (startScore - score2) / (totalDarts2 / 3 || 1))).toFixed(2)}
                  </span></span>
                  <span>Darts: <span className={isSyndicate ? "text-nasty-cream" : "text-white"}>
                    {activePlayer === 1 ? totalDarts1 + currentDarts.length : totalDarts2 + currentDarts.length}
                  </span></span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {winner ? (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                  <Trophy className={clsx("w-32 h-32 mb-8", isSyndicate ? "text-bounty-gold animate-bounce" : "text-amber-400")} />
                  <h2 className={clsx("text-6xl font-black mb-4", isSyndicate ? "text-nasty-cream font-rocker branded-text" : "text-white")}>
                    {winner} WINS!
                  </h2>
                  <button
                    onClick={startGame}
                    className={clsx(
                      "mt-8 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-xl",
                      isSyndicate ? "bg-syndicate-red text-nasty-cream hover:bg-red-700 shadow-syndicate-red/20" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20"
                    )}
                  >
                    Play Again
                  </button>
               </div>
            ) : (
              <>
                {/* Scoreboard */}
                <div className={clsx(
                  "flex-1 grid grid-rows-2 divide-y",
                  isSyndicate ? "divide-syndicate-red/20" : "divide-slate-800"
                )}>
                  <PlayerScore
                    name={player1Name}
                    score={gameMode === 'X01' ? score1 : cricketPoints1}
                    isActive={activePlayer === 1}
                    marks={gameMode === 'Cricket' ? cricketMarks1 : undefined}
                    darts={activePlayer === 1 ? currentDarts : []}
                    roundTotal={activePlayer === 1 ? currentDarts.reduce((a, b) => a + b, 0) : 0}
                    suggestionParts={gameMode === 'X01' && activePlayer === 1 ? getCheckoutSuggestion(score1, x01OutRule)?.split(' ').filter(Boolean) : []}
                  />
                  <PlayerScore
                    name={player2Name}
                    score={gameMode === 'X01' ? score2 : cricketPoints2}
                    isActive={activePlayer === 2}
                    marks={gameMode === 'Cricket' ? cricketMarks2 : undefined}
                    darts={activePlayer === 2 ? currentDarts : []}
                    roundTotal={activePlayer === 2 ? currentDarts.reduce((a, b) => a + b, 0) : 0}
                    suggestionParts={gameMode === 'X01' && activePlayer === 2 ? getCheckoutSuggestion(score2, x01OutRule)?.split(' ').filter(Boolean) : []}
                  />
                </div>

                {/* Controls */}
                <div className={clsx(
                  "p-2",
                  isSyndicate ? "bg-onyx" : "bg-slate-950"
                )}>
                  {gameMode === 'X01' ? (
                    <div className="grid grid-cols-5 gap-1">
                      <div className="col-span-4 grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                          <KeyButton
                            key={n}
                            onClick={() => handleX01Dart(n)}
                            className={clsx(modifier !== 'single' && "border-syndicate-red/50")}
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
                          className={clsx("text-sm", modifier === 'double' ? (isSyndicate ? "bg-syndicate-red text-nasty-cream" : "bg-indigo-600 text-white") : "")}
                        >D</KeyButton>
                        <KeyButton
                          onClick={() => setModifier(modifier === 'triple' ? 'single' : 'triple')}
                          className={clsx("text-sm", modifier === 'triple' ? (isSyndicate ? "bg-syndicate-red text-nasty-cream" : "bg-indigo-600 text-white") : "")}
                        >T</KeyButton>
                        <KeyButton onClick={handleUndoX01} className="text-sm">
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
                              isSyndicate ? "bg-onyx border-syndicate-red/30 text-nasty-cream hover:border-syndicate-red" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                            )}
                          >
                            {num === 25 ? 'B' : num}
                          </button>
                          <div className="flex gap-2 justify-center mt-2">
                            <button onClick={() => handleCricketMark(num, 2)} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg border transition-colors", isSyndicate ? "bg-onyx border-syndicate-red/20 text-syndicate-red hover:text-nasty-cream" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white")}>D</button>
                            <button onClick={() => handleCricketMark(num, 3)} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg border transition-colors", isSyndicate ? "bg-onyx border-syndicate-red/20 text-syndicate-red hover:text-nasty-cream" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white")}>T</button>
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
                          isSyndicate ? "bg-syndicate-red text-nasty-cream shadow-syndicate-red/20" : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500"
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
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className={clsx(
          "text-5xl font-bold tracking-tight mb-2 flex items-center gap-4",
          isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
        )}>
          <Target className={clsx(
            "w-10 h-10",
            isSyndicate ? "text-syndicate-red" : isDark ? "text-indigo-400" : "text-indigo-600"
          )} />
          Scoreboard
        </h1>
        <p className={clsx(
          "text-lg",
          isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
        )}>
          Practice and track scores for casual games. No stats are recorded.
        </p>
      </header>

      <div className={clsx(
        "p-8 rounded-[2.5rem] border shadow-xl",
        isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3 mb-8">
          <Settings2 className={clsx("w-6 h-6", isSyndicate ? "text-syndicate-red" : isDark ? "text-indigo-400" : "text-indigo-600")} />
          <h2 className={clsx(
            "text-2xl font-bold",
            isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
          )}>Game Setup</h2>
        </div>

        <div className="space-y-8">
          {/* Game Mode */}
          <div>
            <label className={clsx(
              "block text-sm font-bold mb-4 uppercase tracking-wider",
              isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
            )}>Select Game</label>
            <div className="grid grid-cols-2 gap-4">
              {(['X01', 'Cricket'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={clsx(
                    "py-4 rounded-2xl font-bold text-lg transition-all border-2",
                    gameMode === mode
                      ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-syndicate-red" : isDark ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-indigo-600 text-indigo-700")
                      : (isSyndicate ? "bg-black/40 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200")
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* X01 Options */}
          <AnimatePresence>
            {gameMode === 'X01' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <label className={clsx(
                    "block text-sm font-bold mb-4 uppercase tracking-wider",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
                  )}>Start Score</label>
                  <div className="grid grid-cols-3 gap-4">
                    {([301, 501, 701] as const).map(score => (
                      <button
                        key={score}
                        onClick={() => setStartScore(score)}
                        className={clsx(
                          "py-3 rounded-xl font-bold transition-all border",
                          startScore === score
                            ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-syndicate-red" : isDark ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-indigo-600 text-indigo-700")
                            : (isSyndicate ? "bg-black/40 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200")
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/50">
                  <label className={clsx(
                    "block text-sm font-bold mb-4 uppercase tracking-wider",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
                  )}>Out Rule</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['single', 'double'] as const).map(rule => (
                      <button
                        key={rule}
                        onClick={() => setX01OutRule(rule)}
                        className={clsx(
                          "py-3 rounded-xl font-bold transition-all border",
                          x01OutRule === rule
                            ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-syndicate-red" : isDark ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-indigo-600 text-indigo-700")
                            : (isSyndicate ? "bg-black/40 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200")
                        )}
                      >
                        {rule === 'single' ? 'Single Out' : 'Double Out'}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players */}
          <div className={clsx("pt-4 border-t", isDark ? "border-slate-800" : "border-slate-100")}>
             <label className={clsx(
                "block text-sm font-bold mb-4 uppercase tracking-wider",
                isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
              )}>Players</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    placeholder="Player 1 Name"
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-bold text-lg",
                      isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900"
                    )}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    placeholder="Player 2 Name"
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-bold text-lg",
                      isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900"
                    )}
                  />
                </div>
              </div>
          </div>

          <button
            onClick={startGame}
            disabled={!player1Name.trim() || !player2Name.trim()}
            className={clsx(
              "w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all mt-8",
              (!player1Name.trim() || !player2Name.trim()) ? "opacity-50 cursor-not-allowed" : "",
              isSyndicate
                ? "bg-syndicate-red text-white shadow-[0_0_20px_rgba(139,0,0,0.4)] hover:bg-red-700"
                : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1"
            )}
          >
            <Play className="w-6 h-6" />
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerScore({ name, score, isActive, marks, darts, roundTotal, suggestionParts = [] }: {
  name: string,
  score: number,
  isActive: boolean,
  marks?: Record<number, number>,
  darts?: number[],
  roundTotal?: number,
  suggestionParts?: string[]
}) {
  const { isSyndicate } = useTheme();

  return (
    <motion.div
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
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl",
            isActive
                ? (isSyndicate ? "bg-syndicate-red text-nasty-cream" : "bg-indigo-600 text-white")
                : (isSyndicate ? "bg-onyx text-steel-gray" : "bg-slate-800 text-slate-500")
          )}>
            {name.charAt(0).toUpperCase()}
          </div>
          <h3 className={clsx(
            "text-lg font-bold transition-colors",
            isActive
              ? (isSyndicate ? "text-nasty-cream font-rocker" : "text-white")
              : (isSyndicate ? "text-steel-gray font-rocker" : "text-slate-500")
          )}>{name}</h3>
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
      </div>

      {marks && (
        <div className="mt-8 grid grid-cols-7 gap-2">
          {[20, 19, 18, 17, 16, 15, 25].map(num => (
            <div key={num} className="flex flex-col items-center gap-1">
              <span className={clsx(
                "text-[10px] font-bold",
                isSyndicate ? "text-steel-gray" : "text-slate-500"
              )}>{num === 25 ? 'B' : num}</span>
              <div className="flex flex-col gap-0.5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={clsx(
                      "w-4 h-1 rounded-full transition-all",
                      marks[num] >= i
                        ? (isSyndicate ? "bg-syndicate-red" : "bg-indigo-500")
                        : (isSyndicate ? "bg-onyx" : "bg-slate-800")
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function KeyButton({ children, onClick, className = '' }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  const { isSyndicate } = useTheme();

  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-16 rounded-2xl border text-2xl font-bold transition-all active:scale-95 shadow-lg",
        isSyndicate
          ? "bg-onyx border-syndicate-red/30 text-nasty-cream hover:border-syndicate-red font-rocker"
          : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
        className
      )}
    >
      {children}
    </button>
  );
}
