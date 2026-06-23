import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { ms } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG = {
  pending:   { color: COLORS.yellow, bg: 'rgba(255,184,0,0.12)',   label: 'Pending ⏳'  },
  accepted:  { color: COLORS.green,  bg: 'rgba(72,199,142,0.12)',  label: 'Accepted ✅' },
  rejected:  { color: COLORS.pink,   bg: 'rgba(232,84,122,0.12)',  label: 'Rejected ❌' },
  completed: { color: COLORS.blue,   bg: 'rgba(99,179,237,0.12)',  label: 'Completed 🏆'},
  cancelled: { color: 'gray',        bg: 'rgba(128,128,128,0.1)',  label: 'Cancelled 🚫'},
};

export default function VendorRequests() {
  const insets = useSafeAreaInsets();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [reply,      setReply]      = useState('');
  const [price,      setPrice]      = useState('');
  const [saving,     setSaving]     = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await API.get('/vendors/me/requests', { params: filter ? { status: filter } : {} });
      setRequests(res.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [filter]);

  const openRespond = (req) => {
    setSelected(req);
    setReply('');
    setPrice('');
    setModal(true);
  };

  const handleRespond = async (status) => {
    setSaving(true);
    try {
      await API.patch(`/vendors/requests/${selected._id}/respond`, {
        status, vendorReply: reply, quotedPrice: Number(price) || 0, totalAmount: Number(price) || 0,
      });
      Alert.alert('Done!', status === 'accepted' ? 'Request accepted successfully! 🎉' : 'Request rejected.');
      setModal(false);
      fetchRequests();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (id) => {
    Alert.alert('Mark as Completed?', 'This will mark the booking as completed. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Complete', onPress: async () => {
        await API.patch(`/vendors/requests/${id}/complete`);
        fetchRequests();
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <View style={s.container}>
      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingTop: insets.top + ms(8), paddingBottom: 8, gap: 8 }}>
        {['', 'pending', 'accepted', 'completed', 'rejected'].map(v => (
          <TouchableOpacity key={v} onPress={() => setFilter(v)}
            style={[s.chip, filter === v && s.chipActive]}>
            <Text style={[s.chipText, filter === v && s.chipTextActive]}>
              {v ? STATUS_CONFIG[v]?.label : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={requests}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={COLORS.gold} />}
        contentContainerStyle={{ padding: SPACING.md, gap: 12, paddingBottom: ms(40) }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: ms(40), marginBottom: 10 }}>📭</Text>
            <Text style={s.emptyText}>No requests found</Text>
          </View>
        }
        renderItem={({ item: req }) => {
          const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{req.client?.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.clientName}>{req.client?.name}</Text>
                  <Text style={s.clientPhone}>📞 {req.client?.phone || req.client?.email}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.detailRow}>
                <Text style={s.detailLabel}>📅 Event Date</Text>
                <Text style={s.detailVal}>{new Date(req.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}</Text>
              </View>
              {req.guestCount ? <View style={s.detailRow}><Text style={s.detailLabel}>👥 Guests</Text><Text style={s.detailVal}>{req.guestCount}</Text></View> : null}
              {req.venue      ? <View style={s.detailRow}><Text style={s.detailLabel}>📍 Venue</Text><Text style={s.detailVal}>{req.venue}</Text></View> : null}
              {req.budget     ? <View style={s.detailRow}><Text style={s.detailLabel}>💰 Budget</Text><Text style={[s.detailVal, { color: COLORS.gold }]}>₹{req.budget.toLocaleString()}</Text></View> : null}
              {req.message    ? <Text style={s.message}>💬 "{req.message}"</Text> : null}

              {req.vendorReply ? (
                <View style={s.replyBox}>
                  <Text style={s.replyLabel}>Your Reply:</Text>
                  <Text style={s.replyText}>{req.vendorReply}</Text>
                  {req.quotedPrice > 0 && <Text style={s.quotedPrice}>Quoted: ₹{req.quotedPrice.toLocaleString()}</Text>}
                </View>
              ) : null}

              {req.wedding && (
                <View style={s.weddingTag}>
                  <Text style={s.weddingText}>💍 {req.wedding.groomName} ♥ {req.wedding.brideName}</Text>
                </View>
              )}

              {/* Actions */}
              {req.status === 'pending' && (
                <TouchableOpacity style={s.respondBtn} onPress={() => openRespond(req)}>
                  <Text style={s.respondBtnText}>✍️ Reply to Request</Text>
                </TouchableOpacity>
              )}
              {req.status === 'accepted' && (
                <TouchableOpacity style={s.completeBtn} onPress={() => handleComplete(req._id)}>
                  <Text style={s.completeBtnText}>🏆 Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Respond Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Reply to Request</Text>
            {selected && (
              <Text style={s.modalClient}>Client: {selected.client?.name} | {new Date(selected.eventDate).toLocaleDateString('en-IN')}</Text>
            )}
            <Text style={s.lbl}>Your Reply / Message</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              value={reply} onChangeText={setReply}
              placeholder="Write your message to the client..." placeholderTextColor="rgba(253,246,236,0.3)" multiline />
            <Text style={s.lbl}>Your Quoted Price (₹)</Text>
            <TextInput style={s.input} value={price} onChangeText={setPrice}
              placeholder="e.g. 25000" placeholderTextColor="rgba(253,246,236,0.3)" keyboardType="numeric" />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.rejectBtn} onPress={() => handleRespond('rejected')} disabled={saving}>
                <Text style={s.rejectBtnText}>❌ Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.acceptBtn} onPress={() => handleRespond('accepted')} disabled={saving}>
                <Text style={s.acceptBtnText}>{saving ? 'Saving...' : '✅ Accept'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModal(false)} style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: 'rgba(253,246,236,0.4)', fontSize: ms(13) }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.deep },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep },
  filterBar:      { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  chipActive:     { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText:       { color: 'rgba(253,246,236,0.6)', fontSize: ms(12) },
  chipTextActive: { color: '#1A0A2E', fontWeight: '700' },
  card:           { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText:     { color: COLORS.gold, fontSize: ms(18), fontWeight: '800' },
  cardInfo:       { flex: 1 },
  clientName:     { fontSize: ms(15), fontWeight: '700', color: COLORS.cream },
  clientPhone:    { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 2 },
  badge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText:      { fontSize: ms(11), fontWeight: '600' },
  divider:        { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginBottom: 10 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel:    { fontSize: ms(12), color: 'rgba(253,246,236,0.45)' },
  detailVal:      { fontSize: ms(12), color: COLORS.cream, fontWeight: '500' },
  message:        { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
  replyBox:       { backgroundColor: 'rgba(72,199,142,0.08)', borderRadius: RADIUS.md, padding: 10, marginTop: 10, borderWidth: 1, borderColor: 'rgba(72,199,142,0.2)' },
  replyLabel:     { fontSize: ms(11), color: COLORS.green, fontWeight: '600', marginBottom: 4 },
  replyText:      { fontSize: ms(12), color: 'rgba(253,246,236,0.7)' },
  quotedPrice:    { fontSize: ms(12), color: COLORS.gold, fontWeight: '700', marginTop: 4 },
  weddingTag:     { backgroundColor: 'rgba(232,84,122,0.08)', borderRadius: RADIUS.md, padding: 8, marginTop: 8 },
  weddingText:    { fontSize: ms(11), color: COLORS.pink },
  respondBtn:     { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, padding: 11, alignItems: 'center', marginTop: 12 },
  respondBtnText: { color: '#1A0A2E', fontWeight: '800', fontSize: ms(14) },
  completeBtn:    { backgroundColor: 'rgba(72,199,142,0.15)', borderWidth: 1, borderColor: COLORS.green, borderRadius: RADIUS.full, padding: 11, alignItems: 'center', marginTop: 12 },
  completeBtnText:{ color: COLORS.green, fontWeight: '700' },
  empty:          { alignItems: 'center', paddingTop: 80 },
  emptyText:      { color: 'rgba(253,246,236,0.4)', fontSize: ms(14) },
  overlay:        { flex: 1, backgroundColor: 'rgba(10,5,20,0.88)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: COLORS.deep2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, borderTopWidth: 1, borderColor: COLORS.border },
  modalTitle:     { fontSize: ms(18), fontWeight: '800', color: COLORS.goldLight, marginBottom: 6 },
  modalClient:    { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginBottom: 16 },
  lbl:            { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', marginBottom: 5, fontWeight: '500' },
  input:          { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.cream, fontSize: ms(14), marginBottom: 12 },
  modalBtns:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn:      { flex: 1, padding: 13, borderRadius: RADIUS.full, backgroundColor: 'rgba(232,84,122,0.12)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', alignItems: 'center' },
  rejectBtnText:  { color: COLORS.pink, fontWeight: '700' },
  acceptBtn:      { flex: 2, padding: 13, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center' },
  acceptBtnText:  { color: '#1A0A2E', fontWeight: '800', fontSize: ms(15) },
});
