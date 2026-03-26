import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Trophy, Skull, Crosshair, Zap } from 'lucide-react';
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
  const [input, setInput] = useState('');
  const [vaultProgress, setVaultProgress] = useState(65);
  const [showWinner, setShowWinner] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const activePlayer = players[activePlayerIndex];

  const toggleView = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView(prev => prev === 'scoreboard' ? 'bracket' : 'scoreboard');
      setTimeout(() => setIsTransitioning(false), 500);
    }, 500);
  };

  const handleInput = (val: string) => {
    if (val === 'DEL') {
      setInput(input.slice(0, -1));
    } else if (val === 'ENTER') {
      const points = parseInt(input) || 0;
      if (points > 180) return;

      const newScore = activePlayer.score - points;
      
      // Screen shake effect
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);

      if (newScore === 0) {
        setShowWinner(true);
      }

      const updatedPlayers = [...players];
      updatedPlayers[activePlayerIndex] = {
        ...activePlayer,
        score: newScore < 0 ? activePlayer.score : newScore,
        history: [...activePlayer.history, points]
      };

      setPlayers(updatedPlayers);
      setInput('');
      setActivePlayerIndex((activePlayerIndex + 1) % players.length);
      
      // Update vault progress slightly on score
      setVaultProgress(prev => Math.min(100, prev + (points / 100)));
    } else {
      if (input.length < 3) setInput(input + val);
    }
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
      <div className="max-w-4xl mx-auto mb-12">
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
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Scoreboard Content ... */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className="font-rocker text-4xl md:text-6xl tracking-tighter text-nasty-cream drop-shadow-lg">
                  301 <span className="text-syndicate-red">SPRINT</span>
                </h1>
                <div className="flex items-center gap-2 bg-syndicate-red/20 px-4 py-2 border border-syndicate-red/40 rounded-sm">
                  <Zap className="w-4 h-4 text-syndicate-red animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest">Syndicate Mode</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    animate={{ 
                      scale: activePlayerIndex === idx ? 1.02 : 1,
                      opacity: activePlayerIndex === idx ? 1 : 0.6,
                      x: isShaking && activePlayerIndex === idx ? [0, -10, 10, -10, 10, 0] : 0
                    }}
                    className={clsx(
                      "merrowed-border p-6 leather-bg relative overflow-hidden",
                      activePlayerIndex === idx && "border-syndicate-red shadow-[0_0_30px_rgba(139,0,0,0.3)]",
                      player.hasBounty && activePlayerIndex === idx && "border-bounty-gold shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    )}
                  >
                    {player.hasBounty && (
                      <div className="absolute top-0 right-0 p-2">
                        <Crosshair className="w-6 h-6 text-bounty-gold animate-spin-slow" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                      <div className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center border-4",
                        player.isVested ? "border-syndicate-red stitched-red" : "border-steel-gray"
                      )}>
                        {player.isVested ? <Shield className="w-8 h-8 text-syndicate-red" /> : <Skull className="w-8 h-8 text-steel-gray" />}
                      </div>
                      <div>
                        <h3 className={clsx(
                          "font-rocker text-2xl tracking-wide",
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
                        className="font-mono text-8xl font-black text-center tracking-tighter"
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

                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {player.history.slice(-5).map((s, i) => (
                        <span key={i} className="font-mono text-xs bg-onyx px-2 py-1 border border-steel-gray/30 text-steel-gray">
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
              <div className="merrowed-border p-8 leather-bg h-full">
                <div className="mb-8">
                  <label className="font-rocker text-xs text-syndicate-red uppercase tracking-widest mb-2 block">Enter Score</label>
                  <div className="bg-onyx border-2 border-steel-gray p-4 font-mono text-4xl text-center text-bounty-gold shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                    {input || '000'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'DEL', 0, 'ENTER'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleInput(btn.toString())}
                      className={clsx(
                        "h-16 font-rocker text-xl transition-all active:scale-95",
                        btn === 'ENTER' 
                          ? "col-span-1 bg-syndicate-red text-nasty-cream border-2 border-syndicate-red shadow-[0_4px_0_#4a0000] active:shadow-none active:translate-y-1" 
                          : "bg-onyx border-2 border-steel-gray text-nasty-cream hover:border-syndicate-red"
                      )}
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-steel-gray">
                    <span>Last Dart</span>
                    <span className="text-nasty-cream">Double 16</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-steel-gray">
                    <span>Avg Score</span>
                    <span className="text-nasty-cream">42.5</span>
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
