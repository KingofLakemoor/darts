import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateBracket } from './bracket.ts';

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

    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].round, 1);
    assert.strictEqual(matches[0].player1Id, 'p1');
    assert.strictEqual(matches[0].player2Id, 'p2');
    assert.strictEqual(matches[0].status, 'pending');
  });

  test('generates a 4-player bracket correctly', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // 2 matches in round 1, 1 match in round 2
    assert.strictEqual(matches.length, 3);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    assert.strictEqual(round1.length, 2);
    assert.strictEqual(round2.length, 1);

    assert.strictEqual(round1[0].player1Id, 'p1');
    assert.strictEqual(round1[0].player2Id, 'p2');
    assert.strictEqual(round1[1].player1Id, 'p3');
    assert.strictEqual(round1[1].player2Id, 'p4');

    assert.strictEqual(round2[0].player1Id, '');
    assert.strictEqual(round2[0].player2Id, '');
  });

  test('handles 3 players with a bye', () => {
    const participants = ['p1', 'p2', 'p3'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // Bracket size 4 -> 3 matches total
    assert.strictEqual(matches.length, 3);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    // Match 0: p1 vs p2 (pending)
    assert.strictEqual(round1[0].player1Id, 'p1');
    assert.strictEqual(round1[0].player2Id, 'p2');
    assert.strictEqual(round1[0].status, 'pending');

    // Match 1: p3 vs bye (completed)
    assert.strictEqual(round1[1].player1Id, 'p3');
    assert.strictEqual(round1[1].player2Id, '');
    assert.strictEqual(round1[1].status, 'completed');
    assert.strictEqual(round1[1].winnerId, 'p3');

    // p3 should advance to round 2, position 0, player 2 (since it was match 1)
    // nextPos = floor(1 / 2) = 0. i % 2 === 1, so player2Id.
    assert.strictEqual(round2[0].player2Id, 'p3');
  });

  test('handles 5 players with multiple byes', () => {
    const participants = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    // Bracket size 8 -> 4 + 2 + 1 = 7 matches
    assert.strictEqual(matches.length, 7);

    const round1 = matches.filter(m => m.round === 1);
    const round2 = matches.filter(m => m.round === 2);

    assert.strictEqual(round1[0].status, 'pending'); // p1 vs p2
    assert.strictEqual(round1[1].status, 'pending'); // p3 vs p4
    assert.strictEqual(round1[2].status, 'completed'); // p5 vs bye
    assert.strictEqual(round1[2].winnerId, 'p5');
    assert.strictEqual(round1[3].status, 'completed'); // bye vs bye

    // round 2 match 0 (from M0 and M1)
    assert.strictEqual(round2[0].player1Id, '');
    assert.strictEqual(round2[0].player2Id, '');

    // round 2 match 1 (from M2 and M3)
    assert.strictEqual(round2[1].player1Id, 'p5');
    assert.strictEqual(round2[1].player2Id, '');
  });

  test('shuffles participants when seeds are not provided', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];

    // seededParticipants takes precedence
    const seeds = ['s1', 's2', 's3', 's4'];
    const matches = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, seeds);

    const round1 = matches.filter(m => m.round === 1);
    assert.strictEqual(round1[0].player1Id, 's1');
    assert.strictEqual(round1[0].player2Id, 's2');
    assert.strictEqual(round1[1].player1Id, 's3');
    assert.strictEqual(round1[1].player2Id, 's4');
  });

  test('assigns correct metadata to matches', () => {
    const participants = ['p1', 'p2'];
    const [match] = generateBracket(participants, tournamentId, gameType as any, gameConfig as any, participants);

    assert.strictEqual(match.tournamentId, tournamentId);
    assert.strictEqual(match.gameType, gameType);
    assert.deepStrictEqual(match.gameConfig, gameConfig);
  });
});
