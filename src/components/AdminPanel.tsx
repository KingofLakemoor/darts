import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc, 
  Timestamp 
} from '../firebase';
import { db } from '../firebase';
import { Player, Season, Tournament, Permission, UserRole } from '../types';
import { Shield, Users, Calendar, Trophy, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface AdminPanelProps {
  currentUser: Player | null;
  userEmail?: string | null;
}

const ALL_PERMISSIONS: Permission[] = ['manage_users', 'manage_seasons', 'manage_events', 'edit_scores'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'seasons' | 'events'>('users');
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  
  // Form states
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventSeasonId, setNewEventSeasonId] = useState('');

  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editingEvent, setEditingEvent] = useState<Tournament | null>(null);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });
    const unsubSeasons = onSnapshot(query(collection(db, 'seasons'), orderBy('startDate', 'desc')), (snapshot) => {
      setSeasons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
    });
    const unsubTournaments = onSnapshot(query(collection(db, 'tournaments'), orderBy('date', 'desc')), (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)));
    });

    return () => {
      unsubPlayers();
      unsubSeasons();
      unsubTournaments();
    };
  }, []);

  const hasPermission = (perm: Permission) => {
    if (userEmail?.toLowerCase() === 'kingoflakemoor@gmail.com' || currentUser?.email?.toLowerCase() === 'kingoflakemoor@gmail.com') return true;
    return currentUser?.permissions?.includes(perm);
  };

  const togglePermission = async (player: Player, perm: Permission) => {
    if (!hasPermission('manage_users')) return;
    const newPermissions = player.permissions?.includes(perm)
      ? player.permissions.filter(p => p !== perm)
      : [...(player.permissions || []), perm];
    
    await updateDoc(doc(db, 'players', player.id), { permissions: newPermissions });
  };

  const toggleRole = async (player: Player) => {
    if (!hasPermission('manage_users')) return;
    const newRole: UserRole = player.role === 'admin' ? 'player' : 'admin';
    await updateDoc(doc(db, 'players', player.id), { role: newRole });
  };

  const createSeason = async () => {
    if (!hasPermission('manage_seasons') || !newSeasonName) return;
    await addDoc(collection(db, 'seasons'), {
      name: newSeasonName,
      startDate: Timestamp.now(),
      endDate: Timestamp.now(), // Placeholder
      status: 'upcoming'
    });
    setNewSeasonName('');
  };

  const updateSeason = async (id: string, data: Partial<Season>) => {
    if (!hasPermission('manage_seasons')) return;
    await updateDoc(doc(db, 'seasons', id), data);
    setEditingSeason(null);
  };

  const createEvent = async () => {
    if (!hasPermission('manage_events') || !newEventName || !newEventDate) return;
    await addDoc(collection(db, 'tournaments'), {
      name: newEventName,
      date: Timestamp.fromDate(new Date(newEventDate)),
      location: newEventLocation,
      seasonId: newEventSeasonId || null,
      status: 'draft',
      participants: []
    });
    setNewEventName('');
    setNewEventDate('');
    setNewEventLocation('');
    setNewEventSeasonId('');
  };

  const updateEvent = async (id: string, data: Partial<Tournament>) => {
    if (!hasPermission('manage_events')) return;
    await updateDoc(doc(db, 'tournaments', id), data);
    setEditingEvent(null);
  };

  const deleteItem = async (col: string, id: string) => {
    const perm = col === 'seasons' ? 'manage_seasons' : 'manage_events';
    if (!hasPermission(perm)) return;
    if (confirm(`Are you sure you want to delete this ${col.slice(0, -1)}?`)) {
      await deleteDoc(doc(db, col, id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-amber-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 flex items-center gap-2 font-medium transition-colors ${
            activeTab === 'users' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-5 h-5" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('seasons')}
          className={`pb-4 px-2 flex items-center gap-2 font-medium transition-colors ${
            activeTab === 'seasons' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          Seasons
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-4 px-2 flex items-center gap-2 font-medium transition-colors ${
            activeTab === 'events' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Trophy className="w-5 h-5" />
          Events
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-700">Player</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {players.map(player => (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={player.photoURL || `https://ui-avatars.com/api/?name=${player.name}`} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">{player.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleRole(player)}
                        disabled={!hasPermission('manage_users') || player.email === 'kingoflakemoor@gmail.com'}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          player.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {player.role}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {ALL_PERMISSIONS.map(perm => (
                          <button
                            key={perm}
                            onClick={() => togglePermission(player, perm)}
                            disabled={!hasPermission('manage_users') || player.role !== 'admin' || player.email === 'kingoflakemoor@gmail.com'}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              player.permissions?.includes(perm)
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-white text-gray-400 border border-gray-200 hover:border-amber-300 hover:text-amber-600'
                            }`}
                          >
                            {perm.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'seasons' && (
          <div className="p-6">
            {hasPermission('manage_seasons') && (
              <div className="flex gap-4 mb-8">
                <input
                  type="text"
                  placeholder="New Season Name (e.g. Spring 2024)"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={createSeason}
                  className="bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Season
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasons.map(season => (
                <div key={season.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 relative group">
                  {editingSeason?.id === season.id ? (
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        value={editingSeason.name}
                        onChange={(e) => setEditingSeason({ ...editingSeason, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                      />
                      <select
                        value={editingSeason.status}
                        onChange={(e) => setEditingSeason({ ...editingSeason, status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => updateSeason(season.id, { name: editingSeason.name, status: editingSeason.status })} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold">Save</button>
                        <button onClick={() => setEditingSeason(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{season.name}</h3>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingSeason(season)} className="text-gray-400 hover:text-amber-600"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => deleteItem('seasons', season.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Calendar className="w-4 h-4" />
                        {season.startDate?.toDate().toLocaleDateString()} - {season.endDate?.toDate().toLocaleDateString()}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        season.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {season.status}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-6">
            {hasPermission('manage_events') && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Event Name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="datetime-local"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    value={newEventSeasonId}
                    onChange={(e) => setNewEventSeasonId(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Standalone Event</option>
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={createEvent}
                  className="w-full bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Event
                </button>
              </div>
            )}

            <div className="space-y-4">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="p-4 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors flex items-center justify-between group">
                  {editingEvent?.id === tournament.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <input 
                        type="text" 
                        value={editingEvent.name}
                        onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200"
                      />
                      <input 
                        type="text" 
                        value={editingEvent.location || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200"
                        placeholder="Location"
                      />
                      <select
                        value={editingEvent.seasonId || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, seasonId: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200"
                      >
                        <option value="">Standalone</option>
                        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => updateEvent(tournament.id, { name: editingEvent.name, location: editingEvent.location, seasonId: editingEvent.seasonId })} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold">Save</button>
                        <button onClick={() => setEditingEvent(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{tournament.name}</h4>
                          <div className="text-sm text-gray-500 flex items-center gap-3">
                            <span>{tournament.date?.toDate().toLocaleDateString()}</span>
                            {tournament.location && <span>• {tournament.location}</span>}
                            {tournament.seasonId && (
                              <span className="text-amber-600 font-medium">
                                • {seasons.find(s => s.id === tournament.seasonId)?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          tournament.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tournament.status}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingEvent(tournament)} className="text-gray-400 hover:text-amber-600"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => deleteItem('tournaments', tournament.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
