// screens/AuthScreens/signUp.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar, Alert, Platform, Modal
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
// REMOVE: import { useNavigation } from '@react-navigation/native'; // No longer needed here

// Mock data for states and constituencies (unchanged)
const statesData = {
  "Select State": [],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nalgonda", "Khammam"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  // Add more states and constituencies as needed
};

const SignupScreen = ({ route,navigation }) => {
  const { uid, fullPhone } = route.params;
  // REMOVE: const navigation = useNavigation(); // No longer needed here

  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: '',
    gender: '',
    age: '',
    weight: '',
    healthIssues: '',
    state: '',
    constituency: '',
    lastDonationDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showConstituencyPicker, setShowConstituencyPicker] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.lastDonationDate;
    setShowDatePicker(Platform.OS === 'ios');
    updateField('lastDonationDate', currentDate);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood Group is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || parseInt(formData.age) < 18 || parseInt(formData.age) > 65) {
      newErrors.age = 'Age must be between 18 and 65';
    }

    if (!formData.weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(formData.weight) || parseFloat(formData.weight) < 45 || parseFloat(formData.weight) > 150) {
      newErrors.weight = 'Weight must be between 45 kg and 150 kg';
    }

    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.constituency) newErrors.constituency = 'Constituency is required';

    if (!formData.lastDonationDate) {
      newErrors.lastDonationDate = 'Last Donation Date is required';
    } else {
      const today = new Date();
      const donationDate = new Date(formData.lastDonationDate);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(today.getDate() - 90);
      if (donationDate > today) {
        newErrors.lastDonationDate = 'Donation date cannot be in the future';
      } else if (donationDate > ninetyDaysAgo) {
        newErrors.lastDonationDate = 'Last donation must be at least 3 months ago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await firestore().collection('users').doc(uid).set({
        phone: fullPhone,
        name: formData.name.trim(),
        bloodGroup: formData.bloodGroup,
        gender: formData.gender,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        healthIssues: formData.healthIssues.trim() || 'None',
        state: formData.state,
        constituency: formData.constituency,
        lastDonationDate: firestore.Timestamp.fromDate(formData.lastDonationDate),
        role: 'user',
        isAvailableToDonate: true,
        donationHistory: [],
        requestHistory: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        profileComplete: true, // This is the flag that App.js will listen for
      });

      // Alert.alert(
      //   'Welcome to BloodConnect!',
      //   'Your account has been created successfully. You can now save lives!',
      //   [{
      //     text: 'Continue',
      //     onPress: () => {
      //       // IMPORTANT: Do NOT add navigation.replace() here.
      //       // The App.js will detect the Firestore update and handle the navigation.
      //     }
      //   }]
      // );
      Alert.alert(
        'Welcome to BloodConnect!',
        'Your account has been created successfully. You can now save lives!',
        [{
          text: 'Continue',
          onPress: () => {
            // Manually reload app state by forcing navigation to RoleBasedNavigator
            // For this to work, use `navigation.replace`
            // So you need to get `navigation` prop from React Navigation
            navigation.replace('RoleBased');
          }
        }]
      );

    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', 'Failed to create your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableConstituencies = formData.state ? statesData[formData.state] : [];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="account-plus" size={50} color={THEME.primary} />
          </View>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>Help us create your donor profile to save lives</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholderTextColor="#999"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group *</Text>
            <View style={styles.bloodGroupContainer}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[styles.bloodGroupButton, formData.bloodGroup === group && styles.bloodGroupSelected]}
                  onPress={() => updateField('bloodGroup', group)}
                >
                  <Text style={[styles.bloodGroupText, formData.bloodGroup === group && styles.bloodGroupTextSelected]}>{group}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              {genders.map((genderOption) => (
                <TouchableOpacity
                  key={genderOption}
                  style={[styles.genderButton, formData.gender === genderOption && styles.genderSelected]}
                  onPress={() => updateField('gender', genderOption)}
                >
                  <Text style={[styles.genderText, formData.gender === genderOption && styles.genderTextSelected]}>{genderOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <View style={styles.inputContainer}>
              <Icon name="calendar" size={20} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your age (18-65)"
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <View style={styles.inputContainer}>
              <Icon name="weight-kilogram" size={20} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your weight in kg (e.g., 65)"
                value={formData.weight}
                onChangeText={(value) => updateField('weight', value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowStatePicker(true)}>
              <Text style={formData.state ? styles.selectText : styles.selectPlaceholder}>
                {formData.state || "Select State"}
              </Text>
              <Icon name="chevron-down" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
            {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            <Modal transparent={true} visible={showStatePicker} onRequestClose={() => setShowStatePicker(false)} animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatePicker(false)}>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScrollView}>
                    {Object.keys(statesData).filter(state => state !== "Select State").map((state) => (
                      <TouchableOpacity key={state} style={styles.pickerItem} onPress={() => { updateField('state', state); updateField('constituency', ''); setShowStatePicker(false); }}>
                        <Text style={styles.pickerItemText}>{state}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Constituency *</Text>
            <TouchableOpacity
              style={[styles.selectInput, !formData.state && styles.selectInputDisabled]}
              onPress={() => formData.state && setShowConstituencyPicker(true)}
              disabled={!formData.state}>
              <Text style={formData.constituency ? styles.selectText : styles.selectPlaceholder}>
                {formData.constituency || "Select Constituency"}
              </Text>
              <Icon name="chevron-down" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
            {errors.constituency && <Text style={styles.errorText}>{errors.constituency}</Text>}
            <Modal transparent={true} visible={showConstituencyPicker} onRequestClose={() => setShowConstituencyPicker(false)} animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConstituencyPicker(false)}>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScrollView}>
                    {availableConstituencies.length > 0 ? (
                      availableConstituencies.map((constituency) => (
                        <TouchableOpacity key={constituency} style={styles.pickerItem} onPress={() => { updateField('constituency', constituency); setShowConstituencyPicker(false); }}>
                          <Text style={styles.pickerItemText}>{constituency}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.pickerNoOptionsText}>Select a state first</Text>
                    )}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Donation Date *</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)}>
              <Text style={formData.lastDonationDate ? formData.lastDonationDate.toLocaleDateString() : 'Select Date'}>
                {formData.lastDonationDate ? formData.lastDonationDate.toLocaleDateString() : 'Select Date'}
              </Text>
              <Icon name="calendar-month" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
            {errors.lastDonationDate && <Text style={styles.errorText}>{errors.lastDonationDate}</Text>}
            {showDatePicker && (
              <DateTimePicker
                testID="datePicker"
                value={formData.lastDonationDate || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Any Health Issues? (Optional)</Text>
            <View style={styles.inputContainer}>
              <Icon name="heart-pulse" size={20} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Diabetes, High Blood Pressure"
                value={formData.healthIssues}
                onChangeText={(value) => updateField('healthIssues', value)}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="heart" size={20} color="#fff" />
                <Text style={styles.buttonText}>Join BloodConnect</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Icon name="information" size={24} color={THEME.primary} />
            <Text style={styles.infoText}>
              By joining, you can both request blood when needed and help others by donating blood. Every donation can save up to 3 lives!
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default SignupScreen;

const THEME = {
  primary: '#DC2626',
  primaryLight: '#FEE2E2',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#B91C1C',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, },
  header: { backgroundColor: THEME.surface, paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16, },
  title: { fontSize: 28, fontWeight: '700', color: THEME.text, marginBottom: 8, },
  subtitle: { fontSize: 16, color: THEME.textSecondary, textAlign: 'center', lineHeight: 24, },
  content: { padding: 24, },
  inputGroup: { marginBottom: 20, },
  label: { fontSize: 16, fontWeight: '600', color: THEME.text, marginBottom: 8, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  input: { flex: 1, fontSize: 16, color: THEME.text, marginLeft: 12, paddingVertical: 4, },
  bloodGroupContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, },
  bloodGroupButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: THEME.surface, borderWidth: 2, borderColor: '#E5E7EB', minWidth: 60, alignItems: 'center', },
  bloodGroupSelected: { backgroundColor: THEME.primaryLight, borderColor: THEME.primary, },
  bloodGroupText: { fontSize: 16, fontWeight: '600', color: THEME.textSecondary, },
  bloodGroupTextSelected: { color: THEME.primary, },
  genderContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, },
  genderButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: THEME.surface, borderWidth: 2, borderColor: '#E5E7EB', minWidth: 80, alignItems: 'center', },
  genderSelected: { backgroundColor: THEME.primaryLight, borderColor: THEME.primary, },
  genderText: { fontSize: 16, fontWeight: '600', color: THEME.textSecondary, },
  genderTextSelected: { color: THEME.primary, },
  errorText: { color: THEME.error, fontSize: 14, marginTop: 4, },
  signupButton: { flexDirection: 'row', backgroundColor: THEME.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, },
  buttonDisabled: { backgroundColor: '#FCA5A5', },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 8, },
  infoCard: { flexDirection: 'row', backgroundColor: THEME.primaryLight, padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'flex-start', },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: THEME.text, lineHeight: 20, },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderWidth: 1, borderColor: '#E5E7EB', },
  selectInputDisabled: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', },
  selectText: { fontSize: 16, color: THEME.text, flex: 1, },
  selectPlaceholder: { fontSize: 16, color: '#999', flex: 1, },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
  pickerContainer: { backgroundColor: THEME.surface, borderRadius: 12, width: '85%', maxHeight: '60%', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
  pickerScrollView: { paddingVertical: 10, },
  pickerItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', },
  pickerItemText: { fontSize: 16, color: THEME.text, },
  pickerNoOptionsText: { padding: 20, textAlign: 'center', color: THEME.textSecondary, fontSize: 16, },
});
