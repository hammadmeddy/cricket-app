import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootTabParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import SquadsScreen from '../screens/SquadsScreen';
import FixturesScreen from '../screens/FixturesScreen';
import LiveScreen from '../screens/LiveScreen';
import LeadersScreen from '../screens/LeadersScreen';
import ClubHistoryScreen from '../screens/ClubHistoryScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IonName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, IonName> = {
  Dashboard: 'speedometer-outline',
  Squads: 'people-outline',
  Fixtures: 'calendar-outline',
  Live: 'radio-outline',
  Leaders: 'podium-outline',
  History: 'book-outline',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerShadowVisible: false,
        tabBarScrollEnabled: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          paddingTop: spacing.xs,
          height: 58,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: spacing.xs,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Squads" component={SquadsScreen} />
      <Tab.Screen name="Fixtures" component={FixturesScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Leaders" component={LeadersScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="History" component={ClubHistoryScreen} options={{ title: 'History' }} />
    </Tab.Navigator>
  );
}
