import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Trophy, Skull, Crosshair, Zap, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../lib/ThemeContext';

interface Player {
  id: string;
  name: string;
  score: number;
  isVested: boolean;
  hasBounty: boolean;
  history: number[];
}

export function SyndicateScorer() {
  const { setSyndicateMode } = useTheme();

  useEffect(() => {
    setSyndicateMode(true);
    return () => setSyndicateMode(false);
  }, [setSyndicateMode]);

  const [view, setView] = useState<'scoreboard' | 'bracket'>('scoreboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'GHOST', score: 301, isVested: true, hasBounty: true, history: [] },
    { id: '2', name: 'PROSPECT_04', score: 301, isVested: false, hasBounty: false, history: [] }
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [vaultProgress, setVaultProgress] = useState(65);
  const [showWinner, setShowWinner] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
  const [modifier, setModifier] = useState<'single' | 'double' | 'triple'>('single');
  const [history, setHistory] = useState<any[]>([]);

  const activePlayer = players[activePlayerIndex];

  const toggleView = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView(prev => prev === 'scoreboard' ? 'bracket' : 'scoreboard');
      setTimeout(() => setIsTransitioning(false), 500);
    }, 500);
  };

  const handleDart = (value: number) => {
    if (showWinner) return;

    let points = value;
    if (modifier === 'double') points *= 2;
    if (modifier === 'triple') points = value === 25 ? 50 : points * 3;

    const stateSnapshot = {
      players: JSON.parse(JSON.stringify(players)),
      activePlayerIndex,
      currentDarts: [...currentDarts],
    };
    setHistory(prev => [...prev, stateSnapshot]);

    const newScore = activePlayer.score - points;
    const newDarts = [...currentDarts, points];

    // Screen shake effect on significant throws or bust
    if (points >= 40 || newScore <= 1) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    }

    const canWin = modifier === 'double';

    if (newScore === 0 && canWin) {
      // Win
      const updatedPlayers = [...players];
      updatedPlayers[activePlayerIndex] = {
        ...activePlayer,
        score: 0,
        history: [...activePlayer.history, points]
      };
      setPlayers(updatedPlayers);
      setCurrentDarts([]);
      setShowWinner(true);
      setVaultProgress(100);
    } else if (newScore <= 1) {
      // Bust
      const turnPoints = currentDarts.reduce((a, b) => a + b, 0);
      const updatedPlayers = [...players];
      updatedPlayers[activePlayerIndex] = {
        ...activePlayer,
        score: activePlayer.score + turnPoints,
        history: activePlayer.history.slice(0, activePlayer.history.length - currentDarts.length)
      };
      setPlayers(updatedPlayers);
      setCurrentDarts([]);
      setActivePlayerIndex((activePlayerIndex + 1) % players.length);
    } else {
      // Normal throw
      const updatedPlayers = [...players];
      updatedPlayers[activePlayerIndex] = {
        ...activePlayer,
        score: newScore,
        history: [...activePlayer.history, points]
      };
      setPlayers(updatedPlayers);
      
      setVaultProgress(prev => Math.min(100, prev + (points / 100)));

      if (newDarts.length === 3) {
        setCurrentDarts([]);
        setActivePlayerIndex((activePlayerIndex + 1) % players.length);
      } else {
        setCurrentDarts(newDarts);
      }
    }
    setModifier('single');
  };

  const handleUndo = () => {
    if (history.length === 0 || showWinner) return;
    const lastState = history[history.length - 1];
    setPlayers(lastState.players);
    setActivePlayerIndex(lastState.activePlayerIndex);
    setCurrentDarts(lastState.currentDarts);
    setHistory(prev => prev.slice(0, -1));
  };

  return (
    <div className={clsx(
      "min-h-screen leather-bg text-nasty-cream font-sans p-4 md:p-8 overflow-hidden transition-all duration-300 relative",
      activePlayer.hasBounty && view === 'scoreboard' && "ring-[12px] ring-inset ring-bounty-gold/30"
    )}>
      {/* Smoke & Steel Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] smoke-overlay flex items-center justify-center"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-24 h-24 text-syndicate-red opacity-50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Vault Progress Bar */}
      <div className="max-w-4xl mx-auto mb-4 md:mb-12">
        <div className="flex justify-between items-end mb-2">
          <span className="font-rocker text-xs tracking-widest text-syndicate-red uppercase">The Vault</span>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleView}
              className="font-rocker text-[10px] text-steel-gray hover:text-nasty-cream transition-colors uppercase tracking-widest border-b border-steel-gray/30"
            >
              {view === 'scoreboard' ? 'View Bracket' : 'Back to Score'}
            </button>
            <span className="font-mono text-xs text-bounty-gold">MILESTONE: 100%</span>
          </div>
        </div>
        <div className="h-8 w-full bg-onyx border-2 border-steel-gray rounded-full overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${vaultProgress}%` }}
            className="h-full vault-liquid relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[pulse_2s_infinite]" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] font-bold text-onyx mix-blend-overlay">NASTY POURS: {Math.floor(vaultProgress * 1.5)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'scoreboard' ? (
          <motion.div 
            key="scoreboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8"
          >
            {/* Scoreboard Content ... */}
            <div className="lg:col-span-8 space-y-2 md:space-y-6">
              <div className="flex items-center justify-between mb-2 md:mb-8">
                <h1 className="font-rocker text-2xl md:text-6xl tracking-tighter text-nasty-cream drop-shadow-lg">
                  301 <span className="text-syndicate-red">SPRINT</span>
                </h1>
                <div className="flex items-center gap-2 bg-syndicate-red/20 px-4 py-2 border border-syndicate-red/40 rounded-sm">
                  <Zap className="w-4 h-4 text-syndicate-red animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest">Syndicate Mode</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-6">
                {players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    animate={{ 
                      scale: activePlayerIndex === idx ? 1.02 : 1,
                      opacity: activePlayerIndex === idx ? 1 : 0.6,
                      x: isShaking && activePlayerIndex === idx ? [0, -10, 10, -10, 10, 0] : 0
                    }}
                    className={clsx(
                      "merrowed-border p-3 md:p-6 leather-bg relative overflow-hidden",
                      activePlayerIndex === idx && "border-syndicate-red shadow-[0_0_30px_rgba(139,0,0,0.3)]",
                      player.hasBounty && activePlayerIndex === idx && "border-bounty-gold shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    )}
                  >
                    {player.hasBounty && (
                      <div className="absolute top-0 right-0 p-2">
                        <Crosshair className="w-6 h-6 text-bounty-gold animate-spin-slow" />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-2 md:gap-4 mb-2 md:mb-6">
                      <div className={clsx(
                        "w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 md:border-4",
                        player.isVested ? "border-syndicate-red stitched-red" : "border-steel-gray"
                      )}>
                        {player.isVested ? <Shield className="w-5 h-5 md:w-8 md:h-8 text-syndicate-red" /> : <Skull className="w-5 h-5 md:w-8 md:h-8 text-steel-gray" />}
                      </div>
                      <div>
                        <h3 className={clsx(
                          "font-rocker text-sm md:text-2xl tracking-wide leading-tight",
                          player.isVested ? "text-nasty-cream" : "text-steel-gray"
                        )}>
                          {player.name}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                          {player.isVested ? 'Vested Member' : 'Prospect'}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <motion.div 
                        key={player.score}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="font-mono text-5xl md:text-8xl font-black text-center tracking-tighter"
                      >
                        {player.score}
                      </motion.div>
                      {player.hasBounty && activePlayerIndex === idx && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-px bg-bounty-gold/40 animate-pulse" />
                          <div className="h-full w-px bg-bounty-gold/40 absolute animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="mt-2 md:mt-6 flex flex-wrap gap-1 md:gap-2 justify-center">
                      {player.history.slice(-5).map((s, i) => (
                        <span key={i} className="font-mono text-[10px] md:text-xs bg-onyx px-1 md:px-2 py-0.5 md:py-1 border border-steel-gray/30 text-steel-gray">
                          {s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Keypad */}
            <div className="lg:col-span-4">
              <div className="merrowed-border p-4 md:p-8 leather-bg h-full flex flex-col">
                <div className="mb-4 md:mb-8">
                  <label className="font-rocker text-xs text-syndicate-red uppercase tracking-widest mb-2 block">Current Turn</label>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="h-12 flex-1 rounded-sm border-2 bg-onyx border-steel-gray flex items-center justify-center font-mono text-lg font-bold text-nasty-cream shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
                        >
                          {currentDarts?.[i] !== undefined ? currentDarts[i] : ''}
                        </div>
                      ))}
                    </div>
                    <div className="w-16 h-12 flex items-center justify-center bg-syndicate-red/10 border-2 border-syndicate-red/30 rounded-sm font-mono text-2xl font-black text-syndicate-red">
                      {currentDarts.reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                    <div className="grid grid-cols-5 gap-2 h-full">
                      <div className="col-span-4 grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                          <button
                            key={n}
                            onClick={() => handleDart(n)}
                            className={clsx(
                              "h-12 md:h-14 font-rocker text-lg transition-all active:scale-95 bg-onyx border-2 text-nasty-cream shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1",
                              modifier !== 'single' ? "border-syndicate-red/50" : "border-steel-gray hover:border-syndicate-red"
                            )}
                          >
                            {modifier === 'double' ? `D${n}` : modifier === 'triple' ? `T${n}` : n}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => handleDart(0)} className="h-12 md:h-14 font-rocker text-sm transition-all active:scale-95 bg-onyx border-2 border-steel-gray text-nasty-cream hover:border-syndicate-red shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1">OUT</button>
                        <button onClick={() => handleDart(25)} className="h-12 md:h-14 font-rocker text-sm transition-all active:scale-95 bg-onyx border-2 border-steel-gray text-nasty-cream hover:border-syndicate-red shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1">SB</button>
                        <button
                          onClick={() => setModifier(modifier === 'double' ? 'single' : 'double')}
                          className={clsx(
                            "h-12 md:h-14 font-rocker text-lg transition-all active:scale-95 border-2 shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1",
                            modifier === 'double' ? "bg-syndicate-red border-syndicate-red text-nasty-cream shadow-[0_4px_0_#4a0000]" : "bg-onyx border-steel-gray text-nasty-cream hover:border-syndicate-red"
                          )}
                        >D</button>
                        <button
                          onClick={() => setModifier(modifier === 'triple' ? 'single' : 'triple')}
                          className={clsx(
                            "h-12 md:h-14 font-rocker text-lg transition-all active:scale-95 border-2 shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1",
                            modifier === 'triple' ? "bg-syndicate-red border-syndicate-red text-nasty-cream shadow-[0_4px_0_#4a0000]" : "bg-onyx border-steel-gray text-nasty-cream hover:border-syndicate-red"
                          )}
                        >T</button>
                        <button onClick={handleUndo} className="h-12 md:h-14 transition-all active:scale-95 bg-onyx border-2 border-steel-gray text-nasty-cream hover:border-syndicate-red flex items-center justify-center shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1">
                          <RotateCcw className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="bracket"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-4xl mx-auto"
          >
            <div className="merrowed-border p-12 leather-bg">
              <h2 className="font-rocker text-4xl text-center text-syndicate-red mb-12 uppercase tracking-widest">Syndicate Bracket</h2>
              <div className="space-y-12">
                {[1, 2].map((m) => (
                  <div key={m} className="flex items-center gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="bg-onyx border-2 border-steel-gray p-4 flex justify-between items-center">
                        <span className="font-rocker text-lg">GHOST</span>
                        <span className="font-mono text-bounty-gold">2</span>
                      </div>
                      <div className="bg-onyx border-2 border-steel-gray p-4 flex justify-between items-center opacity-50">
                        <span className="font-rocker text-lg">PROSPECT_04</span>
                        <span className="font-mono">0</span>
                      </div>
                    </div>
                    <div className="w-12 h-px bg-syndicate-red relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-syndicate-red rotate-45" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-onyx border-2 border-syndicate-red p-6 text-center">
                        <span className="font-rocker text-2xl text-nasty-cream">FINAL FORGE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Overlay ... */}
      <AnimatePresence>
        {showWinner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 smoke-overlay flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="merrowed-border p-12 leather-bg max-w-md w-full text-center"
            >
              <Trophy className="w-24 h-24 text-bounty-gold mx-auto mb-6 animate-bounce" />
              <h2 className="font-rocker text-6xl text-nasty-cream mb-4 branded-text">WINNER</h2>
              <p className="font-mono text-xl text-bounty-gold mb-8 uppercase tracking-widest">
                {players[activePlayerIndex === 0 ? 1 : 0].name} TAKES THE BOUNTY
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-syndicate-red font-rocker text-xl text-nasty-cream border-2 border-syndicate-red shadow-[0_4px_0_#4a0000]"
              >
                FORGE NEW MATCH
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
