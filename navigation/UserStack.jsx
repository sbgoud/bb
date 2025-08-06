import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import DashboardScreen from '../screens/AuthScreens/bottomTabs/RequestScreen';
import ProfileScreen from '../screens/AuthScreens/bottomTabs/Profile';
import CreatePostScreen from '../screens/AuthScreens/UserScrens/createRequest';
import UserRequestsScreen from '../screens/AuthScreens/UserScrens/userRequests';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ACCENT = '#4F46E5';
const INACTIVE = '#777';

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Request" component={DashboardScreen} />
    <Stack.Screen name="CreatePost" component={CreatePostScreen} />
  </Stack.Navigator>
);

// Posts Stack (renamed from Request)
const PostsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserRequests" component={UserRequestsScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const UserStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color }) => {
        let iconName;
        let accessibilityLabel;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
          accessibilityLabel = 'Home tab';
        } else if (route.name === 'Posts') {
          iconName = focused ? 'plus-box' : 'plus-box-outline';
          accessibilityLabel = 'Posts tab';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'account-circle' : 'account-circle-outline';
          accessibilityLabel = 'Profile tab';
        }

        return (
          <Icon
            name={iconName}
            size={26} // slightly larger for readability
            color={color}
            accessibilityLabel={accessibilityLabel}
            accessible
          />
        );
      },
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: INACTIVE,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeStack}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Posts" 
      component={PostsStack}
      options={{ tabBarLabel: 'Posts' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export default UserStack;