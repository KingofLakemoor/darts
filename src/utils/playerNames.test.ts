import { describe, it, expect } from 'vitest';
import { formatPlayerNames } from './playerNames';
import { Player } from '../types';

describe('formatPlayerNames', () => {
  const mockPlayer = (overrides: Partial<Player>): Player => ({
    uid: '1',
    name: '',
    role: 'player',
    ...overrides,
  });

  it('formats unique first names with just the first initial of the last name', () => {
    const players = [
      mockPlayer({ firstName: 'John', lastName: 'Doe' }),
      mockPlayer({ firstName: 'Jane', lastName: 'Smith' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('John D.');
    expect(formatted[1].name).toBe('Jane S.');
  });

  it('handles name collisions by adding more characters of the last name', () => {
    const players = [
      mockPlayer({ firstName: 'John', lastName: 'Doe' }),
      mockPlayer({ firstName: 'John', lastName: 'Deer' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('John Do.');
    expect(formatted[1].name).toBe('John De.');
  });

  it('handles name collisions requiring even more characters', () => {
    const players = [
      mockPlayer({ firstName: 'John', lastName: 'Dixon' }),
      mockPlayer({ firstName: 'John', lastName: 'Dixie' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('John Dixon.');
    expect(formatted[1].name).toBe('John Dixie.');
  });

  it('handles players with no last name', () => {
    const players = [
      mockPlayer({ firstName: 'John', lastName: 'Doe' }),
      mockPlayer({ firstName: 'John', lastName: '' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('John D.');
    expect(formatted[1].name).toBe('John');
  });

  it('handles multiple collisions', () => {
    const players = [
      mockPlayer({ firstName: 'John', lastName: 'Abc' }),
      mockPlayer({ firstName: 'John', lastName: 'Abd' }),
      mockPlayer({ firstName: 'John', lastName: 'Abe' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('John Abc.');
    expect(formatted[1].name).toBe('John Abd.');
    expect(formatted[2].name).toBe('John Abe.');
  });

  it('is case insensitive when detecting conflicts', () => {
    const players = [
      mockPlayer({ firstName: 'john', lastName: 'Doe' }),
      mockPlayer({ firstName: 'John', lastName: 'Deer' }),
    ];
    const formatted = formatPlayerNames(players);
    expect(formatted[0].name).toBe('john Do.');
    expect(formatted[1].name).toBe('John De.');
  });
});
