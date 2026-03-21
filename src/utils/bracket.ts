export interface BracketMatch {
  id: string;
  p1: string | null; // Player ID
  p2: string | null; // Player ID
  winner: string | null;
  score1: number;
  score2: number;
  nextMatchId: string | null;
  loserToMatchId: string | null;
  round: number;
  type: 'WB' | 'LB' | 'GF'; // Winners, Losers, Grand Finals
}

export interface Bracket {
  winners: BracketMatch[][];
  losers: BracketMatch[][];
  finals: BracketMatch | null;
}

export function generateDoubleElimination(playerIds: string[]): Bracket {
  const n = playerIds.length;
  const rounds = Math.ceil(Math.log2(n));
  const totalPlayers = Math.pow(2, rounds);
  
  // Fill with byes if needed
  const participants = [...playerIds];
  while (participants.length < totalPlayers) {
    participants.push('BYE');
  }

  const winners: BracketMatch[][] = [];
  const losers: BracketMatch[][] = [];

  // Winners Bracket Round 1
  const wbR1: BracketMatch[] = [];
  for (let i = 0; i < totalPlayers; i += 2) {
    wbR1.push({
      id: `WB-R1-M${i/2 + 1}`,
      p1: participants[i],
      p2: participants[i+1],
      winner: null,
      score1: 0,
      score2: 0,
      nextMatchId: `WB-R2-M${Math.floor(i/4) + 1}`,
      loserToMatchId: `LB-R1-M${Math.floor(i/4) + 1}`,
      round: 1,
      type: 'WB'
    });
  }
  winners.push(wbR1);

  // Generate subsequent WB rounds
  for (let r = 2; r <= rounds; r++) {
    const prevRound = winners[r-2];
    const currentRound: BracketMatch[] = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      currentRound.push({
        id: `WB-R${r}-M${i/2 + 1}`,
        p1: null,
        p2: null,
        winner: null,
        score1: 0,
        score2: 0,
        nextMatchId: r === rounds ? 'GF' : `WB-R${r+1}-M${Math.floor(i/4) + 1}`,
        loserToMatchId: `LB-R${(r-1)*2}-M${i/2 + 1}`, // Losers from WB move to LB
        round: r,
        type: 'WB'
      });
    }
    winners.push(currentRound);
  }

  // Losers Bracket is more complex, but let's start with a simplified structure
  // LB usually has 2x rounds of WB
  // Round 1: Losers from WB R1
  // Round 2: Winners of LB R1 vs Losers from WB R2
  // ...

  return { winners, losers, finals: null };
}
