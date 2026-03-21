import React, { useState } from 'react';
import { Player } from '../types';
import { db, collection, addDoc } from '../firebase';
import { Plus, Search, User as UserIcon, MoreVertical } from 'lucide-react';

interface PlayerViewProps {
  players: Player[];
}

export default function PlayerView({ players }: PlayerViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [search, setSearch] = useState('');

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, 'players'), {
        name: newName,
        email: newEmail,
        stats: { wins: 0, losses: 0, avgScore: 0 }
      });
      setNewName('');
      setNewEmail('');
      setShowAdd(false);
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search players..." 
            className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-amber-500 text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Player
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Add New Player</h3>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email (Optional)</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-4 px-6 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 px-6 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => (
          <div key={player.id} className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900/60 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                {player.photoURL ? (
                  <img src={player.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <button className="text-zinc-600 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <h4 className="text-lg font-bold mb-1">{player.name}</h4>
            <p className="text-zinc-500 text-sm mb-4">{player.email || 'No email provided'}</p>
            
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
              <div className="text-center">
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Wins</div>
                <div className="text-amber-500 font-mono font-bold">{player.stats?.wins || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Losses</div>
                <div className="text-rose-500 font-mono font-bold">{player.stats?.losses || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Avg</div>
                <div className="text-blue-500 font-mono font-bold">{player.stats?.avgScore?.toFixed(1) || '0.0'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
