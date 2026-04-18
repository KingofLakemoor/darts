1. **Create utility function `formatPlayerNames`**:
   - Create a file `src/utils/playerNames.ts` that exports `formatPlayerNames`.
   - The function should take an array of `Player` objects and return an array where the `name` property is formatted as "First Name" "Last initial.".
   - If there are conflicts (identical first name and last initial), use as many letters of the last name as required to make them unique.
2. **Update Components to use `formatPlayerNames`**:
   - Search for all occurrences where `setPlayers` is called with data fetched from the `players` collection in Firestore.
   - Specifically, update `src/components/PlayerView.tsx`, `src/components/StatsView.tsx`, `src/components/AdminPanel.tsx`, `src/components/EventDashboard.tsx`, and `src/components/BracketView.tsx`.
   - Instead of directly setting the players from the snapshot, pass the mapped array through `formatPlayerNames` before setting the state. For object maps (like in `EventDashboard` and `BracketView`), convert the map to an array, format it, and convert it back to a map if necessary, or just store the formatted names.
3. **Handle new player creation / updating**:
   - In `src/components/AdminPanel.tsx` `createPlayer` uses a simple `displayName = \`\${newPlayer.firstName} \${newPlayer.lastName.charAt(0).toUpperCase()}.\`;`. Since `formatPlayerNames` dynamically adjusts names for uniqueness, we can keep the underlying `name` property as a simple first/last initial, but maybe it's better if `formatPlayerNames` ignores the stored `name` if `firstName` and `lastName` exist. The utility is already written to prioritize `firstName` and `lastName`.
4. **Update App.tsx**:
   - The user's name is saved on login in `App.tsx`. If it is saved as "First L.", `formatPlayerNames` handles it.
5. **Pre-commit checks**:
   - Run linter and tests. Verify UI by running the dev server.
