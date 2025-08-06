import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { UI } from '../../../src/theme/uiTheme';

const TABS = ['Feed', 'Donors', 'Requests'];

const DEFAULT_POSTS = [
  {
    id: 'd1',
    type: 'receiver',
    name: 'Rahul Verma',
    bloodGroup: 'O+',
    location: 'City Hospital, Pune',
    urgency: 'urgent',
    notes: 'Surgery this evening. Need O+ urgently.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd2',
    type: 'donor',
    name: 'Ananya Sharma',
    bloodGroup: 'A-',
    location: 'Baner, Pune',
    urgency: 'soon',
    notes: 'Available after 6 PM. Last donation 5 months ago.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

function urgencyStyle(u) {
  switch (u) {
    case 'normal': return { bg: '#E5E7EB', txt: '#374151' };
    case 'soon': return { bg: '#FFEDD5', txt: '#9A3412' };
    case 'urgent': return { bg: '#FFE8EA', txt: UI.colors.accent };
    case 'critical': return { bg: '#FFE6EB', txt: '#7A0E26' };
    default: return { bg: '#EEF2F7', txt: UI.colors.muted };
  }
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('Feed');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const userDocRef = firestore().collection('users').doc(currentUser.uid);
    const unsubscribeUser = userDocRef.onSnapshot(
      (docSnapshot) => {
        if (docSnapshot.exists) setUserData(docSnapshot.data());
        else setUserData(null);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setUserData(null);
      },
    );

    const postsQuery = firestore()
      .collection('requests')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const unsubscribePosts = postsQuery.onSnapshot(
      (querySnapshot) => {
        const rows = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data() || {};
          rows.push({
            id: doc.id,
            type: d.type || 'receiver',
            name: d.name || 'Unknown',
            bloodGroup: d.bloodGroup || 'O+',
            location:
              d.location ||
              [d.hospital, d.area, d.municipality, d.district, d.state].filter(Boolean).join(', ') ||
              'Unknown',
            urgency: d.urgency || 'normal',
            notes: d.description || d.notes || '',
            createdAt:
              (d.createdAt && d.createdAt.toDate && d.createdAt.toDate().toISOString()) ||
              new Date().toISOString(),
            phone: d.phone || '',
          });
        });
        setFetched(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, []);

  const source = fetched.length > 0 ? fetched : DEFAULT_POSTS;

  const filtered = useMemo(() => {
    let items = source.slice();

    if (tab === 'Donors') items = items.filter((p) => p.type === 'donor');
    if (tab === 'Requests') items = items.filter((p) => p.type === 'receiver');

    if (typeFilter) items = items.filter((p) => p.type === typeFilter);
    if (groupFilter)
      items = items.filter(
        (p) => (p.bloodGroup || '').toUpperCase() === groupFilter.toUpperCase(),
      );
    if (urgencyFilter) items = items.filter((p) => (p.urgency || '') === urgencyFilter);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (p) =>
          (p.location || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.name || '').toLowerCase().includes(q) ||
          (p.bloodGroup || '').toLowerCase() === q,
      );
    }
    return items;
  }, [source, tab, typeFilter, groupFilter, urgencyFilter, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  const clearFilters = () => {
    setTypeFilter('');
    setGroupFilter('');
    setUrgencyFilter('');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={UI.colors.accent} />
        <Text style={styles.loadingText}>Loading profile and posts…</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Could not load user profile.</Text>
        <Text style={styles.errorSub}>Please try again or contact support.</Text>
      </View>
    );
  }

  const userName = userData?.name || 'User';
  const daysUntilEligible = userData?.lastDonationDate?.toDate
    ? Math.max(
        0,
        90 -
          Math.floor(
            (Date.now() - userData.lastDonationDate.toDate().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
      )
    : '—';
  const group = userData?.bloodGroup || '—';

  return (
    <SafeAreaView style={styles.root}>
      {/* Header gradient area */}
      <View style={styles.headerGrad}>
        <View style={styles.topControls}>
          <View style={[styles.roundBtn, { backgroundColor: '#FFFFFFAA' }]}>
            <Text style={styles.roundBtnTxt}>≡</Text>
          </View>
          <View style={[styles.roundBtn, { backgroundColor: '#FFFFFFAA' }]}>
            <Text style={styles.roundBtnTxt}>⎋</Text>
          </View>
        </View>

        <Text style={styles.soft}>Welcome back</Text>
        <Text style={styles.title}>Let’s make a difference</Text>

        {/* Search pill */}
        <View style={styles.searchPill}>
          <Text style={styles.searchPlaceholder}>Search donors, requests, or hospitals</Text>
          <View style={styles.searchDot} />
        </View>

        {/* Twin CTAs */}
        <View style={styles.twinsRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CreatePost')}
            style={[styles.ctaCard, styles.ctaRed]}
          >
            <Text style={styles.ctaTitleWhite}>Donate</Text>
            <Text style={styles.ctaSubWhite}>Eligibility • Nearby</Text>
            <View style={styles.ctaChipWhite}>
              <Text style={styles.ctaChipTextDark}>Start</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setTab('Donors')}
            style={[styles.ctaCard, styles.ctaBlue]}
          >
            <Text style={styles.ctaTitleWhite}>Find donors</Text>
            <Text style={styles.ctaSubWhite}>Group • Urgency</Text>
            <View style={styles.ctaChipGhost}>
              <Text style={styles.ctaChipTextWhite}>Search</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* KPI masonry */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiTall}>
            <Text style={styles.kpiLabel}>Your blood group</Text>
            <Text style={styles.kpiBig}>{group}</Text>
            <Text style={styles.kpiFoot}>Compatible: A+, B+, AB+</Text>
          </View>
          <View style={styles.kpiStack}>
            <View style={styles.kpiSmall}>
              <Text style={styles.kpiLabel}>Days until eligible</Text>
              <Text style={styles.kpiNum}>{daysUntilEligible}</Text>
            </View>
            <View style={styles.kpiSmall}>
              <Text style={styles.kpiLabel}>Lives impacted</Text>
              <Text style={styles.kpiNum}>156</Text>
            </View>
          </View>
        </View>

        {/* Activity tabs */}
        <View style={styles.activityRow}>
          <Text style={styles.activityTitle}>Activity</Text>
          <View style={styles.activityTabs}>
            <Segment value={tab} onChange={setTab} options={TABS} />
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            post={item}
            onPress={() => navigation.navigate('PostDetailsScreen', { post: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptyText}>Try changing filters or create a post.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={UI.colors.accent}
            colors={[UI.colors.accent]}
          />
        }
      />

      {/* Floating Create button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>

      {/* Filters bottom sheet (same logic, themed) */}
      <Modal transparent animationType="slide" visible={showFilters} onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowFilters(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filters</Text>

          <Text style={styles.groupLabel}>Type</Text>
          <View style={styles.rowWrap}>
            <Pill label="Donor" selected={typeFilter === 'donor'} onPress={() => setTypeFilter(typeFilter === 'donor' ? '' : 'donor')} />
            <Pill label="Receiver" selected={typeFilter === 'receiver'} onPress={() => setTypeFilter(typeFilter === 'receiver' ? '' : 'receiver')} />
          </View>

          <Text style={styles.groupLabel}>Blood group</Text>
          <View style={styles.rowWrap}>
            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
              <Pill key={g} label={g} selected={groupFilter === g} onPress={() => setGroupFilter(groupFilter === g ? '' : g)} />
            ))}
          </View>

          <Text style={styles.groupLabel}>Urgency</Text>
          <View style={styles.rowWrap}>
            {['normal', 'soon', 'urgent', 'critical'].map((u) => (
              <Pill key={u} label={u[0].toUpperCase() + u.slice(1)} selected={urgencyFilter === u} onPress={() => setUrgencyFilter(urgencyFilter === u ? '' : u)} />
            ))}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={clearFilters}>
              <Text style={styles.ghostText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* UI Components */

function Segment({ value, onChange, options }) {
  return (
    <View style={styles.segment}>
      {options.map((op) => {
        const active = value === op;
        return (
          <TouchableOpacity
            key={op}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
            onPress={() => onChange(op)}
            activeOpacity={0.9}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{op}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Card({ post, onPress }) {
  const accent = post.type === 'donor' ? UI.colors.green : UI.colors.accent;
  const u = urgencyStyle(post.urgency);
  const bgBox =
    post.type === 'receiver' ? '#FFE4E6' : post.type === 'donor' ? '#ECFDF5' : UI.colors.chipGradTo;
  const txtBox =
    post.type === 'receiver' ? UI.colors.accent : post.type === 'donor' ? '#047857' : UI.colors.text;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
      <View style={[styles.leftBox, { backgroundColor: bgBox }]}>
        <Text style={[styles.leftBoxText, { color: txtBox }]}>{(post.bloodGroup || '').toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{post.name || 'Unknown'}</Text>
          <View style={[styles.badge, { backgroundColor: u.bg }]}>
            <Text style={[styles.badgeText, { color: u.txt }]}>
              {(post.urgency || 'normal')[0].toUpperCase() + (post.urgency || 'normal').slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>{post.location || 'Unknown'}</Text>
        <Text style={styles.cardSub}>{timeAgo(post.createdAt)}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: UI.colors.green }]}>
            <Text style={styles.primaryBtnText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Pill({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.pill, selected && styles.pillActive]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* Styles */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.colors.bg },

  headerGrad: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: UI.colors.bg,
  },

  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roundBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  roundBtnTxt: { color: UI.colors.text, fontWeight: '700' },

  soft: { color: UI.colors.soft, fontSize: 13, marginTop: 10 },
  title: { color: UI.colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },

  searchPill: {
    height: 46, borderRadius: 23, backgroundColor: UI.colors.surface,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginTop: 14,
    borderWidth: 1, borderColor: UI.colors.border,
    ...UI.shadow.sm,
  },
  searchPlaceholder: { color: UI.colors.muted, fontSize: 14, flex: 1 },
  searchDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: UI.colors.accent },

  twinsRow: { flexDirection: 'row', gap: 14, marginTop: 16 },
  ctaCard: {
    flex: 1,
    borderRadius: UI.radii.md,
    padding: 14,
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  ctaRed: {
    backgroundColor: UI.colors.accent,
  },
  ctaBlue: {
    backgroundColor: UI.colors.blue,
  },
  ctaTitleWhite: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  ctaSubWhite: { color: '#FFFFFF', opacity: 0.95, marginTop: 2, fontSize: 12 },
  ctaChipWhite: {
    marginTop: 8, backgroundColor: '#FFFFFF', height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12,
  },
  ctaChipTextDark: { color: UI.colors.text, fontWeight: '700', fontSize: 12 },
  ctaChipGhost: {
    marginTop: 8, backgroundColor: '#FFFFFF22', borderColor: '#FFFFFF55', borderWidth: 1, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12,
  },
  ctaChipTextWhite: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  kpiRow: { flexDirection: 'row', gap: 14, marginTop: 16 },
  kpiTall: {
    flex: 1, borderRadius: UI.radii.md, padding: 14, backgroundColor: UI.colors.surface, borderWidth: 1, borderColor: UI.colors.border, ...UI.shadow.sm,
  },
  kpiStack: { flex: 1, gap: 8 },
  kpiSmall: {
    borderRadius: UI.radii.md, padding: 14, backgroundColor: UI.colors.surface, borderWidth: 1, borderColor: UI.colors.border, ...UI.shadow.sm,
  },
  kpiLabel: { color: UI.colors.soft, fontSize: 12 },
  kpiBig: { color: UI.colors.text, fontSize: 32, fontWeight: '800', marginTop: 6 },
  kpiFoot: { color: UI.colors.muted, fontSize: 12, marginTop: 6 },
  kpiNum: { color: UI.colors.text, fontSize: 20, fontWeight: '800', alignSelf: 'flex-end' },

  activityRow: { marginTop: 18 },
  activityTitle: { color: UI.colors.text, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  activityTabs: { flexDirection: 'row' },

  segment: {
    flexDirection: 'row', backgroundColor: UI.colors.surface, borderRadius: 17, padding: 4, gap: 6, ...UI.shadow.sm, borderWidth: 1, borderColor: UI.colors.border,
  },
  segmentItem: { height: 34, paddingHorizontal: 16, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: UI.colors.text },
  segmentText: { color: UI.colors.muted, fontWeight: '700', fontSize: 12 },
  segmentTextActive: { color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },

  card: {
    flexDirection: 'row',
    backgroundColor: UI.colors.surface,
    borderRadius: UI.radii.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: UI.colors.border,
    ...UI.shadow.sm,
  },
  leftBox: {
    width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginRight: 12,
  },
  leftBoxText: { fontWeight: '800', fontSize: 16 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: UI.colors.text },
  badge: { paddingHorizontal: 10, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { marginTop: 6, color: UI.colors.muted, fontSize: 13 },
  cardSub: { marginTop: 2, color: UI.colors.soft, fontSize: 12 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  primaryBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: UI.colors.text,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#FFFFFF', fontWeight: '800' },

  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: UI.colors.text },
  emptyText: { marginTop: 6, color: UI.colors.muted, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: UI.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...UI.shadow.lg,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  fabText: { color: '#FFFFFF', fontWeight: '800' },

  // Filters sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: UI.colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 10,
  },
  sheetHandle: { alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: UI.colors.text, marginBottom: 4 },
  groupLabel: { fontWeight: '700', color: UI.colors.muted, marginTop: 6, marginBottom: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 34, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#F2F4F8', justifyContent: 'center', alignItems: 'center',
  },
  pillActive: { backgroundColor: UI.colors.text },
  pillText: { color: UI.colors.text, fontWeight: '700' },
  pillTextActive: { color: '#FFFFFF' },

  // Error/Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: UI.colors.muted },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: UI.colors.bg },
  errorTitle: { color: UI.colors.accent, fontSize: 18, fontWeight: '700' },
  errorSub: { color: UI.colors.muted, marginTop: 8, textAlign: 'center' },
});