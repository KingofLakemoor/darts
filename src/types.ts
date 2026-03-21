export type UserRole = 'admin' | 'player';
export type Permission = 'manage_users' | 'manage_seasons' | 'manage_events' | 'edit_scores';

export interface Player {
  id: string;
  uid?: string;
  name: string;
  email?: string;
  photoURL?: string;
  role: UserRole;
  permissions?: Permission[];
  stats?: {
    wins: number;
    losses: number;
    avgScore: number;
  };
}

export interface Season {
  id: string;
  name: string;
  startDate: any; // Firestore Timestamp
  endDate: any; // Firestore Timestamp
  status: 'upcoming' | 'active' | 'completed';
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  score1: number; // Current leg score
  score2: number; // Current leg score
  legs1: number; // Games won in best of 3
  legs2: number; // Games won in best of 3
  status: 'pending' | 'live' | 'completed';
  winnerId?: string;
  bracketPosition?: string; // e.g., 'WB-R1-M1'
}

export interface Tournament {
  id: string;
  name: string;
  date: any; // Firestore Timestamp
  location?: string;
  seasonId?: string;
  status: 'draft' | 'active' | 'completed';
  bracket?: string; // JSON string
  participants?: string[]; // Player IDs
}

export type View = 'home' | 'players' | 'tournaments' | 'scorer' | 'bracket' | 'admin';
