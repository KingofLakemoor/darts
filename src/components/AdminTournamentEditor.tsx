import React, { useState, useEffect } from 'react';
import { Tournament, Season, Venue, Player, Match, GameType, X01Config, CricketConfig } from '../types';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronLeft, Save, Trophy, Users, Layout, Settings2, CheckSquare, Square, Skull } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';
import { BracketView } from './BracketView';
import { generateBracket } from '../utils/bracket';
import { getSeededParticipants } from '../utils/seeding';
import { format } from 'date-fns';

interface Props {
  tournamentId: string;
  onBack: () => void;
  tournaments: Tournament[];
  seasons: Season[];
  venues: Venue[];
  players: Player[];
}

export function AdminTournamentEditor({ tournamentId, onBack, tournaments, seasons, venues, players }: Props) {
  const { isSyndicate, isDark } = useTheme();
  const liveTournament = tournaments.find(t => t.id === tournamentId);
  const [formData, setFormData] = useState<Tournament | null>(liveTournament || null);

  useEffect(() => {
    if (liveTournament && !formData) {
      setFormData(liveTournament);
    }
  }, [liveTournament, formData]);

  if (!liveTournament || !formData) {
    return <div className="p-8 text-center">Tournament not found</div>;
  }

  const handleSave = async () => {
    await updateDoc(doc(db, 'tournaments', liveTournament.id), {
      name: formData.name,
      date: formData.date,
      venueId: formData.venueId || '',
      type: formData.type,
      seasonId: formData.seasonId,
      gameType: formData.gameType,
      gameConfig: formData.gameConfig,
      isSyndicate: formData.isSyndicate,
      status: formData.status,
      roundRobinConfig: formData.roundRobinConfig || null
    });
  };

  const toggleParticipant = async (playerUid: string) => {
    const participants = liveTournament.participants || [];
    const newParticipants = participants.includes(playerUid)
      ? participants.filter(id => id !== playerUid)
      : [...participants, playerUid];

    await updateDoc(doc(db, 'tournaments', liveTournament.id), {
      participants: newParticipants
    });
  };

  const handleGenerateBracket = async () => {
    if (!liveTournament.participants || liveTournament.participants.length < 2) return;

    let allMatches: Match[] = [];
    if (liveTournament.seasonId) {
      const matchesSnapshot = await getDocs(query(collection(db, 'matches'), where('status', '==', 'completed')));
      allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    }

    const seededParticipants = getSeededParticipants(
      liveTournament.participants,
      liveTournament,
      tournaments,
      allMatches
    );

    const newMatches = generateBracket(
      liveTournament.participants,
      liveTournament.id,
      liveTournament.gameType,
      liveTournament.gameConfig,
      seededParticipants,
      liveTournament.type,
      liveTournament.roundRobinConfig
    );

    const matchesRef = collection(db, 'matches');
    const existingMatchesQ = query(matchesRef, where('tournamentId', '==', liveTournament.id));
    const existingMatchesSnapshot = await getDocs(existingMatchesQ);

    const BATCH_LIMIT = 500;
    const allOps: any[] = [];

    for (const mDoc of existingMatchesSnapshot.docs) {
      allOps.push({ type: 'delete', ref: doc(db, 'matches', mDoc.id) });
    }

    for (const match of newMatches) {
      const newDocRef = doc(collection(db, 'matches'));
      allOps.push({ type: 'set', ref: newDocRef, data: match });
    }

    allOps.push({ type: 'update', ref: doc(db, 'tournaments', liveTournament.id), data: { status: 'live' } });

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
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'X01') {
      setFormData({
        ...formData,
        gameType: 'X01',
        gameConfig: { startScore: 301, sets: 1, legs: 2, inRule: 'single', outRule: 'double' }
      });
    } else {
      setFormData({
        ...formData,
        gameType: 'Cricket',
        gameConfig: { mode: 'Standard', random: false }
      });
    }
  };

  const isFormChanged = JSON.stringify(formData) !== JSON.stringify(liveTournament);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={clsx(
              "p-2 rounded-xl transition-colors",
              isSyndicate ? "bg-onyx text-nasty-cream hover:bg-onyx/80" : isDark ? "bg-slate-800 text-slate-50 hover:bg-slate-700" : "bg-white text-slate-900 hover:bg-slate-50 shadow-sm"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className={clsx(
            "text-3xl font-bold tracking-tight",
            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
          )}>
            Edit Tournament
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!isFormChanged}
          className={clsx(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
            isSyndicate ? "bg-syndicate-red text-nasty-cream" : isDark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </header>

      {/* Configuration Section */}
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
            Tournament Settings
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Tournament Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Date & Time</label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Season</label>
              <select
                value={formData.seasonId || ''}
                onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="">None (One-Off Event)</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Venue</label>
              <select
                value={formData.venueId}
                onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="">Select Venue</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Tournament Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'single-elimination' | 'double-elimination' | 'round-robin';
                  setFormData({
                    ...formData,
                    type: newType,
                    ...(newType === 'round-robin' && !formData.roundRobinConfig ? {
                      roundRobinConfig: { podSize: 4, gamesPerPlayer: 3 }
                    } : {})
                  });
                }}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="single-elimination">Single Elimination</option>
                <option value="double-elimination">Double Elimination</option>
                <option value="round-robin">Round Robin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 opacity-60">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'upcoming' | 'live' | 'completed' })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                  isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {formData.type === 'round-robin' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-60">Pod Size</label>
                <input
                  type="number"
                  min="2"
                  value={formData.roundRobinConfig?.podSize || 4}
                  onChange={(e) => {
                    const size = parseInt(e.target.value) || 2;
                    setFormData({
                      ...formData,
                      roundRobinConfig: {
                        podSize: size,
                        gamesPerPlayer: Math.max(1, size - 1)
                      }
                    });
                  }}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                    isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-60">Games Per Player</label>
                <input
                  type="number"
                  min="1"
                  value={formData.roundRobinConfig?.gamesPerPlayer || 3}
                  onChange={(e) => setFormData({
                    ...formData,
                    roundRobinConfig: {
                      podSize: formData.roundRobinConfig?.podSize || 4,
                      gamesPerPlayer: parseInt(e.target.value) || 1
                    }
                  })}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                    isSyndicate ? "bg-black/40 border-syndicate-red/20 focus:border-syndicate-red text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-50" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  )}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-4 opacity-60">Game Type</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleGameTypeChange('X01')}
                className={clsx(
                  "py-3 rounded-xl border font-bold transition-all",
                  formData.gameType === 'X01'
                    ? (isSyndicate ? "bg-syndicate-red border-syndicate-red text-white" : isDark ? "bg-indigo-500 border-indigo-500 text-white" : "bg-indigo-600 border-indigo-600 text-white")
                    : (isSyndicate ? "bg-black/20 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-400")
                )}
              >
                X01
              </button>
              <button
                onClick={() => handleGameTypeChange('Cricket')}
                className={clsx(
                  "py-3 rounded-xl border font-bold transition-all",
                  formData.gameType === 'Cricket'
                    ? (isSyndicate ? "bg-syndicate-red border-syndicate-red text-white" : isDark ? "bg-indigo-500 border-indigo-500 text-white" : "bg-indigo-600 border-indigo-600 text-white")
                    : (isSyndicate ? "bg-black/20 border-syndicate-red/10 text-nasty-cream/40" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-400")
                )}
              >
                Cricket
              </button>
            </div>

            <div className={clsx(
              "p-6 rounded-2xl border",
              isSyndicate ? "bg-black/20 border-syndicate-red/10" : isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
            )}>
              {formData.gameType === 'X01' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold mb-2 opacity-60">Start Score</label>
                    <select
                      value={(formData.gameConfig as X01Config).startScore}
                      onChange={(e) => setFormData({
                        ...formData,
                        gameConfig: { ...formData.gameConfig as X01Config, startScore: parseInt(e.target.value) as 301 | 501 | 701 }
                      })}
                      className={clsx(
                        "w-full px-3 py-2 rounded-lg border text-sm",
                        isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200"
                      )}
                    >
                      <option value="301">301</option>
                      <option value="501">501</option>
                      <option value="701">701</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 opacity-60">Out Rule</label>
                    <select
                      value={(formData.gameConfig as X01Config).outRule}
                      onChange={(e) => setFormData({
                        ...formData,
                        gameConfig: { ...(formData.gameConfig as X01Config), outRule: e.target.value as 'single' | 'double' | 'triple' }
                      })}
                      className={clsx(
                        "w-full px-3 py-2 rounded-lg border text-sm",
                        isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200"
                      )}
                    >
                      <option value="single">Single Out</option>
                      <option value="double">Double Out</option>
                      <option value="triple">Triple Out</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold opacity-60">Mode</label>
                    <select
                      value={(formData.gameConfig as CricketConfig).mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        gameConfig: { ...(formData.gameConfig as CricketConfig), mode: e.target.value as 'Standard' | 'Cut Throat' }
                      })}
                      className={clsx(
                        "px-3 py-2 rounded-lg border text-sm",
                        isSyndicate ? "bg-black/40 border-syndicate-red/20 text-nasty-cream" : isDark ? "bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500" : "bg-white border-slate-200"
                      )}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Cut Throat">Cut Throat</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Participants Management */}
      <section className={clsx(
        "p-8 rounded-3xl border shadow-sm",
        isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
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
              Manage Participants
            </h2>
          </div>
          <span className={clsx(
            "text-sm font-bold",
            isSyndicate ? "text-syndicate-red" : "text-indigo-500"
          )}>
            {liveTournament.participants.length} Selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
          {players.map(p => {
            const isSelected = liveTournament.participants.includes(p.uid);
            return (
              <button
                key={p.uid}
                onClick={() => toggleParticipant(p.uid)}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  isSelected
                    ? (isSyndicate ? "bg-syndicate-red/20 border-syndicate-red text-nasty-cream" : isDark ? "bg-indigo-500/20 border-indigo-500 text-slate-50" : "bg-indigo-50 border-indigo-500 text-slate-900")
                    : (isSyndicate ? "bg-black/20 border-syndicate-red/10 text-steel-gray" : isDark ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600")
                )}
              >
                <div className={clsx(
                  "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border",
                  isSelected
                    ? (isSyndicate ? "bg-syndicate-red border-syndicate-red text-nasty-cream" : "bg-indigo-500 border-indigo-500 text-white")
                    : (isSyndicate ? "border-syndicate-red/30" : isDark ? "border-slate-600" : "border-slate-300")
                )}>
                  {isSelected && <CheckSquare className="w-4 h-4" />}
                </div>
                <img
                  src={p.photoURL || `https://ui-avatars.com/api/?name=${p.name}`}
                  className={clsx(
                    "w-8 h-8 rounded-lg object-cover",
                    isSyndicate && p.isVested && "stitched-red ring-1 ring-syndicate-red/30"
                  )}
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bracket Generation & Display */}
      <section className={clsx(
        "p-8 rounded-3xl border shadow-sm",
        isSyndicate ? "bg-onyx border-syndicate-red/30 leather-bg" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "p-2 rounded-xl",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
            )}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className={clsx(
                "text-xl font-bold",
                isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"
              )}>
                Tournament Bracket
              </h2>
              {liveTournament.status === 'upcoming' && (
                <p className={clsx("text-sm mt-1", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500")}>
                  Generate matches and start the tournament.
                </p>
              )}
            </div>
          </div>

          {liveTournament.status === 'upcoming' ? (
            <button
              onClick={handleGenerateBracket}
              disabled={liveTournament.participants.length < 2}
              className={clsx(
                "px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg disabled:opacity-50",
                isSyndicate ? "bg-syndicate-red hover:bg-red-700" : isDark ? "bg-indigo-500 hover:bg-indigo-600" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              Generate & Start Tournament
            </button>
          ) : (
            <div className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red" : isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
            )}>
              {liveTournament.status}
            </div>
          )}
        </div>

        {liveTournament.status !== 'upcoming' && (
          <div className="-mx-8 -mb-8 mt-4 border-t border-slate-200 dark:border-slate-800/50">
            {/* Provide a little padding or wrapper so BracketView looks good embedded */}
            <div className="p-8">
              <BracketView tournament={liveTournament} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
