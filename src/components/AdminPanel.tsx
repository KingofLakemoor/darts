import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Tournament, Season, Player, GameType, X01Config, CricketConfig } from '../types';
import { Plus, Trash2, Calendar, Trophy, Users, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import { format } from 'date-fns';

export function AdminPanel() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newTournament, setNewTournament] = useState<{
    name: string;
    date: string;
    type: 'single-elimination' | 'double-elimination' | 'round-robin';
    seasonId: string;
    gameType: GameType;
    gameConfig: X01Config | CricketConfig;
  }>({
    name: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: 'single-elimination',
    seasonId: '',
    gameType: 'X01',
    gameConfig: {
      startScore: 301,
      sets: 1,
      legs: 2,
      inRule: 'single',
      outRule: 'double'
    } as X01Config
  });

  useEffect(() => {
    const q = query(collection(db, 'seasons'), orderBy('startDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setSeasons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'players'), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Player)));
    });
  }, []);

  const createSeason = async () => {
    if (!newSeasonName) return;
    await addDoc(collection(db, 'seasons'), {
      name: newSeasonName,
      startDate: new Date().toISOString(),
      active: true
    });
    setNewSeasonName('');
  };

  const toggleSeason = async (id: string, currentActive: boolean) => {
    // Deactivate all other seasons first
    if (!currentActive) {
      const activeSeasons = seasons.filter(s => s.active);
      for (const s of activeSeasons) {
        await updateDoc(doc(db, 'seasons', s.id), { active: false });
      }
    }
    await updateDoc(doc(db, 'seasons', id), { active: !currentActive });
  };

  const createTournament = async () => {
    if (!newTournament.name || !newTournament.seasonId) return;
    await addDoc(collection(db, 'tournaments'), {
      ...newTournament,
      status: 'upcoming',
      participants: []
    });
    setNewTournament({
      name: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      type: 'single-elimination',
      seasonId: newTournament.seasonId,
      gameType: 'X01',
      gameConfig: {
        startScore: 301,
        sets: 1,
        legs: 2,
        inRule: 'single',
        outRule: 'double'
      }
    });
  };

  const deleteTournament = async (id: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      await deleteDoc(doc(db, 'tournaments', id));
    }
  };

  const updatePlayerRole = async (uid: string, newRole: 'admin' | 'player') => {
    await updateDoc(doc(db, 'players', uid), { role: newRole });
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'X01') {
      setNewTournament({ 
        ...newTournament, 
        gameType: 'X01', 
        gameConfig: { startScore: 301, sets: 1, legs: 2, inRule: 'single', outRule: 'double' } 
      });
    } else {
      setNewTournament({ 
        ...newTournament, 
        gameType: 'Cricket', 
        gameConfig: { mode: 'Standard', random: false } 
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 text-lg">Manage seasons, tournaments, and player permissions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Season Management */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Seasons</h2>
          </div>
          
          <div className="flex gap-3 mb-8">
            <input
              type="text"
              value={newSeasonName}
              onChange={(e) => setNewSeasonName(e.target.value)}
              placeholder="Season Name (e.g. Spring 2024)"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <button
              onClick={createSeason}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            {seasons.map(season => (
              <div key={season.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{season.name}</p>
                  <p className="text-xs text-slate-500">Started {format(new Date(season.startDate), 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => toggleSeason(season.id, season.active)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    season.active 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                      : "bg-slate-200 text-slate-600 border border-slate-300"
                  )}
                >
                  {season.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tournament Creation */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">New Tournament</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tournament Name</label>
              <input
                type="text"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Friday Night Open"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newTournament.date}
                  onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Season</label>
                <select
                  value={newTournament.seasonId}
                  onChange={(e) => setNewTournament({ ...newTournament, seasonId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Season</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Game Rules</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => handleGameTypeChange('X01')}
                  className={clsx(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    newTournament.gameType === 'X01' 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  X01
                </button>
                <button
                  onClick={() => handleGameTypeChange('Cricket')}
                  className={clsx(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    newTournament.gameType === 'Cricket' 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  Cricket
                </button>
              </div>

              {newTournament.gameType === 'X01' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Score</label>
                      <select
                        value={(newTournament.gameConfig as X01Config).startScore}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), startScore: parseInt(e.target.value) as 301 | 501 | 701 }
                        })}
                        className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value={301}>301</option>
                        <option value={501}>501</option>
                        <option value={701}>701</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Sets</label>
                      <input
                        type="number"
                        min="1"
                        value={(newTournament.gameConfig as X01Config).sets}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), sets: parseInt(e.target.value) }
                        })}
                        className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Legs per Set</label>
                      <input
                        type="number"
                        min="1"
                        value={(newTournament.gameConfig as X01Config).legs}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), legs: parseInt(e.target.value) }
                        })}
                        className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Out Rule</label>
                      <select
                        value={(newTournament.gameConfig as X01Config).outRule}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), outRule: e.target.value as 'single' | 'double' | 'triple' }
                        })}
                        className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value="single">Single Out</option>
                        <option value="double">Double Out</option>
                        <option value="triple">Triple Out</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {newTournament.gameType === 'Cricket' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Scoring Mode</label>
                    <select
                      value={(newTournament.gameConfig as CricketConfig).mode}
                      onChange={(e) => setNewTournament({
                        ...newTournament,
                        gameConfig: { ...(newTournament.gameConfig as CricketConfig), mode: e.target.value as 'Standard' | 'Cut Throat' }
                      })}
                      className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Cut Throat">Cut Throat</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Random Numbers</label>
                    <button
                      onClick={() => setNewTournament({
                        ...newTournament,
                        gameConfig: { ...(newTournament.gameConfig as CricketConfig), random: !(newTournament.gameConfig as CricketConfig).random }
                      })}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-all relative",
                        (newTournament.gameConfig as CricketConfig).random ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        (newTournament.gameConfig as CricketConfig).random ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={createTournament}
              disabled={!newTournament.name || !newTournament.seasonId}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 mt-4"
            >
              Create Tournament
            </button>
          </div>
        </section>
      </div>

      {/* Player Management */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Player Management</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Player</th>
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Email</th>
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Role</th>
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map(p => (
                <tr key={p.uid}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.photoURL || `https://ui-avatars.com/api/?name=${p.name}`} 
                        className="w-8 h-8 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-bold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-500 text-sm">{p.email}</td>
                  <td className="py-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      p.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {p.role}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <select
                      value={p.role}
                      onChange={(e) => updatePlayerRole(p.uid, e.target.value as 'admin' | 'player')}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="player">Player</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
