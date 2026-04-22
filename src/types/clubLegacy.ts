/** Manual / imported rivalry summary (not tied to a single Firestore series). */
export type ClubEraSide = {
  /** e.g. "Team-A" */
  label: string;
  captain: string;
  viceCaptain: string;
  /** Display string e.g. "130+" */
  winsLabel: string;
};

export type ClubEraEntry = {
  id: string;
  title: string;
  sideA: ClubEraSide;
  sideB: ClubEraSide;
  note?: string;
};

export type ClubDoubleWicketHallEntry = {
  place: number;
  pairLabel: string;
  dateLabel: string;
};

export type ClubTestBattingRow = {
  rank: number;
  name: string;
  runs: number;
  innings: number;
  best: number;
};

export type ClubTestBowlingRow = {
  rank: number;
  name: string;
  wickets: number;
  innings: number;
  best: number;
};

export type ClubMilestoneCount = {
  name: string;
  count: number;
};

/** Full snapshot shown on the History tab (defaults in code; can move to Firestore later). */
export type ClubLegacySnapshot = {
  overallTitle: string;
  eras: ClubEraEntry[];
  totalsFootnote?: string;
  teamATotalWins: number;
  teamBTotalWins: number;
  doubleWicketTitle: string;
  doubleWicketIntro?: string;
  doubleWicketHall: ClubDoubleWicketHallEntry[];
  testBlockTitle: string;
  testAfterMatches: number;
  testAsOfLabel?: string;
  testBatting: ClubTestBattingRow[];
  testBowling: ClubTestBowlingRow[];
  fifties: ClubMilestoneCount[];
  hundreds: ClubMilestoneCount[];
};
