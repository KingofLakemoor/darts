# Coordinator Operating Guide

Welcome to the Darts League! As a **Coordinator**, you have elevated privileges to manage the league's day-to-day operations, ensure tournaments run smoothly, handle seasonal transitions, and manage the player roster.

This guide will walk you through your core responsibilities using the **Admin Dashboard**.

---

## 1. Accessing the Admin Dashboard

To access the administrative tools:
1. Log in to the application using your authorized Coordinator account.
2. Navigate to the Admin Dashboard (usually accessible via the sidebar menu).
3. If you are authorized, you will see sections for:
   * **Seasons**
   * **New Tournament**
   * **Manage Tournaments**
   * **Generate Bracket**
   * **Venue Management**
   * **Player Management**

---

## 2. Managing Players

The **Player Management** section allows you to maintain the league's roster and tournament participants.

### Adding a New Player
When a new player joins the league:
1. Navigate to the **Add New Player** section at the bottom of the Admin Dashboard.
2. Enter the player's **First Name**, **Last Name**, and **Email Address**.
   * *Note:* The system automatically formats the display name (e.g., "John Doe" becomes "John D.").
3. Click the blue **+** button to add the player.

### Managing Tournament Participants
To add players to an upcoming tournament:
1. Select the tournament from the **Select Tournament to Manage** dropdown in the Player Management section.
2. The player list will now show an "In Tournament" column.
3. Click the checkmark icon in the "In Tournament" column to toggle a player's participation in the selected tournament.

### Managing Roles and Vested Status (Admins Only)
* **Vested Status:** Click the shield icon to toggle a player's vested status.
* **Roles:** Change a player's role between Player, Coordinator, and Admin using the dropdown.
* **Delete:** Click the trash icon to remove a player permanently.

---

## 3. Managing Venues

The **Venue Management** section is where you define the locations where league play happens.

### Adding a New Venue
1. Enter the **Venue Name** and **Address**.
2. Specify the **Number of Boards** available.
3. Check **Syndicate Partner** if the venue is an official Syndicate Partner.
4. Click **Add Venue**.

### Editing or Deleting a Venue
* **Edit:** Click the edit icon next to a venue to update its details.
* **Delete:** Click the trash icon to remove the venue.

---

## 4. Managing Seasons

The **Seasons** section groups tournaments together for leaderboards and long-term standings.

### Creating a Season
1. Type a name in the "Season Name" input (e.g., "Season 10" or "Fall 2024").
2. Click the **+** button to create it.

### Activating a Season
* To make a season the active, live season, click the **Inactive** button next to it. It will turn green and say **Active**.
* Activating a season automatically deactivates all other seasons.

---

## 5. Tournaments and Bracket Generation

This is the core of league night operations, allowing you to set up the game format, assign venues, and generate the brackets.

### Creating a New Tournament
1. In the **New Tournament** section, enter the **Tournament Name** and select the **Date & Time**.
2. Select the **Season** and **Venue** from the dropdowns.
3. Toggle **Syndicate Mode** if applicable (this applies special styling for Syndicate events).
4. Choose the **Game Type**:
   * **X01**: Configure the Start Score (301, 501, 701), Sets, Legs per Set, and Out Rule (Single, Double, Triple).
   * **Cricket**: Configure the Scoring Mode (Standard, Cut Throat) and toggle Random Numbers.
5. Click **Create Tournament**.

### Managing Existing Tournaments
In the **Manage Tournaments** section, you can:
* **Edit:** Update details like the name, venue, type, and game configuration by clicking the edit icon.
* **Delete:** Remove the tournament by clicking the trash icon.

### Generating Brackets and Starting the Tournament
Once participants are assigned to an upcoming tournament:
1. A **Generate Bracket** section will appear for the selected tournament.
2. Choose the **Seeding Method**:
   * `random`: Completely random matchups.
   * `season`: Seeds players based on their total wins in the season.
   * `skill`: Seeds players based on their average score.
3. Click **Generate & Start Tournament**.
   * *Note:* This will create the first round of matches and automatically set the tournament status to 'Live'. If you regenerate the bracket, all existing matches for that tournament will be deleted and recreated.