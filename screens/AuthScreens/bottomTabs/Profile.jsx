import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';

// React Native Firebase v6+
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const THEME = {
  primary: '#D90429',
  onPrimary: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  subtle: '#F2F4F8',
  border: '#EAECEF',
  black: '#111827',
  green: '#10B981',
};

export default function Profile({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState({}); // { [key]: true }

  // Effect to handle user authentication state and fetch data
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their profile from Firestore
        try {
          setError('');
          const userDocument = await firestore()
            .collection('users')
            .doc(user.uid)
            .get();

          if (userDocument.exists) {
            setData({ id: userDocument.id, ...userDocument.data() });
          } else {
            setError('User profile not found.');
            setData(null);
          }
        } catch (e) {
          console.error(e);
          setError('Failed to load profile.');
          setData(null);
        }
      } else {
        // User is signed out, clear data and navigate to Login
        setData(null);
        navigation?.replace('Login');
      }
      if (loading) setLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return subscriber;
  }, [navigation, loading]);

  const startEdit = (key) => setEditing((e) => ({ ...e, [key]: true }));
  const cancelEdit = (key) => setEditing((e) => ({ ...e, [key]: false }));

  const saveField = async (key, value, transform) => {
    // Use auth().currentUser to ensure we act on the logged-in user
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Authentication Error', 'You must be logged in to save changes.');
      return;
    }

    try {
      setSavingKey(key);
      const userDocRef = firestore().collection('users').doc(currentUser.uid);
      const transformedValue = transform ? transform(value) : value;

      await userDocRef.update({
        [key]: transformedValue,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setData((d) => ({ ...d, [key]: transformedValue }));
      setEditing((e) => ({ ...e, [key]: false }));
    } catch (e) {
      Alert.alert('Update failed', e?.message || 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleAvailability = async () => {
    if (!data) return;
    await saveField('isAvailableToDonate', !data.isAvailableToDonate);
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      // The onAuthStateChanged listener will handle navigation
    } catch (e) {
      Alert.alert('Logout failed', e?.message || 'Please try again.');
    }
  };
  
  // --- Field Component and Render Logic ---
  // This part remains the same as it correctly uses the component's state.
  // Minor changes are made to the main render return for clarity.

  const Field = ({ label, keyName, type = 'text', placeholder = '', keyboardType = 'default', toDisplay }) => {
    const isEditing = !!editing[keyName];
    const value = data?.[keyName];

    const [temp, setTemp] = useState(
      value === undefined || value === null ? '' : String(value)
    );

    useEffect(() => {
      if (!isEditing) {
        setTemp(
          value === undefined || value === null ? '' : String(value)
        );
      }
    }, [isEditing, value]);

    const displayValue = toDisplay ? toDisplay(value) : (
      value === undefined || value === null ? '' : String(value)
    );

    const transform = (raw) => {
      if (type === 'number') return Number(raw || 0);
      if (type === 'boolean') return Boolean(raw);
      return raw?.trim?.() ?? raw;
    };

    return (
      <View style={styles.rowCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          {!isEditing ? (
            <Text style={styles.value}>{displayValue || '-'}</Text>
          ) : (
            <TextInput
              value={temp}
              onChangeText={setTemp}
              placeholder={placeholder}
              placeholderTextColor={THEME.muted + '99'}
              style={styles.input}
              keyboardType={keyboardType}
              autoFocus
            />
          )}
        </View>
        {!isEditing ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(keyName)}>
            <Text style={styles.icon}>✏️</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.ghost]}
              onPress={() => cancelEdit(keyName)}
            >
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, styles.save]}
              onPress={() => saveField(keyName, temp, transform)}
              disabled={savingKey === keyName}
            >
              <Text style={styles.saveText}>{savingKey === keyName ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header onLogout={handleLogout} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={THEME.primary} size="large"/>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.availability}>
            <Text style={styles.availText}>Available to Donate</Text>
            <TouchableOpacity
              style={[styles.toggle, data.isAvailableToDonate && styles.toggleOn]}
              onPress={toggleAvailability}
              activeOpacity={0.9}
            >
              <View style={[styles.knob, data.isAvailableToDonate && styles.knobOn]} />
            </TouchableOpacity>
          </View>

          <Field label="Name" keyName="name" placeholder="Enter your name" />
          <Field label="Phone" keyName="phone" placeholder="+91…" keyboardType="phone-pad" />
          <Field label="Age" keyName="age" type="number" placeholder="Enter age" keyboardType="number-pad" />
          <Field label="Weight (kg)" keyName="weight" type="number" placeholder="Enter weight" keyboardType="number-pad" />
          <Field label="Gender" keyName="gender" placeholder="Male / Female / Other" />
          <Field label="Blood Group" keyName="bloodGroup" placeholder="A+, O-, etc." />
          <Field label="State" keyName="state" placeholder="Your state" />
          <Field label="Constituency" keyName="constituency" placeholder="Your city/area" />
          <Field label="Health Issues" keyName="healthIssues" placeholder="e.g., None" />
          <Field
            label="Last Donation Date"
            keyName="lastDonationDate"
            placeholder="YYYY-MM-DD"
            toDisplay={(v) => formatDate(v)}
          />

          <Item label="Role" value={String(data.role || 'user')} />
          <Item label="Profile Complete" value={String(!!data.profileComplete)} />
          <Item label="Created At" value={formatDate(data.createdAt)} />
          <Item label="Updated At" value={formatDate(data.updatedAt)} />
          <Item label="Donations" value={`${(data.donationHistory || []).length}`} />
          <Item label="Requests" value={`${(data.requestHistory || []).length}`} />

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

/* --- Helpers and small UI pieces --- */
const Header = ({ onLogout }) => (
  <View style={styles.header}>
    <View style={styles.logo}><View style={styles.logoDot} /></View>
    <Text style={styles.brand}>BloodBank</Text>
    <View style={{ flex: 1 }} />
    <TouchableOpacity style={styles.logout} onPress={onLogout}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

function formatDate(v) {
  try {
    if (!v) return '-';
    // Both web and RNF Firestore timestamps have a toDate() method
    if (v.toDate) return v.toDate().toLocaleDateString();
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  } catch {
    return String(v || '-');
  }
}

function Item({ label, value }) {
  return (
    <View style={styles.rowCardSmall}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '-'}</Text>
    </View>
  );
}

// --- Styles --- (Unchanged)
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 10,
    borderBottomWidth: 1, borderBottomColor: THEME.border,
  },
  logo: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFFAA' },
  brand: { fontSize: 18, fontWeight: '800', color: THEME.text },
  logout: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, height: 36,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { color: THEME.black, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: THEME.muted, fontSize: 16 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: THEME.primary, textAlign: 'center', marginBottom: 12, fontSize: 16 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  availability: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.surface, padding: 14, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  availText: { color: THEME.text, fontWeight: '800', flex: 1, fontSize: 16 },
  toggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: THEME.green },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', transform: [{ translateX: 0 }] },
  knobOn: { transform: [{ translateX: 24 }] },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.surface, borderRadius: 16,
    padding: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 1, marginTop: 6,
  },
  rowCardSmall: {
    backgroundColor: THEME.surface, borderRadius: 16, padding: 14, shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1, marginTop: 6,
  },
  label: { color: THEME.muted, fontWeight: '700', marginBottom: 4 },
  value: { color: THEME.text, fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: THEME.subtle, borderRadius: 10, paddingHorizontal: 12, height: 42,
    color: THEME.text, fontSize: 16, fontWeight: '700',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: THEME.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  editActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallBtn: { height: 40, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: '#F3F4F6' },
  ghostText: { color: THEME.black, fontWeight: '800' },
  save: { backgroundColor: THEME.primary },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
});