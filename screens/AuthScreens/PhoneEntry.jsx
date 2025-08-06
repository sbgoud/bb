import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { UI } from '../../src/theme/uiTheme';

export const PhoneEntryScreen = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinue = async () => {
    setError('');
    if (!/^[0-9]{6,15}$/.test(phone)) {
      setError('Please enter a valid phone number.');
      return;
    }
    
    setLoading(true);
    try {
      const fullPhone = `+${callingCode}${phone}`;
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      navigation.navigate('OTPVerification', { 
        confirmation, 
        fullPhone 
      });
    } catch (e) {
      setError('Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={UI.colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="water" size={50} color={UI.colors.accent} />
          </View>
          <Text style={styles.title}>BloodConnect</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to save lives
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <CountryPicker
              countryCode={countryCode}
              withCallingCode
              withFilter
              withFlag
              onSelect={({ cca2, callingCode }) => {
                setCountryCode(cca2);
                setCallingCode(callingCode[0]);
              }}
              containerButtonStyle={styles.flagButton}
            />
            <Text style={styles.callingCode}>+{callingCode}</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={UI.colors.muted + '99'}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={onContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="phone" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to help save lives and our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.colors.bg,
  },
  header: {
    backgroundColor: UI.colors.surface,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...UI.shadow.sm,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: UI.colors.accent,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: UI.colors.muted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: UI.colors.border,
    ...UI.shadow.sm,
  },
  flagButton: {
    marginRight: 12,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.colors.text,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: UI.colors.text,
    paddingVertical: 8,
  },
  errorText: {
    color: '#B91C1C',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: UI.colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    ...UI.shadow.md,
  },
  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footerText: {
    color: UI.colors.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  link: {
    color: UI.colors.accent,
    fontWeight: '700',
  },
});

export default PhoneEntryScreen;