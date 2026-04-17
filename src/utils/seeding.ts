import { Tournament, Match } from '../types';
import { shuffleArray } from './random';

export function getSeededParticipants(
  participants: string[],
  tournament: Tournament,
  allTournaments: Tournament[],
  allMatches: Match[],
): string[] {
  if (!tournament.seasonId) {
    return shuffleArray([...participants]);
  }

  const seasonTournaments = allTournaments.filter(t => t.seasonId === tournament.seasonId && t.id !== tournament.id);
  const seasonTournamentIds = new Set(seasonTournaments.map(t => t.id));
  const seasonMatches = allMatches.filter(m => seasonTournamentIds.has(m.tournamentId));

  if (seasonMatches.length === 0) {
    return shuffleArray([...participants]);
  }

  const playerWins: Record<string, number> = {};
  participants.forEach(p => { playerWins[p] = 0; });

  seasonMatches.forEach(m => {
    if (m.winnerId && participants.includes(m.winnerId)) {
      playerWins[m.winnerId] = (playerWins[m.winnerId] || 0) + 1;
    }
  });

  const hasAnyWins = Object.values(playerWins).some(wins => wins > 0);
  if (!hasAnyWins) {
    return shuffleArray([...participants]);
  }

  // Sort by wins descending. If ties, we should probably keep them random or sort by something else?
  // Let's sort by wins. For ties, maybe we shuffle first, then stable sort.

  // Create an array of objects
  const playerStats = participants.map(p => ({ uid: p, wins: playerWins[p] }));

  // Shuffle first to ensure random order for ties
  const shuffledPlayerStats = shuffleArray(playerStats);

  // Sort descending by wins
  shuffledPlayerStats.sort((a, b) => b.wins - a.wins);

  return shuffledPlayerStats.map(p => p.uid);
}
