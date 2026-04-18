import React, { useState, useEffect } from 'react';
import { DocumentReference,
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Tournament, Season, Player, GameType, X01Config, CricketConfig, Venue } from '../types';
import { Plus, Trash2, Calendar, Trophy, Users, CheckCircle2, XCircle, Settings2, Shield, Skull, Edit, MapPin, X, Edit2 } from 'lucide-react';
import { generateBracket } from '../utils/bracket';
import { getSeededParticipants } from '../utils/seeding';
import { shuffleArray } from '../utils/random';
import { format } from 'date-fns';
import { AdminTournamentEditor } from './AdminTournamentEditor';
import { useTheme } from '../lib/ThemeContext';
import { motion } from 'motion/react';
import { formatPlayerNames, getFirstLast } from '../utils/playerNames';

export function AdminPanel({ currentUser }: { currentUser: Player | null }) {
  const isAdmin = currentUser?.role === 'admin';
  const isCoordinator = currentUser?.role === 'coordinator';
  const hasAdminPrivileges = isAdmin || isCoordinator;

  const { isSyndicate, isDark } = useTheme();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', email: '' });
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newVenue, setNewVenue] = useState({ name: '', address: '', boards: 4, isSyndicatePartner: false });
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'players'), (snapshot) => {
      const fetchedPlayers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Player));
      setPlayers(formatPlayerNames(fetchedPlayers));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'tournaments'), (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'venues'), (snapshot) => {
      setVenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue)));
    });
  }, []);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newTournament, setNewTournament] = useState<{
    name: string;
    date: string;
    type: 'single-elimination' | 'double-elimination' | 'round-robin';
    seasonId: string;
    venueId: string;
    gameType: GameType;
    gameConfig: X01Config | CricketConfig;
    isSyndicate: boolean;
    roundRobinConfig?: { podSize: number; gamesPerPlayer: number };
  }>({
    name: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: 'single-elimination',
    seasonId: '',
    venueId: '',
    gameType: 'X01',
    gameConfig: {
      startScore: 301,
      sets: 1,
      legs: 2,
      inRule: 'single',
      outRule: 'double'
    } as X01Config,
    isSyndicate: false
  });

  useEffect(() => {
    const q = query(collection(db, 'seasons'), orderBy('startDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setSeasons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
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
    if (!newTournament.name) return;

    const tournamentData: Partial<Tournament> = {
      ...newTournament,
      status: 'upcoming',
      participants: []
    };

    if (!tournamentData.seasonId) {
      delete tournamentData.seasonId;
    }

    await addDoc(collection(db, 'tournaments'), tournamentData);
    setNewTournament({
      name: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      type: 'single-elimination',
      seasonId: newTournament.seasonId,
      venueId: '',
      gameType: 'X01',
      gameConfig: {
        startScore: 301,
        sets: 1,
        legs: 2,
        inRule: 'single',
        outRule: 'double'
      },
      isSyndicate: false
    });
  };

  const deleteTournament = async (id: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      await deleteDoc(doc(db, 'tournaments', id));
    }
  };

  const updateTournament = async () => {
    if (!editingTournament) return;
    await updateDoc(doc(db, 'tournaments', editingTournament.id), {
      name: editingTournament.name,
      date: editingTournament.date,
      venueId: editingTournament.venueId || '',
      type: editingTournament.type,
      seasonId: editingTournament.seasonId,
      gameType: editingTournament.gameType,
      gameConfig: editingTournament.gameConfig,
      isSyndicate: editingTournament.isSyndicate,
      status: editingTournament.status
    });
    setEditingTournament(null);
  };

  const createVenue = async () => {
    if (!newVenue.name || !newVenue.address) return;
    await addDoc(collection(db, 'venues'), newVenue);
    setNewVenue({ name: '', address: '', boards: 4, isSyndicatePartner: false });
  };

  const updateVenue = async () => {
    if (!editingVenue) return;
    await updateDoc(doc(db, 'venues', editingVenue.id), {
      name: editingVenue.name,
      address: editingVenue.address,
      boards: editingVenue.boards,
      isSyndicatePartner: editingVenue.isSyndicatePartner
    });
    setEditingVenue(null);
  };

  const deleteVenue = async (id: string) => {
    await deleteDoc(doc(db, 'venues', id));
  };

  const updatePlayerRole = async (uid: string, newRole: 'admin' | 'coordinator' | 'player') => {
    await updateDoc(doc(db, 'players', uid), { role: newRole });
  };

  const createPlayer = async () => {
    if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.email) return;
    
    const displayName = `${newPlayer.firstName} ${newPlayer.lastName.charAt(0).toUpperCase()}.`;
    
    const newDocRef = doc(collection(db, 'players'));
    await setDoc(newDocRef, {
      uid: newDocRef.id,
      firstName: newPlayer.firstName,
      lastName: newPlayer.lastName,
      email: newPlayer.email,
      name: displayName,
      role: 'player',
      isPlaceholder: true,
      stats: { wins: 0, losses: 0, avgScore: 0 }
    });
    
    setNewPlayer({ firstName: '', lastName: '', email: '' });
  };

  const updatePlayerDetails = async () => {
    if (!editingPlayer) return;
    const first = editingPlayer.firstName || '';
    const last = editingPlayer.lastName || '';
    await updateDoc(doc(db, 'players', editingPlayer.uid), {
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim()
    });
    setEditingPlayer(null);
  };

  const deletePlayer = async (uid: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      await deleteDoc(doc(db, 'players', uid));
    }
  };

  const toggleVested = async (uid: string, currentVested: boolean) => {
    await updateDoc(doc(db, 'players', uid), { isVested: !currentVested });
  };

  const toggleParticipant = async (tournamentId: string, playerUid: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const participants = tournament.participants || [];
    const newParticipants = participants.includes(playerUid)
      ? participants.filter(id => id !== playerUid)
      : [...participants, playerUid];

    await updateDoc(doc(db, 'tournaments', tournamentId), {
      participants: newParticipants
    });
  };

  const handleGenerateBracket = async (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament || !tournament.participants || tournament.participants.length < 2) return;

    let allMatches: Match[] = [];
    if (tournament.seasonId) {
      // Fetch all matches that are completed for this season
      // We don't query by seasonId directly on matches because they don't have it,
      // instead getSeededParticipants filters matches by the season's tournament IDs.
      const matchesSnapshot = await getDocs(query(collection(db, 'matches'), where('status', '==', 'completed')));
      allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    }

    const seededParticipants = getSeededParticipants(
      tournament.participants,
      tournament,
      tournaments,
      allMatches
    );

    // Generate matches using the utility
    const newMatches = generateBracket(
      tournament.participants,
      tournamentId,
      tournament.gameType,
      tournament.gameConfig,
      seededParticipants,
      tournament.type,
      tournament.roundRobinConfig
    );

    // Delete existing matches for this tournament
    const matchesRef = collection(db, 'matches');
    const existingMatchesQ = query(matchesRef, where('tournamentId', '==', tournamentId));
    const existingMatchesSnapshot = await getDocs(existingMatchesQ);

    // Chunking logic for batch writes (limit is 500 per batch)
    const BATCH_LIMIT = 500;
    const allOps: Array<{type: 'delete' | 'set' | 'update', ref: DocumentReference, data?: Partial<Match> | { status: string } }> = [];

    // Add delete operations
    for (const mDoc of existingMatchesSnapshot.docs) {
      allOps.push({ type: 'delete', ref: doc(db, 'matches', mDoc.id) });
    }

    // Add set operations for new matches
    for (const match of newMatches) {
      const newDocRef = doc(collection(db, 'matches'));
      const sanitizedMatch = JSON.parse(JSON.stringify(match));
      allOps.push({ type: 'set', ref: newDocRef, data: sanitizedMatch });
    }

    // Update tournament status
    allOps.push({ type: 'update', ref: doc(db, 'tournaments', tournamentId), data: { status: 'live' } });

    // Execute chunks
    try {
      for (let i = 0; i < allOps.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = allOps.slice(i, i + BATCH_LIMIT);

        for (const op of chunk) {
          if (op.type === 'delete') batch.delete(op.ref);
          else if (op.type === 'set' && op.data) batch.set(op.ref, op.data);
          else if (op.type === 'update' && op.data) batch.update(op.ref, op.data);
        }

        await batch.commit();
      }
    } catch (error) {
      console.error("Error generating bracket:", error);
      alert("Failed to generate bracket. Check console for details.");
    }
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

  const handleEditGameTypeChange = (type: GameType) => {
    if (!editingTournament) return;
    if (type === 'X01') {
      setEditingTournament({ 
        ...editingTournament, 
        gameType: 'X01', 
        gameConfig: { startScore: 301, sets: 1, legs: 2, inRule: 'single', outRule: 'double' } 
      });
    } else {
      setEditingTournament({ 
        ...editingTournament, 
        gameType: 'Cricket', 
        gameConfig: { mode: 'Standard', random: false } 
      });
    }
  };

  if (editingTournament) {
    return (
      <AdminTournamentEditor
        tournamentId={editingTournament.id}
        onBack={() => setEditingTournament(null)}
        tournaments={tournaments}
        seasons={seasons}
        venues={venues}
        players={players}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className={clsx(
          "text-4xl font-bold mb-2 tracking-tight",
          isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
        )}>
          Admin Dashboard
        </h1>
        <p className={clsx(
          "text-lg",
          isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
        )}>
          Manage seasons, tournaments, and player permissions.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Season Management */}
        {isAdmin && (
          <section className={clsx(
            "p-8 rounded-3xl border shadow-sm",
            isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className={clsx(
                "p-2 rounded-xl",
                isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
              )}>
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className={clsx(
                "text-xl font-bold",
                isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
              )}>
                Seasons
              </h2>
            </div>
            
            <div className="flex gap-3 mb-8">
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Season Name (e.g. Spring 2024)"
                className={clsx(
                  "flex-1 px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate 
                    ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red" 
                    : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              />
              <button
                onClick={createSeason}
                className={clsx(
                  "p-3 rounded-xl transition-colors shadow-lg",
                  isSyndicate 
                    ? "bg-syndicate-red text-white hover:bg-red-700 shadow-red-900/20" 
                    : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                )}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {seasons.map(season => (
                <div key={season.id} className={clsx(
                  "flex items-center justify-between p-4 rounded-2xl border",
                  isSyndicate 
                    ? "bg-black/20 border-syndicate-red/10" 
                    : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                )}>
                  <div>
                    <p className={clsx(
                      "font-bold",
                      isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
                    )}>{season.name}</p>
                    <p className={clsx(
                      "text-xs",
                      isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                    )}>Started {format(new Date(season.startDate), 'MMM d, yyyy')}</p>
                  </div>
                  <button
                    onClick={() => toggleSeason(season.id, season.active)}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                      season.active 
                        ? (isSyndicate ? "bg-syndicate-red/20 text-syndicate-red border-syndicate-red/30" : isDark ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200")
                        : (isSyndicate ? "bg-black/40 text-nasty-cream/40 border-syndicate-red/10" : isDark ? "bg-slate-700 text-slate-400 border border-slate-600" : "bg-slate-200 text-slate-600 border border-slate-300")
                    )}
                  >
                    {season.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tournament Creation */}
        <section className={clsx(
          "p-8 rounded-3xl border shadow-sm",
          isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-8">
            <div className={clsx(
              "p-2 rounded-xl",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-600"
            )}>
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className={clsx(
              "text-xl font-bold",
              isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
            )}>
              New Tournament
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className={clsx(
                "block text-sm font-bold mb-2",
                isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
              )}>Tournament Name</label>
              <input
                type="text"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none",
                  isSyndicate 
                    ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red" 
                    : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
                placeholder="e.g. Friday Night Open"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={clsx(
                  "block text-sm font-bold mb-2",
                  isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                )}>Date & Time</label>
                <input
                  type="datetime-local"
                  value={newTournament.date}
                  onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none",
                    isSyndicate 
                      ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red" 
                      : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                />
              </div>
              <div>
                <label className={clsx(
                  "block text-sm font-bold mb-2",
                  isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                )}>Season</label>
                <select
                  value={newTournament.seasonId}
                  onChange={(e) => setNewTournament({ ...newTournament, seasonId: e.target.value })}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none",
                    isSyndicate 
                      ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red" 
                      : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                >
                  <option value="">None (One-Off Event)</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={clsx(
                  "block text-sm font-bold mb-2",
                  isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                )}>Tournament Type</label>
                <select
                  value={newTournament.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'single-elimination' | 'double-elimination' | 'round-robin';
                    setNewTournament({
                      ...newTournament,
                      type: newType,
                      ...(newType === 'round-robin' && !newTournament.roundRobinConfig ? {
                        roundRobinConfig: { podSize: 4, gamesPerPlayer: 3 }
                      } : {})
                    });
                  }}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none",
                    isSyndicate
                      ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red"
                      : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                >
                  <option value="single-elimination">Single Elimination</option>
                  <option value="double-elimination">Double Elimination</option>
                  <option value="round-robin">Round Robin</option>
                </select>
              </div>
              <div>
                <label className={clsx(
                  "block text-sm font-bold mb-2",
                  isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                )}>Venue</label>
                <select
                  value={newTournament.venueId}
                  onChange={(e) => setNewTournament({ ...newTournament, venueId: e.target.value })}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none",
                    isSyndicate
                      ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red"
                      : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                >
                  <option value="">Select Venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {newTournament.type === 'round-robin' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={clsx(
                    "block text-sm font-bold mb-2",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                  )}>Pod Size</label>
                  <input
                    type="number"
                    min="2"
                    value={newTournament.roundRobinConfig?.podSize || 4}
                    onChange={(e) => {
                      const size = parseInt(e.target.value) || 2;
                      setNewTournament({
                        ...newTournament,
                        roundRobinConfig: {
                          podSize: size,
                          gamesPerPlayer: Math.max(1, size - 1)
                        }
                      });
                    }}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate
                        ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red"
                        : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>
                <div>
                  <label className={clsx(
                    "block text-sm font-bold mb-2",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                  )}>Games Per Player</label>
                  <input
                    type="number"
                    min="1"
                    value={newTournament.roundRobinConfig?.gamesPerPlayer || 3}
                    onChange={(e) => setNewTournament({
                      ...newTournament,
                      roundRobinConfig: {
                        podSize: newTournament.roundRobinConfig?.podSize || 4,
                        gamesPerPlayer: parseInt(e.target.value) || 1
                      }
                    })}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate
                        ? "bg-black/40 border-syndicate-red/30 text-nasty-cream focus:border-syndicate-red"
                        : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>
              </div>
            )}

            <div className={clsx(
              "pt-4 border-t",
              isSyndicate ? "border-syndicate-red/10" : isDark ? "border-slate-800" : "border-slate-100"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-slate-400" />
                  <h3 className={clsx(
                    "text-sm font-bold uppercase tracking-wider",
                    isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
                  )}>Game Rules</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <Skull className={clsx(
                    "w-4 h-4",
                    newTournament.isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400"
                  )} />
                  <label className={clsx(
                    "text-xs font-bold uppercase tracking-wider",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
                  )}>Syndicate Mode</label>
                  <button
                    onClick={() => setNewTournament({ ...newTournament, isSyndicate: !newTournament.isSyndicate })}
                    className={clsx(
                      "w-10 h-5 rounded-full transition-all relative",
                      newTournament.isSyndicate ? "bg-syndicate-red" : isDark ? "bg-slate-700" : "bg-slate-300"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                      newTournament.isSyndicate ? "right-0.5" : "left-0.5"
                    )} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => handleGameTypeChange('X01')}
                  className={clsx(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    newTournament.gameType === 'X01' 
                      ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-syndicate-red" : isDark ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-700")
                      : (isSyndicate ? "bg-black/40 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                  )}
                >
                  X01
                </button>
                <button
                  onClick={() => handleGameTypeChange('Cricket')}
                  className={clsx(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    newTournament.gameType === 'Cricket' 
                      ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-syndicate-red" : isDark ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-700")
                      : (isSyndicate ? "bg-black/40 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                  )}
                >
                  Cricket
                </button>
              </div>

              {newTournament.gameType === 'X01' && (
                <div className={clsx(
                  "space-y-4 p-4 rounded-2xl border",
                  isSyndicate ? "bg-black/20 border-syndicate-red/10" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={clsx(
                        "block text-xs font-bold mb-1 uppercase",
                        isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                      )}>Start Score</label>
                      <select
                        value={(newTournament.gameConfig as X01Config).startScore}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), startScore: parseInt(e.target.value) as 301 | 501 | 701 }
                        })}
                        className={clsx(
                          "w-full px-3 py-2 rounded-lg border text-sm",
                          isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-900 border-slate-700 text-slate-50" : "bg-white border-slate-200"
                        )}
                      >
                        <option value={301}>301</option>
                        <option value={501}>501</option>
                        <option value={701}>701</option>
                      </select>
                    </div>
                    <div>
                      <label className={clsx(
                        "block text-xs font-bold mb-1 uppercase",
                        isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                      )}>Sets</label>
                      <input
                        type="number"
                        min="1"
                        value={(newTournament.gameConfig as X01Config).sets}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), sets: parseInt(e.target.value) }
                        })}
                        className={clsx(
                          "w-full px-3 py-2 rounded-lg border text-sm",
                          isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-900 border-slate-700 text-slate-50" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={clsx(
                        "block text-xs font-bold mb-1 uppercase",
                        isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                      )}>Legs per Set</label>
                      <input
                        type="number"
                        min="1"
                        value={(newTournament.gameConfig as X01Config).legs}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), legs: parseInt(e.target.value) }
                        })}
                        className={clsx(
                          "w-full px-3 py-2 rounded-lg border text-sm",
                          isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-900 border-slate-700 text-slate-50" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div>
                      <label className={clsx(
                        "block text-xs font-bold mb-1 uppercase",
                        isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                      )}>Out Rule</label>
                      <select
                        value={(newTournament.gameConfig as X01Config).outRule}
                        onChange={(e) => setNewTournament({
                          ...newTournament,
                          gameConfig: { ...(newTournament.gameConfig as X01Config), outRule: e.target.value as 'single' | 'double' | 'triple' }
                        })}
                        className={clsx(
                          "w-full px-3 py-2 rounded-lg border text-sm",
                          isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-900 border-slate-700 text-slate-50" : "bg-white border-slate-200"
                        )}
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
                <div className={clsx(
                  "space-y-4 p-4 rounded-2xl border",
                  isSyndicate ? "bg-black/20 border-syndicate-red/10" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex items-center justify-between">
                    <label className={clsx(
                      "text-sm font-bold",
                      isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                    )}>Scoring Mode</label>
                    <select
                      value={(newTournament.gameConfig as CricketConfig).mode}
                      onChange={(e) => setNewTournament({
                        ...newTournament,
                        gameConfig: { ...(newTournament.gameConfig as CricketConfig), mode: e.target.value as 'Standard' | 'Cut Throat' }
                      })}
                      className={clsx(
                        "px-3 py-2 rounded-lg border text-sm",
                        isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-900 border-slate-700 text-slate-50" : "bg-white border-slate-200"
                      )}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Cut Throat">Cut Throat</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className={clsx(
                      "text-sm font-bold",
                      isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700"
                    )}>Random Numbers</label>
                    <button
                      onClick={() => setNewTournament({
                        ...newTournament,
                        gameConfig: { ...(newTournament.gameConfig as CricketConfig), random: !(newTournament.gameConfig as CricketConfig).random }
                      })}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-all relative",
                        (newTournament.gameConfig as CricketConfig).random ? (isSyndicate ? "bg-syndicate-red" : "bg-indigo-600") : isDark ? "bg-slate-700" : "bg-slate-300"
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
              disabled={!newTournament.name}
              className={clsx(
                "w-full py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4",
                isSyndicate 
                  ? "bg-syndicate-red text-white hover:bg-red-700 shadow-red-900/20" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              Create Tournament
            </button>
          </div>
        </section>

        {/* Tournament Management */}
        <section className={clsx(
          "p-8 rounded-3xl border shadow-sm",
          isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-8">
            <div className={clsx(
              "p-2 rounded-xl",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
            )}>
              <Settings2 className="w-6 h-6" />
            </div>
            <h2 className={clsx(
              "text-xl font-bold",
              isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
            )}>
              Manage Tournaments
            </h2>
          </div>

          <div className="space-y-4">
            {tournaments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
              <div key={t.id} className={clsx(
                "flex items-center justify-between p-4 rounded-2xl border",
                isSyndicate ? "bg-black/20 border-syndicate-red/10" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "p-2 rounded-lg",
                    t.status === 'live' ? "bg-emerald-500/20 text-emerald-500" :
                    t.status === 'completed' ? "bg-amber-500/20 text-amber-500" :
                    "bg-slate-500/20 text-slate-500"
                  )}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={clsx(
                      "font-bold",
                      isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
                    )}>{t.name}</p>
                    <p className={clsx(
                      "text-xs",
                      isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {format(new Date(t.date), 'MMM d, yyyy • HH:mm')} • {t.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTournament(t)}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      isSyndicate ? "text-nasty-cream/60 hover:text-nasty-cream hover:bg-syndicate-red/10" : isDark ? "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteTournament(t.id)}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      isSyndicate ? "text-nasty-cream/60 hover:text-syndicate-red hover:bg-syndicate-red/10" : isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                    )}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>


      </div>

      {/* Venue Management */}
      <section className={clsx(
        "p-8 rounded-3xl border shadow-sm",
        isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3 mb-8">
          <div className={clsx(
            "p-2 rounded-xl",
            isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
          )}>
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className={clsx(
            "text-xl font-bold",
            isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
          )}>
            Venue Management
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className={clsx("block text-sm font-bold mb-2", isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700")}>Venue Name</label>
              <input
                type="text"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500")}
                placeholder="e.g. The Bullseye Pub"
              />
            </div>
            <div>
              <label className={clsx("block text-sm font-bold mb-2", isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700")}>Address</label>
              <input
                type="text"
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500")}
                placeholder="123 Dart St, Phoenix, AZ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={clsx("block text-sm font-bold mb-2", isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700")}>Number of Boards</label>
                <input
                  type="number"
                  value={newVenue.boards}
                  onChange={(e) => setNewVenue({ ...newVenue, boards: parseInt(e.target.value) })}
                  className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500")}
                />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVenue.isSyndicatePartner}
                    onChange={(e) => setNewVenue({ ...newVenue, isSyndicatePartner: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={clsx("text-sm font-bold", isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700")}>Syndicate Partner</span>
                </label>
              </div>
            </div>
            <button
              onClick={createVenue}
              className={clsx(
                "w-full py-4 rounded-2xl font-bold transition-all shadow-lg",
                isSyndicate ? "bg-syndicate-red text-white hover:bg-red-700" : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              Add Venue
            </button>
          </div>

          <div className="space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className={clsx(
                "flex items-center justify-between p-4 rounded-2xl border",
                isSyndicate ? "bg-black/20 border-syndicate-red/10" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div>
                  <p className={clsx("font-bold", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900")}>{venue.name}</p>
                  <p className={clsx("text-xs", isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500")}>{venue.address} • {venue.boards} Boards</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingVenue(venue)}
                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteVenue(venue.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Player Management */}
        <section className={clsx(
          "p-8 rounded-3xl border shadow-sm",
          isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-8">
            <div className={clsx(
              "p-2 rounded-xl",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <Users className="w-6 h-6" />
            </div>
            <h2 className={clsx(
              "text-xl font-bold",
              isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
            )}>
              Add New Player
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              value={newPlayer.firstName}
              onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
              placeholder="First Name"
              className={clsx(
                      "px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
              )}
            />
            <input
              type="text"
              value={newPlayer.lastName}
              onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
              placeholder="Last Name"
              className={clsx(
                      "px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
              )}
            />
            <div className="flex gap-2">
              <input
                type="email"
                value={newPlayer.email}
                onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                placeholder="Email Address"
                className={clsx(
                      "flex-1 px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              />
              <button
                onClick={createPlayer}
                className={clsx(
                  "p-3 rounded-xl text-white",
                  isSyndicate ? "bg-syndicate-red" : isDark ? "bg-blue-500" : "bg-blue-600"
                )}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <h3 className={clsx(
              "text-lg font-bold",
              isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
            )}>
              Tournament Participants
            </h3>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className={clsx(
                      "px-3 py-2 rounded-lg border text-sm",
                      isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200"
              )}
            >
              <option value="">Select Tournament to Manage</option>
              {tournaments.filter(t => t.status === 'upcoming').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={clsx(
                "border-b",
                isSyndicate ? "border-syndicate-red/10" : isDark ? "border-slate-800" : "border-slate-100"
              )}>
                <th className={clsx(
                  "pb-4 font-bold text-sm uppercase tracking-wider",
                  isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                )}>Player</th>
                <th className={clsx(
                  "pb-4 font-bold text-sm uppercase tracking-wider",
                  isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                )}>Email</th>
                <th className={clsx(
                  "pb-4 font-bold text-sm uppercase tracking-wider",
                  isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                )}>Role</th>
                <th className={clsx(
                  "pb-4 font-bold text-sm uppercase tracking-wider",
                  isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                )}>Vested</th>
                {selectedTournamentId && (
                  <th className={clsx(
                    "pb-4 font-bold text-sm uppercase tracking-wider",
                    isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                  )}>In Tournament</th>
                )}
                <th className={clsx(
                  "pb-4 font-bold text-sm uppercase tracking-wider text-right",
                  isSyndicate ? "text-nasty-cream/40" : isDark ? "text-slate-400" : "text-slate-500"
                )}>Actions</th>
              </tr>
            </thead>
            <tbody className={clsx(
              "divide-y",
              isSyndicate ? "divide-syndicate-red/10" : isDark ? "divide-slate-800" : "divide-slate-100"
            )}>
              {players.map(p => (
                <tr key={p.uid}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.photoURL || `https://ui-avatars.com/api/?name=${p.name}`} 
                        className={clsx(
                          "w-8 h-8 rounded-lg object-cover border",
                          isSyndicate ? (p.isVested ? "border-syndicate-red" : "border-syndicate-red/20") : "border-slate-200"
                        )}
                        referrerPolicy="no-referrer"
                      />
                      <span className={clsx(
                        "font-bold",
                        isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
                      )}>{p.name}</span>
                    </div>
                  </td>
                  <td className={clsx(
                    "py-4 text-sm",
                    isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-500"
                  )}>{p.email}</td>
                  <td className="py-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      p.role === 'admin' 
                        ? (isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : "bg-purple-100 text-purple-700") 
                        : p.role === 'coordinator'
                          ? (isSyndicate ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700")
                          : (isSyndicate ? "bg-black/40 text-nasty-cream/40" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600")
                    )}>
                      {p.role}
                    </span>
                  </td>
                  <td className="py-4">
                    {isAdmin && (
                      <button
                        onClick={() => toggleVested(p.uid, p.isVested || false)}
                        className={clsx(
                          "p-2 rounded-lg transition-all",
                          p.isVested 
                            ? "text-syndicate-red bg-syndicate-red/10" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <Shield className={clsx("w-5 h-5", p.isVested ? "fill-current" : "")} />
                      </button>
                    )}
                  </td>
                  {selectedTournamentId && (
                    <td className="py-4">
                      <button
                        onClick={() => toggleParticipant(selectedTournamentId, p.uid)}
                        className={clsx(
                          "p-2 rounded-lg transition-all",
                          tournaments.find(t => t.id === selectedTournamentId)?.participants?.includes(p.uid)
                            ? "text-emerald-500 bg-emerald-500/10" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <CheckCircle2 className={clsx("w-5 h-5", tournaments.find(t => t.id === selectedTournamentId)?.participants?.includes(p.uid) ? "fill-current" : "")} />
                      </button>
                    </td>
                  )}
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <select
                            value={p.role}
                            onChange={(e) => updatePlayerRole(p.uid, e.target.value as 'admin' | 'coordinator' | 'player')}
                            className={clsx(
                              "text-sm border rounded-lg px-2 py-1 outline-none",
                              isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                            )}
                          >
                            <option value="player">Player</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => {
                              const { first, last } = getFirstLast(p);
                              setEditingPlayer({
                                ...p,
                                firstName: p.firstName || first,
                                lastName: p.lastName || last,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePlayer(p.uid)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Tournament Modal */}
      {/* Venue Editing Modal */}
      {editingVenue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
              "w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden",
              isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className={clsx(
                  "text-2xl font-bold",
                  isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
                )}>Edit Venue</h2>
                <button onClick={() => setEditingVenue(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 opacity-60">Venue Name</label>
                  <input
                    type="text"
                    value={editingVenue.name}
                    onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 opacity-60">Address</label>
                  <input
                    type="text"
                    value={editingVenue.address}
                    onChange={(e) => setEditingVenue({ ...editingVenue, address: e.target.value })}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 opacity-60">Boards</label>
                    <input
                      type="number"
                      value={editingVenue.boards}
                      onChange={(e) => setEditingVenue({ ...editingVenue, boards: parseInt(e.target.value) })}
                      className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                      )}
                    />
                  </div>
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingVenue.isSyndicatePartner}
                        onChange={(e) => setEditingVenue({ ...editingVenue, isSyndicatePartner: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={clsx("text-sm font-bold", isSyndicate ? "text-nasty-cream/60" : isDark ? "text-slate-400" : "text-slate-700")}>Syndicate Partner</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setEditingVenue(null)}
                    className={clsx(
                      "flex-1 py-4 rounded-2xl font-bold transition-all",
                      isSyndicate ? "bg-black/40 text-nasty-cream hover:bg-black/60" : isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateVenue}
                    className={clsx(
                      "flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg",
                      isSyndicate ? "bg-syndicate-red text-white hover:bg-red-700" : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    )}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
              "w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden",
              isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className={clsx(
                  "text-2xl font-bold",
                  isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
                )}>Edit Player Name</h2>
                <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 opacity-60">First Name</label>
                  <input
                    type="text"
                    value={editingPlayer.firstName || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, firstName: e.target.value })}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 opacity-60">Last Name</label>
                  <input
                    type="text"
                    value={editingPlayer.lastName || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, lastName: e.target.value })}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border outline-none",
                      isSyndicate ? "bg-black/40 border-syndicate-red/30 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setEditingPlayer(null)}
                    className={clsx(
                      "flex-1 py-4 rounded-2xl font-bold transition-all",
                      isSyndicate ? "bg-black/40 text-nasty-cream hover:bg-black/60" : isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updatePlayerDetails}
                    className={clsx(
                      "flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg",
                      isSyndicate ? "bg-syndicate-red text-white hover:bg-red-700" : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    )}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
function clsx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
