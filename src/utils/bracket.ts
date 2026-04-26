import { Match, GameType, X01Config, CricketConfig, Tournament } from '../types';
import { shuffleArray } from './random';

export type { Match, GameType, X01Config, CricketConfig };

export function generateRoundRobin(
  participants: string[],
  tournamentId: string,
  gameType: GameType,
  gameConfig: X01Config | CricketConfig,
  podSize: number = 4,
  gamesPerPlayer: number = 3,
  seededParticipants: string[] = []
): Omit<Match, 'id'>[] {
  const playersToUse = seededParticipants.length > 0 ? seededParticipants : shuffleArray(participants);
  const matches: Omit<Match, 'id'>[] = [];

  // Group players into pods
  const pods: string[][] = [];
  let currentPod: string[] = [];
  for (const player of playersToUse) {
    currentPod.push(player);
    if (currentPod.length === podSize) {
      pods.push(currentPod);
      currentPod = [];
    }
  }
  // Handle remaining players if any
  if (currentPod.length > 0) {
    // Create a smaller pod for the remainder to avoid over-inflating existing pods
    pods.push(currentPod);
  }

  // Generate matches for each pod using the polygon/circle method for true round-robin scheduling
  let positionCounter = 0;
  pods.forEach((pod, podIndex) => {
    const numPlayers = pod.length;
    // We need at least 2 players to play a game
    if (numPlayers < 2) return;

    // The algorithm requires an even number of players. If odd, add a dummy 'bye' player
    const hasBye = numPlayers % 2 !== 0;
    const playersToSchedule = hasBye ? [...pod, 'BYE'] : [...pod];
    const n = playersToSchedule.length;

    // Generate rounds
    const numRounds = n - 1;
    let roundPairs: [string, string][] = [];

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < n / 2; i++) {
        const p1 = playersToSchedule[i];
        const p2 = playersToSchedule[n - 1 - i];

        // Don't add matches against the dummy 'bye' player
        if (p1 !== 'BYE' && p2 !== 'BYE') {
           roundPairs.push([p1, p2]);
        }
      }

      // Rotate array (keep index 0 fixed, rotate the rest clockwise)
      const first = playersToSchedule[0];
      const rest = playersToSchedule.slice(1);
      const lastElement = rest.pop();
      if (lastElement) {
        rest.unshift(lastElement);
      }
      playersToSchedule.length = 0; // Clear the array
      playersToSchedule.push(first, ...rest);
    }

    // We now have exactly 1 match per pair for everyone in the pod.
    // The total games each player has played so far is essentially numRounds (or numRounds-1 if they had a bye).
    // Let's cap the games using the playerGameCounts to ensure we don't exceed gamesPerPlayer.
    const playerGameCounts: Record<string, number> = {};
    pod.forEach(p => playerGameCounts[p] = 0);

    for (const [p1, p2] of roundPairs) {
      if (playerGameCounts[p1] < gamesPerPlayer && playerGameCounts[p2] < gamesPerPlayer) {
        matches.push({
          tournamentId,
          player1Id: p1,
          player2Id: p2,
          score1: 0,
          score2: 0,
          legs1: 0,
          legs2: 0,
          status: 'pending',
          round: podIndex + 1, // Use round to indicate Pod number for UI grouping
          position: positionCounter++,
          gameType,
          gameConfig
        });
        playerGameCounts[p1]++;
        playerGameCounts[p2]++;
      }
    }
  });

  return matches;
}

export function generateBracket(
  participants: string[], 
  tournamentId: string,
  gameType: GameType,
  gameConfig: X01Config | CricketConfig,
  seededParticipants: string[] = [],
  tournamentType: Tournament['type'] = 'single-elimination',
  roundRobinConfig?: Tournament['roundRobinConfig']
): Omit<Match, 'id'>[] {
  if (tournamentType === 'round-robin') {
    return generateRoundRobin(
      participants,
      tournamentId,
      gameType,
      gameConfig,
      roundRobinConfig?.podSize,
      roundRobinConfig?.gamesPerPlayer,
      seededParticipants
    );
  }

  const playersToUse = seededParticipants.length > 0 ? seededParticipants : shuffleArray(participants);
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
