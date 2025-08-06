import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';

// Use React Native Firebase v6+ syntax
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
  red: '#EF233C',
};

const FAKE_POSTS = [
  {
    id: 'fake-1',
    type: 'receiver',
    name: 'Demo Patient',
    bloodGroup: 'O+',
    location: 'City Hospital, Sampletown',
    urgency: 'urgent',
    notes: 'This is a demo request shown because you have no posts yet.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 'fake-2',
    type: 'donor',
    name: 'Demo Donor',
    bloodGroup: 'A-',
    location: 'Downtown, Sampletown',
    urgency: 'normal',
    notes: 'This is a demo donor post shown because you have no posts yet.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

function urgencyStyle(u) {
  switch (u) {
    case 'normal': return { bg: '#ECF6FF', txt: '#0C4A6E' };
    case 'soon': return { bg: '#FFF3E6', txt: '#9A3412' };
    case 'urgent': return { bg: '#FFE8EA', txt: '#7F1D1D' };
    case 'critical': return { bg: '#FFE6EB', txt: '#7A0E26' };
    default: return { bg: '#EEF2F7', txt: THEME.muted };
  }
}

export default function UserRequestsScreen({ navigation, onOpenPost, onCreatePost }) {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);

  // Auth: Use the built-in onAuthStateChanged from @react-native-firebase/auth
  useEffect(() => {
    const unsub = auth().onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        navigation?.replace?.('Login');
      }
    });
    return () => unsub(); // Unsubscribe on unmount
  }, [navigation]);

  const fetchAll = useCallback(async () => {
    // Only fetch if a user is logged in
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch user's posts from 'requests' collection
      const requestsSnapshot = await firestore()
        .collection('requests')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const rows = requestsSnapshot.docs.map(docSnap => {
        const d = docSnap.data() || {};
        return {
          id: docSnap.id,
          type: d.type || 'receiver',
          name: d.name || 'Unknown',
          bloodGroup: d.bloodGroup || '',
          location:
            [d.hospital, d.area, d.municipality, d.district, d.state]
              .filter(Boolean)
              .join(', ') || '—',
          urgency: d.urgency || 'normal',
          notes: d.description || d.notes || '',
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
        };
      });
      setPosts(rows);

      // Fetch donation history from the 'users' collection
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      setDonationHistory(userData?.donationHistory || []);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Re-fetch data whenever the user's UID changes (i.e., on login)
    if (uid) {
      fetchAll();
    }
  }, [uid, fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const dataToRender = useMemo(() => {
    if (posts.length > 0) return posts;
    return FAKE_POSTS.map((p) => ({ ...p, isFake: true }));
  }, [posts]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.brand}>My Posts</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            if (onCreatePost) onCreatePost();
            else navigation?.navigate?.('CreatePost');
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.createBtnText}>＋ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={THEME.primary} />
          <Text style={styles.loadingText}>Loading your posts…</Text>
        </View>
      ) : (
        <FlatList
          data={dataToRender}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => onOpenPost ? onOpenPost(item) : null}
            />
          )}
          ListHeaderComponent={
            <>
              {posts.length === 0 && (
                <View style={styles.fakeNote}>
                  <Text style={styles.fakeNoteText}>
                    Showing demo posts because you have no posts yet. Tap “Create” to publish your first request or donor post.
                  </Text>
                </View>
              )}
              {uid && <DonationHistorySection donationHistory={donationHistory} />}
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
        />
      )}

      {/* Floating Create button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (onCreatePost) onCreatePost();
          else navigation?.navigate?.('CreatePost');
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabText}>Post Request</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Components and Styles (unchanged) */

function PostCard({ post, onPress }) {
  const accent = post.type === 'donor' ? THEME.green : THEME.red;
  const u = urgencyStyle(post.urgency);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.marker, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>
            {post.type === 'donor' ? `Donor • ${post.bloodGroup}` : `Need • ${post.bloodGroup}`}
          </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Text style={styles.meta}>{post.name} • {post.location}</Text>
        <View style={styles.badges}>
          <Badge label={post.type === 'donor' ? 'Donor' : 'Receiver'} color={accent} filled />
          {post.urgency ? <Badge label={(post.urgency || '').toUpperCase()} bg={u.bg} color={u.txt} /> : null}
        </View>
        {!!post.notes && <Text numberOfLines={2} style={styles.notes}>{post.notes}</Text>}
        {post.isFake && (
          <Text style={styles.fakeTag}>FAKE DEMO</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DonationHistorySection({ donationHistory }) {
  const items = Array.isArray(donationHistory) ? donationHistory : [];
  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>Donation History</Text>
      {items.length === 0 ? (
        <Text style={styles.historyEmpty}>No donations recorded yet.</Text>
      ) : (
        items.map((it, idx) => (
          <View key={idx} style={styles.historyRow}>
            <Text style={styles.historyDot}>•</Text>
            <Text style={styles.historyText}>
              {formatHistoryItem(it)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function formatHistoryItem(it) {
  if (!it) return 'Donation';
  if (typeof it === 'string') return it;
  const date = it.date?.toDate ? it.date.toDate() : (it.date ? new Date(it.date) : null);
  const when = date ? date.toDateString() : '';
  const place = it.place || it.hospital || '';
  const qty = it.units ? `${it.units} unit(s)` : '';
  return [when, place, qty].filter(Boolean).join(' • ') || 'Donation';
}

function Badge({ label, color = THEME.muted, bg = THEME.subtle, filled }) {
  const bgc = filled ? color : bg;
  const txt = filled ? '#FFFFFF' : color;
  return (
    <View style={[styles.badge, { backgroundColor: bgc }]}>
      <Text style={[styles.badgeText, { color: txt }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 10,
  },
  logo: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFFAA' },
  brand: { fontSize: 18, fontWeight: '800', color: THEME.text },
  createBtn: {
    backgroundColor: THEME.primary, height: 36, paddingHorizontal: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: THEME.muted },
  list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },
  card: {
    flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, padding: 12, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  marker: { width: 6, borderRadius: 3, backgroundColor: THEME.red, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  time: { fontSize: 12, color: THEME.muted },
  meta: { marginTop: 4, color: THEME.muted },
  badges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  notes: { marginTop: 8, color: THEME.text, lineHeight: 20 },
  fakeTag: {
    marginTop: 8, alignSelf: 'flex-start', fontSize: 10, color: THEME.muted,
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  fakeNote: {
    backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  fakeNoteText: { color: '#9A3412' },
  historyCard: {
    backgroundColor: THEME.surface, borderRadius: 16, padding: 12, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  historyTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  historyEmpty: { color: THEME.muted },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  historyDot: { marginRight: 6, color: THEME.muted },
  historyText: { color: THEME.text },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  emptyText: { marginTop: 6, color: THEME.muted, textAlign: 'center' },
  fab: {
    position: 'absolute', right: 16, bottom: 24, height: 52, borderRadius: 26, paddingHorizontal: 16,
    backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 22, marginRight: 2 },
  fabText: { color: '#FFFFFF', fontWeight: '800' },
});