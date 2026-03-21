import React, { useState } from 'react';
import { Tournament, Player, Permission, Season } from '../types';
import { db, collection, addDoc, Timestamp, updateDoc, doc } from '../firebase';
import { Plus, Calendar, Trophy, ChevronRight, Play, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface TournamentViewProps {
  tournaments: Tournament[];
  players: Player[];
  currentUser: Player | null;
  seasons: Season[];
}

export default function TournamentView({ tournaments, players, currentUser, seasons }: TournamentViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [seasonId, setSeasonId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const hasPermission = (perm: Permission) => {
    if (currentUser?.email?.toLowerCase() === 'kingoflakemoor@gmail.com') return true;
    return currentUser?.permissions?.includes(perm);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hasPermission('manage_events')) return;
    try {
      await addDoc(collection(db, 'tournaments'), {
        name,
        location,
        seasonId: seasonId || null,
        date: Timestamp.fromDate(new Date(date)),
        status: 'draft',
        participants: selectedPlayers,
      });
      setName('');
      setLocation('');
      setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setSeasonId('');
      setSelectedPlayers([]);
      setShowAdd(false);
    } catch (error) {
      console.error("Error creating tournament:", error);
    }
  };

  const handleStartTournament = async (tournament: Tournament) => {
    if (!tournament.participants || tournament.participants.length < 2 || !hasPermission('manage_events')) return;
    
    try {
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        status: 'active'
      });

      const participants = [...tournament.participants];
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }

      for (let i = 0; i < participants.length; i += 2) {
        const p1 = participants[i];
        const p2 = participants[i+1] || 'BYE';
        
        await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
          tournamentId: tournament.id,
          player1Id: p1,
          player2Id: p2,
          score1: 0,
          score2: 0,
          legs1: 0,
          legs2: 0,
          status: p2 === 'BYE' ? 'completed' : 'pending',
          winnerId: p2 === 'BYE' ? p1 : null,
          bracketPosition: `WB-R1-M${Math.floor(i/2) + 1}`
        });
      }
    } catch (error) {
      console.error("Error starting tournament:", error);
    }
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Active & Past Events</h3>
        {hasPermission('manage_events') && (
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-amber-500 text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Tournament
          </button>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Create Tournament</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tournament Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    placeholder="e.g. Spring Open 2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    placeholder="e.g. The Darts Den"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Event Date</label>
                  <input 
                    type="datetime-local" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Season</label>
                  <select
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">Standalone Event</option>
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Select Participants ({selectedPlayers.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {players.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id)}
                      className={`p-3 rounded-xl text-sm font-medium border transition-all text-left flex items-center gap-2 ${
                        selectedPlayers.includes(p.id) 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                          : 'bg-black border-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${selectedPlayers.includes(p.id) ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                      {p.name}
                    </button>
                  ))}
                </div>
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
                  disabled={selectedPlayers.length < 2}
                  className="flex-1 py-4 px-6 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tournaments.map(t => (
          <div key={t.id} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl hover:bg-zinc-900/60 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl border ${
                t.status === 'active' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-zinc-800 border-white/5 text-zinc-500'
              }`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">{t.name}</h4>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(t.date.toDate(), 'MMM d, yyyy')}
                  </span>
                  {t.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t.participants?.length || 0} Players
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                    t.status === 'active' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            </div>
            {t.status === 'draft' ? (
              <button 
                onClick={() => handleStartTournament(t)}
                disabled={!hasPermission('manage_events')}
                className="p-4 bg-amber-500/10 rounded-2xl hover:bg-amber-500/20 transition-all group-hover:translate-x-1 flex items-center gap-2 text-amber-500 font-bold disabled:opacity-50"
              >
                <Play className="w-6 h-6" />
                Start
              </button>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl text-zinc-500">
                <ChevronRight className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
        {tournaments.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No tournaments scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
