// navigation/AuthNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PhoneEntryScreen } from '../screens/AuthScreens/PhoneEntry';
import OTPVerificationScreen from '../screens/AuthScreens/otpVerification';
import SignupScreen from '../screens/AuthScreens/signUp';

const Stack = createStackNavigator();

export const AuthNavigator = () => (
  <Stack.Navigator
    initialRouteName="PhoneEntry"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);
