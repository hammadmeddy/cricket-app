import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import type { RootStackParamList } from './types';
import MainTabNavigator from './MainTabNavigator';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import SeriesDetailScreen from '../screens/SeriesDetailScreen';
import MatchScoringScreen from '../screens/MatchScoringScreen';
import AdminSignInScreen from '../screens/AdminSignInScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminSignIn"
          component={AdminSignInScreen}
          options={{ title: 'Staff', presentation: 'modal', headerBackTitle: 'Close' }}
        />
        <Stack.Screen
          name="TeamDetail"
          component={TeamDetailScreen}
          options={({ route }) => ({
            title: route.params.teamName,
            headerBackTitle: 'Squads',
          })}
        />
        <Stack.Screen
          name="SeriesDetail"
          component={SeriesDetailScreen}
          options={({ route }) => ({
            title: route.params.seriesName,
            headerBackTitle: 'Fixtures',
          })}
        />
        <Stack.Screen
          name="MatchScoring"
          component={MatchScoringScreen}
          options={({ route }) => ({
            title: route.params.headerTitle,
            headerBackTitle: 'Back',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
