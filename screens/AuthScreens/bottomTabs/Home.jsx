import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { UI } from '../../../src/theme/uiTheme';

export default function Home({ navigation }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logo}><View style={styles.logoDot} /></View>
        <Text style={styles.brand}>Home</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome to BloodBank</Text>
          <Text style={styles.heroSub}>
            Post requests, find donors, and manage your profile — all in one place.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: UI.colors.accent }]}
            onPress={() => navigation?.navigate?.('CreatePost')}
            activeOpacity={0.92}
          >
            <Text style={styles.actionTitle}>Create Post</Text>
            <Text style={styles.actionSub}>Donor or receiver — start here</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: UI.colors.blue }]}
            onPress={() => navigation?.navigate?.('Request')}
            activeOpacity={0.92}
          >
            <Text style={styles.actionTitle}>My Posts</Text>
            <Text style={styles.actionSub}>View and manage your posts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 10,
    backgroundColor: UI.colors.surface, borderBottomWidth: 1, borderBottomColor: UI.colors.border,
  },
  logo: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: UI.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFFAA' },
  brand: { fontSize: 18, fontWeight: '800', color: UI.colors.text },

  content: { padding: 16 },
  hero: {
    backgroundColor: UI.colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: UI.colors.border, ...UI.shadow.sm,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: UI.colors.text },
  heroSub: { marginTop: 6, color: UI.colors.muted, lineHeight: 20 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionCard: {
    flex: 1, borderRadius: 16, padding: 16, ...UI.shadow.md,
  },
  actionTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  actionSub: { color: '#FFFFFF', opacity: 0.95, marginTop: 4, fontSize: 12 },
});