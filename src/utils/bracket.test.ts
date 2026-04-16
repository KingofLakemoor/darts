import { test, describe, expect } from 'vitest';
import { generateBracket } from './bracket';

const tournamentId = 'test-tournament';
const gameType = 'X01';
const gameConfig = {
  startScore: 501,
  sets: 1,
  legs: 3,
  inRule: 'single',
  outRule: 'double'
};

describe('generateBracket', () => {
  test('generates a 2-player bracket correctly', () => {
    const participants = ['p1', 'p2'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    expect(matches.length).toBe(1);
    expect(matches[0].round).toBe(1);
    expect(matches[0].player1Id).toBe('p1');
    expect(matches[0].player2Id).toBe('p2');
    expect(matches[0].status).toBe('pending');
  });

  test('generates a 4-player bracket correctly', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // 2 matches in round 1, 1 match in round 2
    expect(matches.length).toBe(3);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    expect(round1.length).toBe(2);
    expect(round2.length).toBe(1);

    expect(round1[0].player1Id).toBe('p1');
    expect(round1[0].player2Id).toBe('p2');
    expect(round1[1].player1Id).toBe('p3');
    expect(round1[1].player2Id).toBe('p4');

    expect(round2[0].player1Id).toBe('');
    expect(round2[0].player2Id).toBe('');
  });

  test('handles 3 players with a bye', () => {
    const participants = ['p1', 'p2', 'p3'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // Bracket size 4 -> 3 matches total
    expect(matches.length).toBe(3);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    // Match 0: p1 vs p2 (pending)
    expect(round1[0].player1Id).toBe('p1');
    expect(round1[0].player2Id).toBe('p2');
    expect(round1[0].status).toBe('pending');

    // Match 1: p3 vs bye (completed)
    expect(round1[1].player1Id).toBe('p3');
    expect(round1[1].player2Id).toBe('');
    expect(round1[1].status).toBe('completed');
    expect(round1[1].winnerId).toBe('p3');

    // p3 should advance to round 2, position 0, player 2 (since it was match 1)
    // nextPos = floor(1 / 2) = 0. i % 2 === 1, so player2Id.
    expect(round2[0].player2Id).toBe('p3');
  });

  test('handles 5 players with multiple byes', () => {
    const participants = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // Bracket size 8 -> 4 + 2 + 1 = 7 matches
    expect(matches.length).toBe(7);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    expect(round1[0].status).toBe('pending'); // p1 vs p2
    expect(round1[1].status).toBe('pending'); // p3 vs p4
    expect(round1[2].status).toBe('completed'); // p5 vs bye
    expect(round1[2].winnerId).toBe('p5');
    expect(round1[3].status).toBe('completed'); // bye vs bye

    // round 2 match 0 (from M0 and M1)
    expect(round2[0].player1Id).toBe('');
    expect(round2[0].player2Id).toBe('');

    // round 2 match 1 (from M2 and M3)
    expect(round2[1].player1Id).toBe('p5');
    expect(round2[1].player2Id).toBe('');
  });

  test('shuffles participants when seeds are not provided', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];

    // seededParticipants takes precedence
    const seeds = ['s1', 's2', 's3', 's4'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, seeds);

    const round1 = matches.filter(m => m.round === 1);
    expect(round1[0].player1Id).toBe('s1');
    expect(round1[0].player2Id).toBe('s2');
    expect(round1[1].player1Id).toBe('s3');
    expect(round1[1].player2Id).toBe('s4');
  });

  test('assigns correct metadata to matches', () => {
    const participants = ['p1', 'p2'];
    const [match] = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    expect(match.tournamentId).toBe(tournamentId);
    expect(match.gameType).toBe(gameType);
    expect(match.gameConfig).toEqual(gameConfig);
  });
});
