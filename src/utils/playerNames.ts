import { Player } from '../types';

export function getFirstLast(player: Player): { first: string; last: string } {
  if (player.firstName && player.lastName) {
    return { first: player.firstName.trim(), last: player.lastName.trim() };
  }

  if (player.name) {
    const parts = player.name.trim().split(/\s+/);
    if (parts.length > 1) {
      // If the name is already in format "First L.", we might want to strip the dot
      const lastPart = parts.slice(1).join(' ');
      // If it's a single initial with a dot, we don't have the full last name.
      // But we just use what we have.
      return { first: parts[0], last: lastPart.replace(/\.$/, '') };
    }
    return { first: player.name, last: '' };
  }

  return { first: 'Anonymous', last: '' };
}

export function formatPlayerNames(players: Player[]): Player[] {
  // Pre-calculate parsed names and group by first name to avoid redundant work and O(N^2) scans
  const playersWithParsedNames = players.map(p => ({
    player: { ...p },
    parsed: getFirstLast(p)
  }));

  const byFirstName = new Map<string, typeof playersWithParsedNames>();
  for (const item of playersWithParsedNames) {
    const firstLower = item.parsed.first.toLowerCase();
    let group = byFirstName.get(firstLower);
    if (!group) {
      group = [];
      byFirstName.set(firstLower, group);
    }
    group.push(item);
  }

  return playersWithParsedNames.map(({ player, parsed }) => {
    const { first, last } = parsed;

    if (!last) {
      player.name = first;
      return player;
    }

    const firstLower = first.toLowerCase();
    const allWithSameFirst = byFirstName.get(firstLower) || [];

    // Find other players with the same first name and a non-empty last name
    const conflicts = allWithSameFirst.filter(item =>
      item.player.uid !== player.uid && item.parsed.last.length > 0
    );

    if (conflicts.length === 0) {
      player.name = `${first} ${last.charAt(0).toUpperCase()}.`;
      return player;
    }

    // Find the minimum number of characters of last name to make it unique
    let charsToUse = 1;
    const currentLastLower = last.toLowerCase();

    while (charsToUse <= last.length) {
      const currentPrefix = currentLastLower.substring(0, charsToUse);

      const hasConflict = conflicts.some(item => {
        const otherLastLower = item.parsed.last.toLowerCase();
        return otherLastLower.substring(0, charsToUse) === currentPrefix;
      });

      if (!hasConflict) {
        break;
      }
      charsToUse++;
    }

    const prefix = last.substring(0, charsToUse);
    const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    player.name = `${first} ${formattedPrefix}.`;
    return player;
  });
}
