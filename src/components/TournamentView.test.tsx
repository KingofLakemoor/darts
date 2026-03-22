import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentView from './TournamentView';
import { Tournament, Player, Season } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Firebase
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('../firebase', () => ({
  db: {},
  collection: vi.fn((db, path) => path),
  doc: vi.fn((db, path, id) => `${path}/${id}`),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    })
  }
}));

describe('TournamentView', () => {
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Alice', role: 'player' },
    { id: 'p2', name: 'Bob', role: 'player' },
    { id: 'p3', name: 'Charlie', role: 'player' }
  ];

  const mockSeasons: Season[] = [
    { id: 's1', name: 'Summer Season 2026', startDate: {} as any, endDate: {} as any, status: 'active' }
  ];

  const mockTournaments: Tournament[] = [
    {
      id: 't1',
      name: 'Spring Open 2025',
      date: { toDate: () => new Date('2025-04-15T10:00:00Z') } as any,
      location: 'The Darts Den',
      status: 'active',
      participants: ['p1', 'p2']
    },
    {
      id: 't2',
      name: 'Winter Classic 2025',
      date: { toDate: () => new Date('2025-12-01T10:00:00Z') } as any,
      status: 'draft',
      participants: ['p1', 'p2', 'p3']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no tournaments exist', () => {
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={null} seasons={mockSeasons} />);
    expect(screen.getByText('No tournaments scheduled yet.')).toBeInTheDocument();
  });

  it('renders a list of tournaments', () => {
    render(<TournamentView tournaments={mockTournaments} players={mockPlayers} currentUser={null} seasons={mockSeasons} />);
    expect(screen.getByText('Spring Open 2025')).toBeInTheDocument();
    expect(screen.getByText('Winter Classic 2025')).toBeInTheDocument();
    expect(screen.getByText('The Darts Den')).toBeInTheDocument();
  });

  it('hides "New Tournament" button for users without manage_events permission', () => {
    const regularUser: Player = { id: 'u1', name: 'User', role: 'player', permissions: [] };
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={regularUser} seasons={mockSeasons} />);
    expect(screen.queryByText('New Tournament')).not.toBeInTheDocument();
  });

  it('shows "New Tournament" button for users with manage_events permission', () => {
    const adminUser: Player = { id: 'a1', name: 'Admin', role: 'admin', permissions: ['manage_events'] };
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={adminUser} seasons={mockSeasons} />);
    expect(screen.getByText('New Tournament')).toBeInTheDocument();
  });

  it('shows "New Tournament" button for hardcoded super admin', () => {
    const superAdmin: Player = { id: 'sa1', name: 'Super Admin', role: 'player', email: 'kingoflakemoor@gmail.com' };
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={superAdmin} seasons={mockSeasons} />);
    expect(screen.getByText('New Tournament')).toBeInTheDocument();
  });

  it('opens and closes the "Create Tournament" modal', async () => {
    const adminUser: Player = { id: 'a1', name: 'Admin', role: 'admin', permissions: ['manage_events'] };
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={adminUser} seasons={mockSeasons} />);

    // Open modal
    fireEvent.click(screen.getByText('New Tournament'));
    expect(screen.getAllByText('Create Tournament')[0]).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Tournament')).not.toBeInTheDocument();
  });

  it('creates a new tournament successfully', async () => {
    const adminUser: Player = { id: 'a1', name: 'Admin', role: 'admin', permissions: ['manage_events'] };
    const user = userEvent.setup();
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={adminUser} seasons={mockSeasons} />);

    // Open modal
    await user.click(screen.getByText('New Tournament'));

    // Fill out form
    await user.type(screen.getByPlaceholderText('e.g. Spring Open 2026'), 'New Test Tournament');
    await user.type(screen.getByPlaceholderText('e.g. The Darts Den'), 'Test Location');

    // Select participants
    await user.click(screen.getByText('Alice'));
    await user.click(screen.getByText('Bob'));

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create Tournament' }));

    // Wait for the form submission to finish
    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    const addDocArgs = mockAddDoc.mock.calls[0];
    expect(addDocArgs[0]).toBe('tournaments');
    expect(addDocArgs[1]).toEqual(expect.objectContaining({
      name: 'New Test Tournament',
      location: 'Test Location',
      seasonId: null,
      status: 'draft',
      participants: ['p1', 'p2']
    }));
  });

  it('disables create button if fewer than 2 participants selected', async () => {
    const adminUser: Player = { id: 'a1', name: 'Admin', role: 'admin', permissions: ['manage_events'] };
    const user = userEvent.setup();
    render(<TournamentView tournaments={[]} players={mockPlayers} currentUser={adminUser} seasons={mockSeasons} />);

    await user.click(screen.getByText('New Tournament'));
    await user.type(screen.getByPlaceholderText('e.g. Spring Open 2026'), 'Incomplete Tournament');

    // Select only 1 participant
    await user.click(screen.getByText('Alice'));

    const createButton = screen.getByRole('button', { name: 'Create Tournament' });
    expect(createButton).toBeDisabled();
  });

  it('starts a draft tournament', async () => {
    const adminUser: Player = { id: 'a1', name: 'Admin', role: 'admin', permissions: ['manage_events'] };
    const user = userEvent.setup();
    render(<TournamentView tournaments={mockTournaments} players={mockPlayers} currentUser={adminUser} seasons={mockSeasons} />);

    // Find the start button for the draft tournament
    const startButtons = screen.getAllByRole('button', { name: /Start/i });
    expect(startButtons.length).toBe(1);

    await user.click(startButtons[0]);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalled(); // Should have created matches
    });

    const updateDocArgs = mockUpdateDoc.mock.calls[0];
    expect(updateDocArgs[0]).toBe('tournaments/t2');
    expect(updateDocArgs[1]).toEqual({ status: 'active' });
  });
});
