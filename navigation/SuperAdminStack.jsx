// src/navigation/SuperAdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import UserDashboard from '../screens/AuthScreens/UserScrens/UserDashboard';
// … import other superadmin screens

const Stack = createStackNavigator();

const SuperAdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="SuperAdminDashboard" component={UserDashboard} />
    {/* other superadmin screens */}
  </Stack.Navigator>
);

export default SuperAdminStack;
