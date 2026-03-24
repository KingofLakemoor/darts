import { Match, GameType, X01Config, CricketConfig } from '../types';

export function generateBracket(
  participants: string[], 
  tournamentId: string,
  gameType: GameType,
  gameConfig: X01Config | CricketConfig,
  seededParticipants: string[] = []
): Omit<Match, 'id'>[] {
  const playersToUse = seededParticipants.length > 0 ? seededParticipants : [...participants].sort(() => Math.random() - 0.5);
  const numPlayers = playersToUse.length;
  const numRounds = Math.ceil(Math.log2(numPlayers));
  const bracketSize = Math.pow(2, numRounds);
  
  // Generate all matches first
  const rounds: Omit<Match, 'id'>[][] = [];
  let currentRoundSize = bracketSize / 2;
  let roundNum = 1;

  while (currentRoundSize >= 1) {
    const roundMatches: Omit<Match, 'id'>[] = [];
    for (let i = 0; i < currentRoundSize; i++) {
      roundMatches.push({
        tournamentId,
        player1Id: '',
        player2Id: '',
        score1: 0,
        score2: 0,
        legs1: 0,
        legs2: 0,
        status: 'pending',
        round: roundNum,
        position: i,
        gameType,
        gameConfig
      });
    }
    rounds.push(roundMatches);
    currentRoundSize /= 2;
    roundNum++;
  }

  // Fill first round and handle byes
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = playersToUse[i * 2] || '';
    const p2 = playersToUse[i * 2 + 1] || '';
    
    rounds[0][i].player1Id = p1;
    rounds[0][i].player2Id = p2;

    if (p1 && !p2) {
      rounds[0][i].status = 'completed';
      rounds[0][i].winnerId = p1;
      rounds[0][i].score1 = 1; // Mark as bye win
      // Move to next round
      if (rounds[1]) {
        const nextPos = Math.floor(i / 2);
        if (i % 2 === 0) rounds[1][nextPos].player1Id = p1;
        else rounds[1][nextPos].player2Id = p1;
      }
    } else if (!p1 && p2) {
      rounds[0][i].status = 'completed';
      rounds[0][i].winnerId = p2;
      rounds[0][i].score2 = 1; // Mark as bye win
      // Move to next round
      if (rounds[1]) {
        const nextPos = Math.floor(i / 2);
        if (i % 2 === 0) rounds[1][nextPos].player1Id = p2;
        else rounds[1][nextPos].player2Id = p2;
      }
    } else if (p1 && p2) {
      rounds[0][i].status = 'pending';
    } else {
      rounds[0][i].status = 'completed';
    }
  }

  return rounds.flat();
}
