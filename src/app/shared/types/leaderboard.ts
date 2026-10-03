/** GET /api/leaderboard → data[] (always the top 5) */
export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  /** Plain number — the 🔥 emoji is added by the frontend */
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}
