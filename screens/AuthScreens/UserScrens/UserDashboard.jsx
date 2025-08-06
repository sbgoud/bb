import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // Import auth

const emergencyRequests = [
  {
    id: '1',
    bloodGroup: 'A+',
    name: 'Rahul Singh',
    location: 'Apollo Hospital',
    time: 'Now',
    type: 'Emergency',
    distance: '2.1 km'
  },
  {
    id: '2',
    bloodGroup: 'O-',
    name: 'Dr. Priya Sharma',
    location: 'Yashoda Hospital',
    time: '10 min',
    type: 'Urgent',
    distance: '3.5 km'
  },
  {
    id: '3',
    bloodGroup: 'B+',
    name: 'Anita Kumar',
    location: 'KIMS Hospital',
    time: '5 min',
    type: 'Emergency',
    distance: '1.8 km'
  },
  {
    id: '4',
    bloodGroup: 'AB-',
    name: 'Ramesh Patel',
    location: 'Global Hospital',
    time: '20 min',
    type: 'Urgent',
    distance: '4.2 km'
  },
];

const DashboardScreen = ({ navigation }) => { // Removed 'user' prop
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.error("No authenticated user found for DashboardScreen.");
      setLoading(false);
      // Optionally navigate away if no user is found, though App.js should handle this
      return;
    }

    // Set up a real-time listener for the user's document
    const userDocRef = firestore().collection('users').doc(currentUser.uid);
    const unsubscribe = userDocRef.onSnapshot(docSnapshot => {
      if (docSnapshot.exists) {
        setUserData(docSnapshot.data());
      } else {
        // Handle case where user document might not exist (e.g., deleted)
        console.warn("User document does not exist for UID:", currentUser.uid);
        setUserData(null); // Clear user data if document is gone
      }
      setLoading(false); // Data fetched (or determined not to exist)
    }, error => {
      console.error("Error fetching user data:", error);
      setLoading(false); // Stop loading even on error
      setUserData(null); // Clear user data on error
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const userName = userData?.name || "User"; // Use fetched userData.name
  const userBloodGroup = userData?.bloodGroup || "N/A";
  // You'll need to calculate 'Days Until Eligible' based on 'lastDonationDate'
  // For now, it remains static or you can implement the calculation.
  const daysUntilEligible = userData?.lastDonationDate ? 
    Math.max(0, 90 - Math.floor((new Date().getTime() - userData.lastDonationDate.toDate().getTime()) / (1000 * 60 * 60 * 24)))
    : "N/A";


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // If userData is null after loading, it means the document didn't exist or there was an error.
  // You might want to show a more specific message or redirect.
  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load user profile.</Text>
        <Text style={styles.errorSubText}>Please try again or contact support.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Cards */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.donateCard]}
            onPress={() => navigation.navigate('DonateFormScreen')} // Ensure this screen exists in your navigator
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <Text style={styles.actionTitle}>Donate Blood</Text>
              <Text style={styles.actionDescription}>Help save lives in your community</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.findCard]}
            onPress={() => navigation.navigate('RequestFormScreen')} // Ensure this screen exists in your navigator
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <Text style={styles.actionTitle}>Find Donors</Text>
              <Text style={styles.actionDescription}>Search for blood donors near you</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>156</Text> {/* This is static, consider fetching from Firestore if dynamic */}
              <Text style={styles.statLabel}>Lives Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userBloodGroup}</Text>
              <Text style={styles.statLabel}>Your Blood Type</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{daysUntilEligible}</Text>
              <Text style={styles.statLabel}>Days Until Eligible</Text>
            </View>
          </View>
        </View>

        {/* Urgent Requests Section */}
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Urgent Requests</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('Request')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.requestsList}>
            {emergencyRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => navigation.navigate('RequestDetail', { id: request.id })} // Ensure 'RequestDetail' screen exists
                activeOpacity={0.95}
              >
                <View style={styles.requestLeft}>
                  <View style={[
                    styles.bloodTypeBadge,
                    { backgroundColor: request.bloodGroup.includes('O') ? '#fee2e2' : '#dbeafe' }
                  ]}>
                    <Text style={[
                      styles.bloodTypeText,
                      { color: request.bloodGroup.includes('O') ? '#dc2626' : '#2563eb' }
                    ]}>
                      {request.bloodGroup}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestCenter}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.patientName}>{request.name}</Text>
                    <View style={[
                      styles.urgencyBadge,
                      { backgroundColor: request.type === 'Emergency' ? '#fecaca' : '#fed7aa' }
                    ]}>
                      <Text style={[
                        styles.urgencyText,
                        { color: request.type === 'Emergency' ? '#b91c1c' : '#c2410c' }
                      ]}>
                        {request.type}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.hospitalName}>{request.location}</Text>

                  <View style={styles.requestMeta}>
                    <Text style={styles.timeText}>{request.time} ago</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.distanceText}>{request.distance} away</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.contactButton}>
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },

  headerContent: {
    flex: 1,
  },

  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
    marginBottom: 4,
  },

  userName: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 32,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitial: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Action Cards
  actionGrid: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },

  actionCard: {
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
    justifyContent: 'center',
  },

  donateCard: {
    backgroundColor: '#ef4444',
  },

  findCard: {
    backgroundColor: '#3b82f6',
  },

  cardContent: {
    alignItems: 'flex-start',
  },

  actionTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
  },

  actionDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    gap: 24,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Requests Section
  requestsSection: {
    paddingHorizontal: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '700',
  },

  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },

  requestsList: {
    gap: 12,
  },

  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  requestLeft: {
    marginRight: 16,
  },

  bloodTypeBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bloodTypeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  requestCenter: {
    flex: 1,
    marginRight: 16,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  patientName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },

  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  hospitalName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 6,
  },

  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },

  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 8,
  },

  distanceText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },

  contactButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  contactButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#B91C1C',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
