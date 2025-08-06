// navigation/RoleBasedNavigation.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import UserStack from './UserStack';
import AdminStack from './AdminStack';
import SuperAdminStack from './SuperAdminStack';

const Stack = createStackNavigator();

export const RoleBasedNavigator = () => { // Removed `navigation` prop
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          // This case should ideally not be hit as App.js guards against it
          console.log('No authenticated user found');
          setLoading(false);
          return;
        }

        console.log('Fetching user document for:', currentUser.uid);
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const role = userData?.role || 'user';
          console.log('User document found with role:', role);
          setUserRole(role);
        } else {
          // This case should now be handled by otpVerification.js
          // If it is hit, it means a new user was somehow not redirected.
          console.log('User document not found on mount. Unexpected behavior.');
          setUserRole('user'); // Default to user to prevent a crash
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // On error, a user might be stuck, but this is a rare case
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []); // Changed dependency array to an empty array

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  // User exists - show appropriate stack based on role
  let MainComponent;
  switch (userRole) {
    case 'superadmin':
      MainComponent = SuperAdminStack;
      break;
    case 'admin':
      MainComponent = AdminStack;
      break;
    default:
      MainComponent = UserStack;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainComponent} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});