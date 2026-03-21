import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { Target, RotateCcw, User, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScorerViewProps {
  players: Player[];
}

type GameMode = 301 | 501;

export default function ScorerView({ players }: ScorerViewProps) {
  const [mode, setMode] = useState<GameMode>(301);
  const [p1, setP1] = useState<Player | null>(null);
  const [p2, setP2] = useState<Player | null>(null);
  const [score1, setScore1] = useState(301);
  const [score2, setScore2] = useState(301);
  const [legs1, setLegs1] = useState(0);
  const [legs2, setLegs2] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [history, setHistory] = useState<{ player: 1 | 2, score: number, remaining: number }[]>([]);
  const [input, setInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    setScore1(mode);
    setScore2(mode);
  }, [mode]);

  const handleScore = (val: number) => {
    if (val > 180) return;
    
    if (turn === 1) {
      if (score1 - val < 0) {
        // Bust
        setHistory([{ player: 1, score: val, remaining: score1 }, ...history]);
        setTurn(2);
      } else {
        const newScore = score1 - val;
        setScore1(newScore);
        setHistory([{ player: 1, score: val, remaining: newScore }, ...history]);
        if (newScore === 0) {
          const newLegs = legs1 + 1;
          setLegs1(newLegs);
          if (newLegs === 2) {
            alert(`${p1?.name || 'Player 1'} Wins the Match (2-0)!`);
            resetGame();
          } else {
            alert(`${p1?.name || 'Player 1'} Wins the Leg!`);
            setScore1(mode);
            setScore2(mode);
            setTurn(2); // Loser of previous leg starts? Or winner? Let's say p2 starts.
          }
        } else {
          setTurn(2);
        }
      }
    } else {
      if (score2 - val < 0) {
        setHistory([{ player: 2, score: val, remaining: score2 }, ...history]);
        setTurn(1);
      } else {
        const newScore = score2 - val;
        setScore2(newScore);
        setHistory([{ player: 2, score: val, remaining: newScore }, ...history]);
        if (newScore === 0) {
          const newLegs = legs2 + 1;
          setLegs2(newLegs);
          if (newLegs === 2) {
            alert(`${p2?.name || 'Player 2'} Wins the Match!`);
            resetGame();
          } else {
            alert(`${p2?.name || 'Player 2'} Wins the Leg!`);
            setScore1(mode);
            setScore2(mode);
            setTurn(1);
          }
        } else {
          setTurn(1);
        }
      }
    }
    setInput('');
  };

  const resetGame = () => {
    setScore1(mode);
    setScore2(mode);
    setLegs1(0);
    setLegs2(0);
    setTurn(1);
    setHistory([]);
    setGameStarted(false);
  };

  const handleKeypad = (num: string) => {
    if (input.length >= 3) return;
    setInput(prev => prev + num);
  };

  const handleEnter = () => {
    const val = parseInt(input);
    if (isNaN(val)) return;
    handleScore(val);
  };

  if (!gameStarted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Target className="text-amber-500" />
            New Match Setup
          </h3>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              {[301, 501].map(m => (
                <button 
                  key={m}
                  onClick={() => setMode(m as GameMode)}
                  className={`flex-1 py-4 rounded-2xl font-bold border transition-all ${
                    mode === m ? 'bg-amber-500 text-black border-amber-500' : 'bg-black border-white/5 text-zinc-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PlayerSelect 
                label="Player 1" 
                selected={p1} 
                onSelect={setP1} 
                players={players.filter(p => p.id !== p2?.id)} 
              />
              <PlayerSelect 
                label="Player 2" 
                selected={p2} 
                onSelect={setP2} 
                players={players.filter(p => p.id !== p1?.id)} 
              />
            </div>

            <button 
              onClick={() => setGameStarted(true)}
              disabled={!p1 || !p2}
              className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all disabled:opacity-50 text-xl"
            >
              Start Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
        <ScoreCard 
          player={p1!} 
          score={score1} 
          legs={legs1}
          active={turn === 1} 
          lastScore={history.find(h => h.player === 1)?.score} 
        />
        <ScoreCard 
          player={p2!} 
          score={score2} 
          legs={legs2}
          active={turn === 2} 
          lastScore={history.find(h => h.player === 2)?.score} 
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* History */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Match History</h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {history.map((h, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${h.player === 1 ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-blue-500/5 border border-blue-500/10'}`}>
                <span className="text-xs font-bold text-zinc-500">{h.player === 1 ? 'P1' : 'P2'}</span>
                <span className="font-mono font-bold text-lg">{h.score}</span>
                <span className="text-xs text-zinc-500">Left: {h.remaining}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-4">Enter Score</div>
            <div className="text-7xl font-mono font-bold tracking-tighter h-20 flex items-center">
              {input || <span className="text-zinc-800">000</span>}
            </div>
            <div className={`absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-300`} style={{ width: `${(input.length / 3) * 100}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3 flex-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <KeypadButton key={n} label={n.toString()} onClick={() => handleKeypad(n.toString())} />
            ))}
            <KeypadButton label="C" onClick={() => setInput('')} color="rose" />
            <KeypadButton label="0" onClick={() => handleKeypad('0')} />
            <KeypadButton label="Enter" onClick={handleEnter} color="amber" />
          </div>
          
          <button 
            onClick={resetGame}
            className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors py-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Match
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerSelect({ label, selected, onSelect, players }: { label: string, selected: Player | null, onSelect: (p: Player) => void, players: Player[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</label>
      <button 
        onClick={() => setOpen(!open)}
        className="w-full bg-black border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-zinc-600" />
          <span className={selected ? 'text-white' : 'text-zinc-600'}>
            {selected ? selected.name : 'Select Player'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-600" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
          >
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setOpen(false); }}
                className="w-full p-4 text-left hover:bg-white/5 flex items-center justify-between group"
              >
                <span>{p.name}</span>
                {selected?.id === p.id && <Check className="w-4 h-4 text-amber-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreCard({ player, score, legs, active, lastScore }: { player: Player, score: number, legs: number, active: boolean, lastScore?: number }) {
  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border transition-all relative overflow-hidden",
      active ? "bg-amber-500/10 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.1)]" : "bg-zinc-900/40 border-white/5 opacity-50"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10">
            <User className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <h4 className="font-bold text-lg">{player.name}</h4>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {active ? 'Shooting' : 'Waiting'}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Legs</div>
            <div className="font-mono font-bold text-2xl text-amber-500">{legs}</div>
          </div>
          {lastScore !== undefined && (
            <div className="text-right">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last</div>
              <div className="font-mono font-bold text-amber-500">-{lastScore}</div>
            </div>
          )}
        </div>
      </div>
      <div className="text-8xl font-mono font-bold tracking-tighter text-center">
        {score}
      </div>
      {active && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute top-0 right-0 p-4"
        >
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />
        </motion.div>
      )}
    </div>
  );
}

function KeypadButton({ label, onClick, color = 'zinc' }: { label: string, onClick: () => void, color?: 'zinc' | 'amber' | 'rose' }) {
  const colors = {
    zinc: "bg-zinc-800 hover:bg-zinc-700 text-white border-white/5",
    amber: "bg-amber-500 hover:bg-amber-600 text-black border-amber-400/20",
    rose: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20",
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-6 rounded-2xl font-bold text-2xl border transition-all active:scale-95",
        colors[color]
      )}
    >
      {label}
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
