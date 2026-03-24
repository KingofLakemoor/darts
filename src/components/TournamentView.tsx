import React, { useState } from 'react';
import { Tournament, Season } from '../types';
import { Trophy, Calendar, Users, ChevronRight, Target, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { BracketView } from './BracketView';

interface Props {
  tournaments: Tournament[];
  season: Season | null;
}

export function TournamentView({ tournaments, season }: Props) {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  if (selectedTournament) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedTournament(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          Back to Tournaments
        </button>
        <BracketView tournament={selectedTournament} />
      </div>
    );
  }

  const upcoming = tournaments.filter(t => t.status === 'upcoming');
  const live = tournaments.filter(t => t.status === 'live');
  const completed = tournaments.filter(t => t.status === 'completed');

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
              {season?.name || 'No Active Season'}
            </span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight">Tournaments</h1>
        </div>
        <div className="flex gap-4">
          <StatCard label="Live Now" value={live.length.toString()} color="text-emerald-600" />
          <StatCard label="Upcoming" value={upcoming.length.toString()} color="text-indigo-600" />
        </div>
      </header>

      {live.length > 0 && (
        <section>
          <SectionHeader title="Live Events" icon={<Target className="w-6 h-6 text-emerald-600" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {live.map(t => (
              <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedTournament(t)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Upcoming Tournaments" icon={<Calendar className="w-6 h-6 text-indigo-600" />} />
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(t => (
              <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedTournament(t)} />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming tournaments scheduled." />
        )}
      </section>

      {completed.length > 0 && (
        <section>
          <SectionHeader title="Recent Results" icon={<Trophy className="w-6 h-6 text-amber-600" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completed.map(t => (
              <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedTournament(t)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm min-w-[140px]">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {icon}
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

function TournamentCard({ tournament, onClick }: { tournament: Tournament, onClick: () => void }) {
  const date = new Date(tournament.date);
  
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="w-full text-left bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6">
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="flex flex-col h-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Clock className="w-4 h-4" />
            {format(date, 'MMM d, yyyy • h:mm a')}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
            {tournament.name}
          </h3>
          <p className="text-slate-500 font-medium capitalize">{tournament.type.replace('-', ' ')}</p>
        </div>

        <div className="mt-auto flex items-center gap-6 pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{tournament.participants.length} Players</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Club 602</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white py-16 rounded-3xl border border-dashed border-slate-300 text-center">
      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">{message}</p>
    </div>
  );
}
