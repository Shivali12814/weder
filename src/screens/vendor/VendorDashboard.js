import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { ms } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG = {
  pending:   { color: COLORS.yellow, bg: 'rgba(255,184,0,0.12)',   label: 'Pending',    icon: '⏳' },
  accepted:  { color: COLORS.green,  bg: 'rgba(72,199,142,0.12)',  label: 'Accepted',   icon: '✅' },
  rejected:  { color: COLORS.pink,   bg: 'rgba(232,84,122,0.12)',  label: 'Rejected',   icon: '❌' },
  completed: { color: COLORS.blue,   bg: 'rgba(99,179,237,0.12)',  label: 'Completed',  icon: '🏆' },
  cancelled: { color: 'gray',        bg: 'rgba(128,128,128,0.12)', label: 'Cancelled',  icon: '🚫' },
};

export default function VendorDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await API.get('/vendors/me/dashboard');
      setData(res.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  const stats = data?.stats || {};
  const vp    = user?.vendorProfile || {};

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: SPACING.md, paddingTop: insets.top + ms(16) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} tintColor={COLORS.gold} />}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={s.businessName}>{vp.businessName || 'Business'}</Text>
          <View style={s.verifyRow}>
            <Text style={s.categoryTag}>{vp.category?.replace(/_/g,' ').toUpperCase()}</Text>
            {vp.isVerified && <Text style={s.verifiedTag}>✓ Verified</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('VendorProfile')} style={s.profileBtn}>
          <Text style={{ fontSize: ms(22) }}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        {[
          { n: stats.pending,   l: 'New Requests', ic: '⏳', color: COLORS.yellow },
          { n: stats.accepted,  l: 'Accepted',     ic: '✅', color: COLORS.green  },
          { n: stats.completed, l: 'Completed',    ic: '🏆', color: COLORS.blue   },
          { n: stats.rating || 0, l: 'Rating',     ic: '⭐', color: COLORS.gold   },
        ].map((s_, i) => (
          <View key={i} style={[s.statCard, { borderTopColor: s_.color }]}>
            <Text style={s.statIcon}>{s_.ic}</Text>
            <Text style={[s.statNum, { color: s_.color }]}>{s_.n}</Text>
            <Text style={s.statLabel}>{s_.l}</Text>
          </View>
        ))}
      </View>

      {/* Earnings */}
      <View style={s.earningsCard}>
        <Text style={s.earningsTitle}>💰 Earnings Overview</Text>
        <View style={s.earningsRow}>
          <View style={s.earningsItem}>
            <Text style={s.earningsVal}>₹{((stats.totalEarnings||0)/100000).toFixed(1)}L</Text>
            <Text style={s.earningsLbl}>Total Committed</Text>
          </View>
          <View style={s.earningsDivider} />
          <View style={s.earningsItem}>
            <Text style={[s.earningsVal, { color: COLORS.green }]}>₹{((stats.paidEarnings||0)/100000).toFixed(1)}L</Text>
            <Text style={s.earningsLbl}>Received</Text>
          </View>
        </View>
      </View>

      {/* Recent Requests */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>📋 Recent Requests</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VendorRequests')}>
          <Text style={s.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {data?.recentRequests?.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>No requests yet{'\n'}Complete your profile to get discovered!</Text>
        </View>
      ) : (
        data?.recentRequests?.map(req => {
          const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
          return (
            <TouchableOpacity key={req._id} style={s.reqCard}
              onPress={() => navigation.navigate('VendorRequests', { requestId: req._id })}>
              <View style={s.reqTop}>
                <View style={s.clientAvatar}>
                  <Text style={s.clientAvatarText}>{req.client?.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={s.reqInfo}>
                  <Text style={s.clientName}>{req.client?.name}</Text>
                  <Text style={s.reqDate}>📅 {new Date(req.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.statusText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
                </View>
              </View>
              {req.message ? <Text style={s.reqMsg} numberOfLines={2}>"{req.message}"</Text> : null}
              {req.budget ? <Text style={s.reqBudget}>Budget: ₹{req.budget.toLocaleString()}</Text> : null}
            </TouchableOpacity>
          );
        })
      )}

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>⚡ Quick Actions</Text>
      <View style={s.quickActions}>
        {[
          { label: 'My Services',  icon: '🛠️', screen: 'VendorServices'  },
          { label: 'All Requests', icon: '📋', screen: 'VendorRequests'  },
          { label: 'My Profile',   icon: '👤', screen: 'VendorProfile'   },
        ].map(a => (
          <TouchableOpacity key={a.label} style={s.qaBtn} onPress={() => navigation.navigate(a.screen)}>
            <Text style={s.qaIcon}>{a.icon}</Text>
            <Text style={s.qaLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.deep },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:        { fontSize: ms(20), fontWeight: '800', color: COLORS.goldLight },
  businessName:    { fontSize: ms(14), color: 'rgba(253,246,236,0.6)', marginTop: 2 },
  verifyRow:       { flexDirection: 'row', gap: 8, marginTop: 4 },
  categoryTag:     { fontSize: ms(10), color: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  verifiedTag:     { fontSize: ms(10), color: COLORS.green, backgroundColor: 'rgba(72,199,142,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  profileBtn:      { backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:        { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, borderTopWidth: 3, padding: SPACING.md, alignItems: 'center' },
  statIcon:        { fontSize: ms(22), marginBottom: 4 },
  statNum:         { fontSize: ms(24), fontWeight: '800' },
  statLabel:       { fontSize: ms(11), color: 'rgba(253,246,236,0.5)', marginTop: 2 },
  earningsCard:    { backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 20 },
  earningsTitle:   { fontSize: ms(14), fontWeight: '700', color: COLORS.goldLight, marginBottom: 12 },
  earningsRow:     { flexDirection: 'row', alignItems: 'center' },
  earningsItem:    { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  earningsVal:     { fontSize: ms(20), fontWeight: '800', color: COLORS.gold },
  earningsLbl:     { fontSize: ms(11), color: 'rgba(253,246,236,0.5)', marginTop: 2 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:    { fontSize: ms(15), fontWeight: '700', color: COLORS.goldLight, marginBottom: 12 },
  seeAll:          { fontSize: ms(12), color: COLORS.gold },
  reqCard:         { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10 },
  reqTop:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clientAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center' },
  clientAvatarText:{ color: COLORS.gold, fontSize: ms(16), fontWeight: '800' },
  reqInfo:         { flex: 1 },
  clientName:      { fontSize: ms(14), fontWeight: '700', color: COLORS.cream },
  reqDate:         { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 2 },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText:      { fontSize: ms(11), fontWeight: '600' },
  reqMsg:          { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', fontStyle: 'italic', marginTop: 8 },
  reqBudget:       { fontSize: ms(12), color: COLORS.gold, marginTop: 4 },
  emptyCard:       { alignItems: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  emptyIcon:       { fontSize: ms(40), marginBottom: 10 },
  emptyText:       { color: 'rgba(253,246,236,0.4)', textAlign: 'center', lineHeight: 22 },
  quickActions:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  qaBtn:           { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center' },
  qaIcon:          { fontSize: ms(24), marginBottom: 6 },
  qaLabel:         { fontSize: ms(11), color: 'rgba(253,246,236,0.7)', fontWeight: '500', textAlign: 'center' },
  logoutBtn:       { backgroundColor: 'rgba(232,84,122,0.12)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', borderRadius: RADIUS.full, padding: 12, alignItems: 'center', marginBottom: 40 },
  logoutText:      { color: COLORS.pink, fontWeight: '700' },
});
