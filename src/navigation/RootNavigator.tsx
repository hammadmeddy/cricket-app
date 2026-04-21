import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import type { RootTabParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import SquadsScreen from '../screens/SquadsScreen';
import FixturesScreen from '../screens/FixturesScreen';
import LiveScreen from '../screens/LiveScreen';
import LeadersScreen from '../screens/LeadersScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

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

function tabIcon(label: string) {
  return function Icon() {
    return (
      <Text style={{ fontSize: 18 }} accessibilityElementsHidden>
        {label}
      </Text>
    );
  };
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarIcon: tabIcon('◆') }}
        />
        <Tab.Screen
          name="Squads"
          component={SquadsScreen}
          options={{ tabBarIcon: tabIcon('◎') }}
        />
        <Tab.Screen
          name="Fixtures"
          component={FixturesScreen}
          options={{ tabBarIcon: tabIcon('📅') }}
        />
        <Tab.Screen
          name="Live"
          component={LiveScreen}
          options={{ tabBarIcon: tabIcon('▶') }}
        />
        <Tab.Screen
          name="Leaders"
          component={LeadersScreen}
          options={{ title: 'Stats', tabBarIcon: tabIcon('★') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
