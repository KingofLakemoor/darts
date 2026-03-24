export interface Player {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  role: 'admin' | 'player';
  stats?: PlayerStats;
}

export interface PlayerStats {
  wins?: number;
  losses?: number;
  wonLegs?: number;
  totalLegs?: number;
  avg?: number;
  nineAvg?: number;
  dblCheckout?: number;
  dblCheckoutAttempts?: number;
  sglCheckout?: number;
  sglCheckoutAttempts?: number;
  topLeg?: number;
  topFinish?: number;
  topScore?: number;
  topAvg?: number;
  topNineAvg?: number;
  count180s?: number;
  count170plus?: number;
  count130plus?: number;
  count90plus?: number;
  avgScore?: number;
  highScore?: number;
}

export type GameType = 'X01' | 'Cricket';

export interface X01Config {
  startScore: 301 | 501 | 701;
  sets: number;
  legs: number;
  inRule: 'single' | 'double' | 'triple';
  outRule: 'single' | 'double' | 'triple';
}

export interface CricketConfig {
  mode: 'Standard' | 'Cut Throat';
  random: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: 'upcoming' | 'live' | 'completed';
  type: 'single-elimination' | 'double-elimination' | 'round-robin';
  gameType: GameType;
  gameConfig: X01Config | CricketConfig;
  participants: string[]; // Player UIDs
  winnerId?: string;
  seasonId?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  score1: number; // Sets won
  score2: number; // Sets won
  legs1: number; // Legs won in current set
  legs2: number; // Legs won in current set
  winnerId?: string;
  status: 'pending' | 'live' | 'completed';
  round: number;
  position: number;
  gameType: GameType;
  gameConfig: X01Config | CricketConfig;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  active: boolean;
}
