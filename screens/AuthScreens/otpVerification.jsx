import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, StatusBar, Alert
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UI } from '../../src/theme/uiTheme';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { confirmation, fullPhone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const confirmRef = useRef(confirmation);
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const verifyCode = async () => {
    if (code.length < 6) {
      setError('Enter a valid 6-digit code');
      return;
    }

    if (!confirmRef.current) {
      setError('No OTP session available. Please resend OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await confirmRef.current.confirm(code);
      const currentUser = userCredential.user;
      if (!currentUser) throw new Error('Authentication failed');

      const uid = currentUser.uid;
      const userDocRef = firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      const userData = userDoc.data();
      const isExistingUser = userDoc.exists && userData?.profileComplete === true;

      if (!isExistingUser) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Signup',
                params: {
                  uid: uid,
                  fullPhone: currentUser.phoneNumber,
                },
              },
            ],
          })
        );
      } else {
        // App.js will handle RoleBased navigation via auth listener
      }
    } catch (error) {
      setError(getFriendlyError(error.code) || 'Verification failed. Please try again.');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setCode('');
    setError('');

    try {
      const newConfirmation = await auth().signInWithPhoneNumber(fullPhone);
      confirmRef.current = newConfirmation;
      startTimer();
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
    }

    setResendLoading(false);
  };

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-verification-code':
        return 'Incorrect OTP. Please try again.';
      case 'auth/code-expired':
        return 'OTP expired. Please resend.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/session-expired':
        return 'Session expired. Please resend OTP.';
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={UI.colors.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="shield-check" size={46} color={UI.colors.accent} />
          </View>
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{fullPhone}</Text>
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              textAlign="center"
              placeholderTextColor={UI.colors.muted + '99'}
              autoFocus
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={verifyCode}
            disabled={loading || code.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Verify & Continue</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color={UI.colors.accent} size="small" />
                ) : (
                  <>
                    <Icon name="refresh" size={16} color={UI.colors.accent} />
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.timerContainer}>
                <Icon name="timer-sand" size={16} color={UI.colors.muted} />
                <Text style={styles.timerText}>Resend in {timer}s</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

export default OTPVerificationScreen;

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
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: UI.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: UI.colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '700',
    color: UI.colors.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: UI.colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    fontSize: 22,
    letterSpacing: 8,
    color: UI.colors.text,
    ...UI.shadow.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#B91C1C',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: UI.colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.shadow.md,
  },
  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resendContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  resendText: {
    color: UI.colors.accent,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: UI.colors.muted,
    fontSize: 14,
    marginLeft: 6,
  },
});