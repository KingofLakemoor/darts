import { test, describe, expect } from 'vitest';
import { getSeededParticipants } from './seeding';
import { Tournament, Match, GameType, X01Config } from '../types';

const gameConfig: X01Config = {
  startScore: 501,
  sets: 1,
  legs: 3,
  inRule: 'single',
  outRule: 'double'
};

const baseTournament: Tournament = {
  id: 't2',
  name: 'T2',
  date: '2024-01-02',
  status: 'upcoming',
  type: 'single-elimination',
  gameType: 'X01',
  gameConfig,
  participants: [],
};

describe('getSeededParticipants', () => {
  test('returns shuffled array if no seasonId', () => {
    const participants = ['p1', 'p2', 'p3'];
    const t = { ...baseTournament };
    const result = getSeededParticipants(participants, t, [], []);
    expect(result.length).toBe(3);
    expect(result).toEqual(expect.arrayContaining(participants));
  });

  test('returns shuffled array if no previous matches in season', () => {
    const participants = ['p1', 'p2', 'p3'];
    const t = { ...baseTournament, seasonId: 's1' };
    const prevT = { ...baseTournament, id: 't1', seasonId: 's1' };
    const result = getSeededParticipants(participants, t, [prevT], []);
    expect(result.length).toBe(3);
    expect(result).toEqual(expect.arrayContaining(participants));
  });

  test('sorts participants by wins in the current season', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];
    const t = { ...baseTournament, seasonId: 's1' };
    const prevT = { ...baseTournament, id: 't1', seasonId: 's1' };

    // p3 has 2 wins, p1 has 1 win, p2 and p4 have 0
    const matches: Match[] = [
      { id: 'm1', tournamentId: 't1', player1Id: 'p3', player2Id: 'p4', score1: 1, score2: 0, legs1: 2, legs2: 0, winnerId: 'p3', status: 'completed', round: 1, position: 0, gameType: 'X01', gameConfig },
      { id: 'm2', tournamentId: 't1', player1Id: 'p1', player2Id: 'p2', score1: 1, score2: 0, legs1: 2, legs2: 0, winnerId: 'p1', status: 'completed', round: 1, position: 1, gameType: 'X01', gameConfig },
      { id: 'm3', tournamentId: 't1', player1Id: 'p3', player2Id: 'p1', score1: 1, score2: 0, legs1: 2, legs2: 0, winnerId: 'p3', status: 'completed', round: 2, position: 0, gameType: 'X01', gameConfig },
    ];

    const result = getSeededParticipants(participants, t, [prevT], matches);
    expect(result[0]).toBe('p3'); // 2 wins
    expect(result[1]).toBe('p1'); // 1 win
    expect(['p2', 'p4']).toContain(result[2]); // 0 wins
    expect(['p2', 'p4']).toContain(result[3]); // 0 wins
  });
});
