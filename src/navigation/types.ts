export type RootStackParamList = {
  MainTabs: undefined;
  AdminSignIn: undefined;
  TeamDetail: { teamId: string; teamName: string };
  SeriesDetail: { seriesId: string; seriesName: string };
  MatchScoring: { matchId: string; headerTitle: string };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Squads: undefined;
  Fixtures: undefined;
  Live: undefined;
  Leaders: undefined;
  History: undefined;
};
