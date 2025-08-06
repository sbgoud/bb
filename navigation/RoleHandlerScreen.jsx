// src/screens/RoleHandlerScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const RoleHandlerScreen = ({ route, navigation }) => {
  const { uid } = route.params;

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const doc = await firestore().collection('users').doc(uid).get();
        
        if (doc.exists) {
          // Existing user - get their role and navigate to dashboard
          const userData = doc.data();
          const role = userData?.role || 'user';
          console.log('Existing user found with role:', role);
          
          navigation.reset({
            index: 0,
            routes: [{ name: 'RoleBased', params: { role } }],
          });
        } else {
          // New user - no document exists, navigate to signup
          console.log('New user - navigating to signup');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Signup', params: { uid } }],
          });
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Sign out user on error
        await auth().signOut();
      }
    };

    fetchRole();
  }, [uid, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
};

export default RoleHandlerScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
});
