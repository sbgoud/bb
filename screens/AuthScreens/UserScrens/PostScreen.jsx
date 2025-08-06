import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const THEME = {
  primary: '#D90429',
  onPrimary: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  subtle: '#F2F4F8',
  black: '#111827',
  green: '#10B981',
  red: '#EF233C',
};

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
    case 'normal': return { bg: '#ECF6FF', txt: '#0C4A6E' };
    case 'soon': return { bg: '#FFF3E6', txt: '#9A3412' };
    case 'urgent': return { bg: '#FFE8EA', txt: '#7F1D1D' };
    case 'critical': return { bg: '#FFE6EB', txt: '#7A0E26' };
    default: return { bg: '#EEF2F7', txt: THEME.muted };
  }
}

export default function RequestListScreen({
  requests = [],
  onOpenPost,
  onCreatePost,
  title = 'Requests',
  fallbackFake = false,
}) {
  const empty = !requests || requests.length === 0;

  const data = useMemo(() => requests || [], [requests]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.brand}>{title}</Text>
      </View>

      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No requests found</Text>
          {fallbackFake ? (
            <Text style={styles.emptyText}>
              You might be seeing fake/demo posts elsewhere when your list is empty.
            </Text>
          ) : (
            <Text style={styles.emptyText}>Tap “Post Request” to create one.</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => onOpenPost && onOpenPost(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (onCreatePost) onCreatePost();
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabText}>Post Request</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PostCard({ post, onPress }) {
  const accent = post.type === 'donor' ? THEME.green : THEME.red;
  const u = urgencyStyle(post.urgency);
  const location = [post.hospital, post.area, post.municipality, post.district, post.state]
    .filter(Boolean)
    .join(', ');
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.marker, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>
            {post.type === 'donor' ? `Donor • ${post.bloodGroup || ''}` : `Need • ${post.bloodGroup || ''}`}
          </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Text style={styles.meta}>
          {(post.name || 'Unknown')} • {(location || '—')}
        </Text>
        <View style={styles.badges}>
          <Badge label={post.type === 'donor' ? 'Donor' : 'Receiver'} color={accent} filled />
          {post.urgency ? <Badge label={(post.urgency || '').toUpperCase()} bg={u.bg} color={u.txt} /> : null}
        </View>
        {!!post.description && <Text numberOfLines={2} style={styles.notes}>{post.description}</Text>}
      </View>
    </TouchableOpacity>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  logo: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFFAA' },
  brand: { fontSize: 18, fontWeight: '800', color: THEME.text },

  list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },

  card: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  marker: { width: 6, borderRadius: 3, backgroundColor: THEME.red, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  time: { fontSize: 12, color: THEME.muted },
  meta: { marginTop: 4, color: THEME.muted },
  badges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  notes: { marginTop: 8, color: THEME.text, lineHeight: 20 },

  fab: {
    position: 'absolute',
    right: 16, bottom: 24,
    height: 52, borderRadius: 26, paddingHorizontal: 16,
    backgroundColor: THEME.primary,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 22, marginRight: 2 },
  fabText: { color: '#FFFFFF', fontWeight: '800' },
});