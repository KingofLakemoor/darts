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
  const formattedPlayers = players.map(p => ({ ...p }));

  for (let i = 0; i < formattedPlayers.length; i++) {
    const current = formattedPlayers[i];
    const { first, last } = getFirstLast(current);

    if (!last) {
      current.name = first;
      continue;
    }

    // Find other players with the same first name
    const conflicts = formattedPlayers.filter((p, idx) => {
      if (idx === i) return false;
      const other = getFirstLast(p);
      return other.first.toLowerCase() === first.toLowerCase() && other.last.length > 0;
    });

    if (conflicts.length === 0) {
      current.name = `${first} ${last.charAt(0).toUpperCase()}.`;
      continue;
    }

    // Find the minimum number of characters of last name to make it unique
    let charsToUse = 1;
    const currentLastLower = last.toLowerCase();

    while (charsToUse <= last.length) {
      const currentPrefix = currentLastLower.substring(0, charsToUse);

      const hasConflict = conflicts.some(p => {
        const other = getFirstLast(p);
        const otherLastLower = other.last.toLowerCase();
        return otherLastLower.substring(0, charsToUse) === currentPrefix;
      });

      if (!hasConflict) {
        break;
      }
      charsToUse++;
    }

    const prefix = last.substring(0, charsToUse);
    const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    current.name = `${first} ${formattedPrefix}.`;
  }

  return formattedPlayers;
}
