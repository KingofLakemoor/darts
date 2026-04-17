import React, { useState } from 'react';
import { Tournament, Season, Venue } from '../types';
import { Trophy, Calendar, Users, ChevronRight, Target, Clock, MapPin, Skull } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { BracketView } from './BracketView';
import { useTheme } from '../lib/ThemeContext';
import { clsx } from 'clsx';
import { useEffect } from 'react';

interface Props {
  tournaments: Tournament[];
  season: Season | null;
  venues: Venue[];
}

export function TournamentView({ tournaments, season, venues }: Props) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;
  const { isSyndicate, isDark, setSyndicateMode } = useTheme();

  useEffect(() => {
    if (selectedTournament?.isSyndicate) {
      setSyndicateMode(true);
    } else {
      setSyndicateMode(false);
    }

    return () => setSyndicateMode(false);
  }, [selectedTournament, setSyndicateMode]);

  if (selectedTournament) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedTournamentId(null)}
          className={clsx(
            "flex items-center gap-2 transition-colors font-medium",
            isSyndicate ? "text-steel-gray hover:text-nasty-cream" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          Back to Tournaments
        </button>
        <BracketView tournament={selectedTournament} />
      </div>
    );
  }

  const upcoming = tournaments
    .filter(t => t.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const live = tournaments
    .filter(t => t.status === 'live')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completed = tournaments
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className={clsx(
              "px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase",
              isSyndicate ? "bg-syndicate-red/20 text-syndicate-red border border-syndicate-red/30" : isDark ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-indigo-100 text-indigo-700"
            )}>
              {season?.name || 'No Active Season'}
            </span>
          </div>
          <h1 className={clsx(
            "text-5xl font-bold tracking-tight",
            isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
          )}>Tournaments</h1>
        </div>
        <div className="flex gap-4">
          <StatCard label="Live Now" value={live.length.toString()} color={isSyndicate ? "text-syndicate-red" : isDark ? "text-emerald-400" : "text-emerald-600"} />
          <StatCard label="Upcoming" value={upcoming.length.toString()} color={isSyndicate ? "text-steel-gray" : isDark ? "text-indigo-400" : "text-indigo-600"} />
        </div>
      </header>

      {live.length > 0 && (
        <section>
          <SectionHeader title="Live Events" icon={<Target className={clsx("w-6 h-6", isDark && !isSyndicate ? "text-emerald-400" : "text-emerald-600")} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {live.map(t => (
              <TournamentCard key={t.id} tournament={t} venues={venues} onClick={() => setSelectedTournamentId(t.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Upcoming Tournaments" icon={<Calendar className={clsx("w-6 h-6", isDark && !isSyndicate ? "text-indigo-400" : "text-indigo-600")} />} />
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(t => (
              <TournamentCard key={t.id} tournament={t} venues={venues} onClick={() => setSelectedTournamentId(t.id)} />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming tournaments scheduled." />
        )}
      </section>

      {completed.length > 0 && (
        <section>
          <SectionHeader title="Recent Results" icon={<Trophy className={clsx("w-6 h-6", isDark && !isSyndicate ? "text-amber-500" : "text-amber-600")} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completed.map(t => (
              <TournamentCard key={t.id} tournament={t} venues={venues} onClick={() => setSelectedTournamentId(t.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  const { isSyndicate, isDark } = useTheme();
  return (
    <div className={clsx(
      "px-6 py-4 rounded-2xl border shadow-sm min-w-[140px]",
      isSyndicate ? "bg-onyx border-syndicate-red/30" : isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
    )}>
      <p className={clsx(
        "text-xs font-bold uppercase tracking-wider mb-1",
        isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
      )}>{label}</p>
      <p className={clsx(
        "text-3xl font-black",
        isSyndicate ? "font-rocker" : "",
        color
      )}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
  const { isSyndicate, isDark } = useTheme();
  return (
    <div className="flex items-center gap-3 mb-8">
      {icon}
      <h2 className={clsx(
        "text-2xl font-bold tracking-tight",
        isSyndicate ? "text-nasty-cream font-rocker" : isDark ? "text-slate-50" : "text-slate-900"
      )}>{title}</h2>
    </div>
  );
}

function TournamentCard({ tournament, venues, onClick }: { tournament: Tournament, venues: Venue[], onClick: () => void }) {
  const date = new Date(tournament.date);
  const { isSyndicate, isDark } = useTheme();
  const venue = venues.find(v => v.id === tournament.venueId);
  
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={clsx(
        "w-full text-left p-8 rounded-3xl border transition-all duration-300 group relative overflow-hidden",
        isSyndicate 
          ? "bg-onyx border-syndicate-red/30 hover:border-syndicate-red hover:shadow-[0_0_30px_rgba(139,0,0,0.2)] merrowed-border" 
          : isDark
            ? clsx(
                "bg-slate-900 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10",
                tournament.isSyndicate ? "border-syndicate-red shadow-[0_0_15px_rgba(139,0,0,0.2)]" : "border-slate-800"
              )
            : clsx(
                "bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5",
                tournament.isSyndicate ? "border-syndicate-red shadow-[0_0_15px_rgba(139,0,0,0.2)]" : "border-slate-200"
              )
      )}
    >
      <div className="absolute top-0 right-0 p-6">
        <ChevronRight className={clsx(
          "w-6 h-6 transition-all group-hover:translate-x-1",
          isSyndicate ? "text-syndicate-red group-hover:text-nasty-cream" : isDark ? "text-slate-600 group-hover:text-indigo-400" : "text-slate-300 group-hover:text-indigo-500"
        )} />
      </div>

      <div className="flex flex-col h-full">
        <div className="mb-6">
          <div className={clsx(
            "flex items-center gap-2 text-sm font-medium mb-3",
            isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <Clock className="w-4 h-4" />
            {format(date, 'MMM d, yyyy • h:mm a')}
          </div>
          <h3 className={clsx(
            "text-2xl font-bold transition-colors mb-2 flex items-center gap-2",
            isSyndicate ? "text-nasty-cream font-rocker group-hover:text-syndicate-red" : isDark ? "text-slate-50 group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600"
          )}>
            {tournament.name}
            {tournament.isSyndicate && (
              <Skull className={clsx(
                "w-5 h-5",
                isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400"
              )} />
            )}
          </h3>
          <p className={clsx(
            "font-medium capitalize",
            isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500"
          )}>{tournament.type.replace('-', ' ')}</p>
        </div>

        <div className={clsx(
          "mt-auto flex items-center gap-6 pt-6 border-t",
          isSyndicate ? "border-syndicate-red/20" : isDark ? "border-slate-800" : "border-slate-50"
        )}>
          <div className="flex items-center gap-2">
            <Users className={clsx("w-5 h-5", isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400")} />
            <span className={clsx("text-sm font-bold", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-300" : "text-slate-700")}>{tournament.participants.length} Players</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className={clsx("w-5 h-5", isSyndicate ? "text-syndicate-red" : isDark ? "text-slate-500" : "text-slate-400")} />
            <span className={clsx("text-sm font-bold truncate max-w-[120px]", isSyndicate ? "text-nasty-cream" : isDark ? "text-slate-300" : "text-slate-700")}>
              {venue?.name || 'Club 602'}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({ message }: { message: string }) {
  const { isSyndicate, isDark } = useTheme();
  return (
    <div className={clsx(
      "py-16 rounded-3xl border border-dashed text-center",
      isSyndicate ? "bg-onyx/50 border-syndicate-red/30" : isDark ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-300"
    )}>
      <Calendar className={clsx("w-12 h-12 mx-auto mb-4", isSyndicate ? "text-syndicate-red/50" : isDark ? "text-slate-700" : "text-slate-300")} />
      <p className={clsx("font-medium", isSyndicate ? "text-steel-gray" : isDark ? "text-slate-400" : "text-slate-500")}>{message}</p>
    </div>
  );
}
