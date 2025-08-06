import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UI } from '../../../src/theme/uiTheme';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const URGENCY = ['normal', 'soon', 'urgent', 'critical'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function CreatePostScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState('donor');

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [constituency, setConstituency] = useState('');
  const [area, setArea] = useState('');
  const [hospital, setHospital] = useState('');
  const [prevDonationDate, setPrevDonationDate] = useState('');
  const [donationHistory, setDonationHistory] = useState('');
  const [availableToDonate, setAvailableToDonate] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [purpose, setPurpose] = useState('');
  const [urgency, setUrgency] = useState('');
  const [patientDetails, setPatientDetails] = useState('');
  const [disease, setDisease] = useState('');

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        navigation?.replace?.('Login');
      }
    });
    return subscriber;
  }, [navigation]);

  const canSubmit = useMemo(() => {
    if (!uid || !bloodGroup || !phone || !stateName || !district) return false;
    if (postType === 'receiver' && (!name || !urgency)) return false;
    return true;
  }, [uid, postType, name, bloodGroup, phone, stateName, district, urgency]);

  const resetForm = () => {
    setName('');
    setGender('');
    setBloodGroup('');
    setPhone('');
    setWhatsapp('');
    setDescription('');
    setStateName('');
    setDistrict('');
    setMunicipality('');
    setConstituency('');
    setArea('');
    setHospital('');
    setPrevDonationDate('');
    setDonationHistory('');
    setAvailableToDonate(true);
    setMedicalHistory('');
    setPurpose('');
    setUrgency('');
    setPatientDetails('');
    setDisease('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Missing details', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    await firestore().collection('requests').add({
      type: postType,
      userId: uid,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      name: (name || '').trim(),
      gender,
      bloodGroup,
      state: stateName,
      district,
      municipality,
      constituency,
      area,
      hospital,
      description,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      prevDonationDate: postType === 'donor' ? (prevDonationDate || null) : null,
      donationHistory: postType === 'donor' ? (donationHistory || null) : null,
      availableToDonate: postType === 'donor' ? !!availableToDonate : null,
      medicalHistory: postType === 'donor' ? (medicalHistory || null) : null,
      purpose: postType === 'receiver' ? (purpose || null) : null,
      urgency: postType === 'receiver' ? (urgency || null) : null,
      patientDetails: postType === 'receiver' ? (patientDetails || null) : null,
      disease: postType === 'receiver' ? (disease || null) : null,
      searchKeys: [
        bloodGroup, stateName, district, municipality, constituency, area, hospital,
        postType === 'receiver' ? urgency : '',
      ].filter(Boolean).map((s) => String(s).toLowerCase().trim()),
    });
    Alert.alert('Success', 'Your post has been created.');
    resetForm();
    setLoading(false);
    navigation?.goBack?.();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.iconCircle}><Text style={styles.iconText}>🩸</Text></View>
        <Text style={styles.brand}>Create Post</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={[styles.postBtn, (!canSubmit || loading) && { opacity: 0.6 }]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, postType === 'donor' && styles.segmentActive]}
            onPress={() => setPostType('donor')}
            activeOpacity={0.9}
          >
            <Text style={[styles.segmentText, postType === 'donor' && styles.segmentTextActive]}>I can DONATE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, postType === 'receiver' && styles.segmentActive]}
            onPress={() => setPostType('receiver')}
            activeOpacity={0.9}
          >
            <Text style={[styles.segmentText, postType === 'receiver' && styles.segmentTextActive]}>I NEED blood</Text>
          </TouchableOpacity>
        </View>

        <Group title="Essentials">
          {postType === 'receiver' && (
            <Input label="Name" value={name} onChangeText={setName} placeholder="Patient or requester name" />
          )}
          <Pills label="Blood Group" value={bloodGroup} onSelect={setBloodGroup} options={BLOOD_GROUPS} />
          <Pills label="Gender" value={gender} onSelect={setGender} options={GENDERS} />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91…" />
          <Input label="WhatsApp (optional)" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="If different from phone" />
        </Group>

        <Group title="Location">
          <Input label="State" value={stateName} onChangeText={setStateName} />
          <Input label="District" value={district} onChangeText={setDistrict} />
          <Input label="Municipality" value={municipality} onChangeText={setMunicipality} placeholder="City/Town/Municipality" />
          <Input label="Constituency" value={constituency} onChangeText={setConstituency} />
          <Input label="Area / Locality" value={area} onChangeText={setArea} />
          <Input label="Hospital (optional)" value={hospital} onChangeText={setHospital} />
        </Group>

        {postType === 'donor' && (
          <Group title="Donor Details">
            <Input label="Previous Donation Date" value={prevDonationDate} onChangeText={setPrevDonationDate} placeholder="YYYY-MM-DD" />
            <Input label="Donation History" value={donationHistory} onChangeText={setDonationHistory} placeholder="e.g., 3 donations, last 2024-08-04" multiline />
            <ToggleRow label="Available to Donate" value={availableToDonate} onToggle={() => setAvailableToDonate((v) => !v)} />
            <Input label="Medical History" value={medicalHistory} onChangeText={setMedicalHistory} placeholder="e.g., None" multiline />
            <Input label="Description" value={description} onChangeText={setDescription} placeholder="Additional notes" multiline />
          </Group>
        )}

        {postType === 'receiver' && (
          <Group title="Receiver Details">
            <Pills label="Urgency" value={urgency} onSelect={setUrgency} options={URGENCY.map((u) => u[0].toUpperCase() + u.slice(1))} mapBack={(s) => s.toLowerCase()} />
            <Input label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Surgery / Accident / Transfusion…" />
            <Input label="Patient Details" value={patientDetails} onChangeText={setPatientDetails} placeholder="Age, ward/bed, MRN if applicable" multiline />
            <Input label="Disease / Condition" value={disease} onChangeText={setDisease} placeholder="e.g., Thalassemia" />
            <Input label="Description" value={description} onChangeText={setDescription} placeholder="Additional context" multiline />
          </Group>
        )}

        <Group title="Visibility & Safety">
          <Hint text="We will show your phone number so people can reach you." />
          <Hint text="Avoid sharing sensitive personal details in public fields." />
        </Group>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}
function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={UI.colors.muted + '99'}
        style={[styles.input, multiline && styles.textarea]}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
function Pills({ label, value, onSelect, options, mapBack }) {
  const normalizedValue = value || '';
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pillsRow}>
        {options.map((opt) => {
          const key = mapBack ? mapBack(opt) : opt;
          const selected = normalizedValue === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.pill, selected && styles.pillActive]}
              onPress={() => onSelect(key)}
              activeOpacity={0.9}
            >
              <Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
function ToggleRow({ label, value, onToggle }) {
  return (
    <View style={[styles.field, styles.toggleRow]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggle, value && styles.toggleOn]}
        onPress={onToggle}
        activeOpacity={0.9}
      >
        <View style={[styles.knob, value && styles.knobOn]} />
      </TouchableOpacity>
    </View>
  );
}
function Hint({ text }) {
  return <Text style={styles.hint}>• {text}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 10,
    backgroundColor: UI.colors.surface, borderBottomColor: UI.colors.border, borderBottomWidth: 1,
  },
  iconCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: UI.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { color: '#fff', fontSize: 14 },
  brand: { fontSize: 18, fontWeight: '800', color: UI.colors.text },
  postBtn: {
    backgroundColor: UI.colors.accent, height: 36, paddingHorizontal: 14, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  postBtnText: { color: '#fff', fontWeight: '800' },

  content: { padding: 16, paddingBottom: 40 },

  segment: {
    flexDirection: 'row', backgroundColor: UI.colors.surface, borderRadius: 22, padding: 4,
    borderColor: UI.colors.border, borderWidth: 1,
    ...UI.shadow.sm,
    marginBottom: 12,
  },
  segmentItem: {
    flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  segmentActive: { backgroundColor: UI.colors.text },
  segmentText: { color: UI.colors.muted, fontWeight: '800', fontSize: 13 },
  segmentTextActive: { color: '#FFFFFF' },

  group: { marginBottom: 14 },
  groupTitle: { color: UI.colors.text, fontWeight: '800', marginBottom: 8, fontSize: 16, paddingHorizontal: 4 },
  card: {
    backgroundColor: UI.colors.surface, borderRadius: 16, padding: 12,
    borderColor: UI.colors.border, borderWidth: 1,
    ...UI.shadow.sm,
  },
  field: { marginBottom: 10, padding: 4 },
  label: { color: UI.colors.muted, fontWeight: '700', marginBottom: 8 },
  input: {
    height: 44, backgroundColor: '#F2F4F8', borderRadius: 12, paddingHorizontal: 12,
    color: UI.colors.text, fontSize: 14,
  },
  textarea: {
    height: 92, paddingTop: 10, textAlignVertical: 'top',
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 34, paddingHorizontal: 14, borderRadius: 18,
    backgroundColor: '#F2F4F8', alignItems: 'center', justifyContent: 'center',
  },
  pillActive: { backgroundColor: UI.colors.text },
  pillText: { color: UI.colors.text, fontWeight: '800', fontSize: 12 },
  pillTextActive: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, paddingBottom: 0 },
  toggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', padding: 3 },
  toggleOn: { backgroundColor: UI.colors.green },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', transform: [{ translateX: 0 }] },
  knobOn: { transform: [{ translateX: 24 }] },
  hint: { color: UI.colors.muted, marginTop: 4, fontSize: 12 },
});