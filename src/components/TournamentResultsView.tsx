import React, { useMemo } from 'react';
import { Match, Player, Tournament } from '../types';
import { clsx } from 'clsx';
import { useTheme } from '../lib/ThemeContext';
import { Trophy, Star, Medal } from 'lucide-react';

interface Props {
  tournament: Tournament;
  matches: Match[];
  players: Record<string, Player>;
}

export function TournamentResultsView({ tournament, matches, players }: Props) {
  const { isSyndicate, isDark } = useTheme();

  const results = useMemo(() => {
    const stats: Record<string, {
      uid: string;
      matchesPlayed: number;
      matchesWon: number;
      legsWon: number;
      legsLost: number;
    }> = {};

    // Initialize stats for all participants
    tournament.participants.forEach(uid => {
      stats[uid] = {
        uid,
        matchesPlayed: 0,
        matchesWon: 0,
        legsWon: 0,
        legsLost: 0,
      };
    });

    matches.forEach(match => {
      if (match.status !== 'completed' || !match.player1Id || !match.player2Id) return;

      const p1 = match.player1Id;
      const p2 = match.player2Id;

      if (!stats[p1] || !stats[p2]) return;

      stats[p1].matchesPlayed++;
      stats[p2].matchesPlayed++;

      if (match.winnerId === p1) {
        stats[p1].matchesWon++;
      } else if (match.winnerId === p2) {
        stats[p2].matchesWon++;
      }

      stats[p1].legsWon += match.score1;
      stats[p1].legsLost += match.score2;
      stats[p2].legsWon += match.score2;
      stats[p2].legsLost += match.score1;
    });

    return Object.values(stats).sort((a, b) => {
      if (tournament.winnerId) {
        if (a.uid === tournament.winnerId) return -1;
        if (b.uid === tournament.winnerId) return 1;
      }

      // Sort by matches won (descending)
      if (b.matchesWon !== a.matchesWon) {
        return b.matchesWon - a.matchesWon;
      }

      // Then by leg differential
      const diffA = a.legsWon - a.legsLost;
      const diffB = b.legsWon - b.legsLost;
      if (diffB !== diffA) {
        return diffB - diffA;
      }

      // Finally by total legs won
      return b.legsWon - a.legsWon;
    });
  }, [tournament, matches]);

  if (results.length === 0) {
    return (
      <div className={clsx(
        "p-8 text-center rounded-2xl border",
        isSyndicate ? "bg-onyx/50 border-syndicate-red/20 text-steel-gray" : isDark ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
      )}>
        No results available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => {
        const player = players[result.uid];
        const rank = index + 1;

        let Icon = null;
        let iconColor = "";

        if (rank === 1) {
          Icon = Trophy;
          iconColor = isSyndicate ? "text-syndicate-red" : "text-amber-400";
        } else if (rank === 2) {
          Icon = Star;
          iconColor = isSyndicate ? "text-steel-gray" : "text-slate-300";
        } else if (rank === 3) {
          Icon = Medal;
          iconColor = isSyndicate ? "text-nasty-cream" : "text-amber-700";
        }

        const legDiff = result.legsWon - result.legsLost;

        return (
          <div
            key={result.uid}
            className={clsx(
              "flex items-center justify-between p-4 md:p-6 rounded-2xl border transition-all",
              rank === 1 && (isSyndicate ? "border-syndicate-red/50 bg-onyx shadow-[0_0_15px_rgba(139,0,0,0.15)]" : isDark ? "border-amber-500/30 bg-slate-800" : "border-amber-400/50 bg-amber-50"),
              rank !== 1 && (isSyndicate ? "border-syndicate-red/20 bg-onyx/50" : isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")
            )}
          >
            <div className="flex items-center gap-6">
              <span className={clsx(
                "text-3xl md:text-4xl font-black italic",
                isSyndicate ? "text-syndicate-red/50 font-rocker" : isDark ? "text-slate-700" : "text-slate-300"
              )}>
                {rank.toString().padStart(2, '0')}
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-lg md:text-xl font-bold uppercase tracking-wide",
                    rank === 1 && (isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-50" : "text-slate-900"),
                    rank !== 1 && (isSyndicate ? "text-steel-gray" : isDark ? "text-slate-300" : "text-slate-700")
                  )}>
                    {player?.name || 'Unknown'}
                  </span>
                  {Icon && <Icon className={clsx("w-5 h-5", iconColor)} />}
                </div>
                <div className={clsx(
                  "text-xs font-medium uppercase tracking-wider mt-1 flex items-center gap-2",
                  isSyndicate ? "text-syndicate-red/60" : isDark ? "text-slate-500" : "text-slate-400"
                )}>
                  Matches: {result.matchesPlayed}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-12">
              <div className="text-center hidden md:block">
                <div className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest mb-1",
                  isSyndicate ? "text-steel-gray" : isDark ? "text-slate-500" : "text-slate-400"
                )}>
                  W - L
                </div>
                <div className={clsx(
                  "text-lg font-black font-mono",
                  isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-200" : "text-slate-700"
                )}>
                  {result.matchesWon} - {result.matchesPlayed - result.matchesWon}
                </div>
              </div>

              <div className="w-px h-10 bg-slate-800/50 hidden md:block" />

              <div className="text-center">
                <div className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest mb-1",
                  isSyndicate ? "text-steel-gray" : isDark ? "text-slate-500" : "text-slate-400"
                )}>
                  Leg Diff
                </div>
                <div className={clsx(
                  "text-2xl md:text-3xl font-black font-mono",
                  legDiff > 0 ? (isSyndicate ? "text-syndicate-red" : "text-emerald-500") :
                  legDiff < 0 ? (isSyndicate ? "text-steel-gray" : "text-rose-500") :
                  (isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-400" : "text-slate-500")
                )}>
                  {legDiff > 0 ? `+${legDiff}` : legDiff}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
