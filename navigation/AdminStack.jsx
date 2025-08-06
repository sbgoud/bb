// src/navigation/AdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserDashboard from '../screens/AuthScreens/UserScrens/UserDashboard';
// import AdminDashboard from '../screens/AdminDashboard';
// … import other admin screens

const Stack = createStackNavigator();

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={UserDashboard} />
    {/* other admin screens */}
  </Stack.Navigator>
);

export default AdminStack;
