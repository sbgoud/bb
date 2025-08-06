import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // Import for loading indicator

import { AuthNavigator } from './navigation/AuthNavigator';
import { RoleBasedNavigator } from './navigation/RoleBasedNavigation';
import SignupScreen from './screens/AuthScreens/signUp';

const RootStack = createStackNavigator();

export default function App() {
  const [loadingAuth, setLoadingAuth] = useState(true); // New state to track initial auth loading
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileCompleteStatus, setProfileCompleteStatus] = useState(false);

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(authUser => {
      setUser(authUser);
      setLoadingAuth(false); // Auth state has been determined
    });

    return unsubscribeAuth; // Unsubscribe on component unmount
  }, []);

  // Effect to listen for Firestore user document changes (only if user is logged in)
  useEffect(() => {
    let unsubscribeFirestore = () => {}; // Initialize as a no-op function

    if (user) {
      // Listen for real-time updates to the user document
      unsubscribeFirestore = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(docSnapshot => {
          if (docSnapshot.exists) {
            const userData = docSnapshot.data();
            const completed = userData?.profileComplete === true;
            setProfileCompleteStatus(completed);
            setIsNewUser(!completed); // Update isNewUser based on the real-time status
          } else {
            // User document doesn't exist, so they are definitely a new user
            setProfileCompleteStatus(false);
            setIsNewUser(true);
          }
        }, error => {
          console.error("Error listening to user document:", error);
          // Fallback in case of Firestore error, treat as new user to prompt profile creation
          setProfileCompleteStatus(false);
          setIsNewUser(true);
        });
    } else {
      // If no user, ensure profile completion states are reset
      setProfileCompleteStatus(false);
      setIsNewUser(false);
    }

    // Cleanup the Firestore listener when the component unmounts or user changes
    return () => unsubscribeFirestore();
  }, [user]); // Re-run this effect whenever the 'user' object changes

  // Show a loading indicator until authentication state is known
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // No user logged in, show authentication flow
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : isNewUser ? (
          // User logged in but profile is not complete, show signup screen
          <RootStack.Screen
            name="Signup"
            component={SignupScreen}
            initialParams={{ uid: user.uid, fullPhone: user.phoneNumber }}
          />
        ) : (
          // User logged in and profile is complete, show role-based navigation
          <RootStack.Screen name="RoleBased" component={RoleBasedNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
