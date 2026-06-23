import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, FlatList,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import {
  getBookings, createBooking, updateBooking, deleteBooking, getWeddings,
} from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { ms } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SERVICE_TYPES = [
  { value: 'pandit',           label: 'Pandit Ji',       icon: '🛕' },
  { value: 'marriage_hall',    label: 'Marriage Hall',   icon: '🏛️' },
  { value: 'tent_decoration',  label: 'Tent & Decor',    icon: '⛺' },
  { value: 'catering',         label: 'Catering',        icon: '👨‍🍳' },
  { value: 'photographer',     label: 'Photographer',    icon: '📸' },
  { value: 'dj_band',          label: 'DJ / Band',       icon: '🎵' },
  { value: 'makeup_artist',    label: 'Makeup Artist',   icon: '💄' },
  { value: 'baraat_vehicle',   label: 'Baraat Vehicles', icon: '🚗' },
  { value: 'florist',          label: 'Florist',         icon: '💐' },
  { value: 'invitation_cards', label: 'Invitation Cards',icon: '📄' },
  { value: 'other',            label: 'Other',           icon: '🎪' },
];

const STATUS_CONFIG = {
  confirmed: { color: COLORS.green,  bg: COLORS.greenBg,  label: 'Confirmed', icon: '✅' },
  pending:   { color: COLORS.yellow, bg: COLORS.yellowBg, label: 'Pending',   icon: '⏳' },
  cancelled: { color: COLORS.pink,   bg: COLORS.pinkBg,   label: 'Cancelled', icon: '❌' },
};

const EMPTY_FORM = {
  serviceType: 'pandit', vendorName: '', vendorPhone: '',
  amount: '', advancePaid: '', status: 'pending', notes: '',
};

const svcInfo = (v) => SERVICE_TYPES.find(s => s.value === v) || { icon: '🎪', label: v };
const fmtINR  = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

// ─── Stats pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, color }) {
  return (
    <View style={[sp.wrap, { borderColor: color + '40' }]}>
      <Text style={sp.icon}>{icon}</Text>
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1 },
  icon:  { fontSize: ms(18), marginBottom: 3 },
  value: { fontSize: ms(15), fontWeight: '800', marginBottom: 1 },
  label: { fontSize: ms(9), color: 'rgba(253,246,236,0.45)', fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [weddingId, setWeddingId] = useState(null);
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [filter,    setFilter]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { initWedding(); }, []);

  const initWedding = async () => {
    try {
      const res = await getWeddings();
      if (res.data.length > 0) {
        const wid = res.data[0]._id;
        setWeddingId(wid);
        await fetchBookings(wid);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const fetchBookings = async (wid) => {
    try {
      const res = await getBookings({ weddingId: wid || weddingId });
      setBookings(res.data);
    } catch (e) { console.log(e); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      serviceType: b.serviceType, vendorName: b.vendorName,
      vendorPhone: b.vendorPhone || '',
      amount: String(b.amount || ''), advancePaid: String(b.advancePaid || ''),
      status: b.status, notes: b.notes || '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorName.trim()) return Alert.alert('Required', 'Please enter the vendor name.');
    setSaving(true);
    try {
      const payload = {
        ...form, wedding: weddingId,
        amount:      Number(form.amount)      || 0,
        advancePaid: Number(form.advancePaid) || 0,
      };
      if (editing) await updateBooking(editing._id, payload);
      else         await createBooking(payload);
      setModal(false);
      await fetchBookings();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Booking', 'This booking will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteBooking(id);
        await fetchBookings();
      }},
    ]);
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalAmount  = bookings.reduce((s, b) => s + (b.amount || 0), 0);
  const totalPaid    = bookings.reduce((s, b) => s + (b.advancePaid || 0), 0);
  const totalDue     = totalAmount - totalPaid;
  const confirmedCt  = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCt    = bookings.filter(b => b.status === 'pending').length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    if (filter && b.serviceType !== filter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={COLORS.gold} size="large" />
      <Text style={s.loadingText}>Loading your bookings…</Text>
    </View>
  );

  return (
    <View style={s.container}>

      {/* ── Stats Header ─────────────────────────────────────────────────── */}
      <View style={[s.statsHeader, { paddingTop: insets.top + ms(12) }]}>
        <View style={s.statsRow}>
          <StatPill icon="📋" value={bookings.length} label="Total"     color={COLORS.cream} />
          <StatPill icon="✅" value={confirmedCt}      label="Confirmed" color={COLORS.green} />
          <StatPill icon="⏳" value={pendingCt}         label="Pending"   color={COLORS.yellow} />
          <StatPill icon="❌" value={bookings.length - confirmedCt - pendingCt} label="Cancelled" color={COLORS.pink} />
        </View>
        <View style={s.budgetRow}>
          <View style={s.budgetBox}>
            <Text style={s.budgetLabel}>Total Budget</Text>
            <Text style={[s.budgetValue, { color: COLORS.gold }]}>{fmtINR(totalAmount)}</Text>
          </View>
          <View style={s.budgetDivider} />
          <View style={s.budgetBox}>
            <Text style={s.budgetLabel}>Advance Paid</Text>
            <Text style={[s.budgetValue, { color: COLORS.green }]}>{fmtINR(totalPaid)}</Text>
          </View>
          <View style={s.budgetDivider} />
          <View style={s.budgetBox}>
            <Text style={s.budgetLabel}>Balance Due</Text>
            <Text style={[s.budgetValue, { color: totalDue > 0 ? COLORS.pink : COLORS.textMuted }]}>{fmtINR(totalDue)}</Text>
          </View>
        </View>
      </View>

      {/* ── Service Type Filter ───────────────────────────────────────────── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
      >
        {[null, ...SERVICE_TYPES.map(t => t.value)].map(v => (
          <TouchableOpacity
            key={v || '__all__'}
            onPress={() => setFilter(v || '')}
            style={[s.chip, (filter === v || (!v && !filter)) && s.chipActive]}
            activeOpacity={0.75}
          >
            {v && <Text style={s.chipIcon}>{svcInfo(v).icon}</Text>}
            <Text style={[s.chipText, (filter === v || (!v && !filter)) && s.chipTextActive]}>
              {v ? svcInfo(v).label : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Status Filter ─────────────────────────────────────────────────── */}
      <View style={s.statusBar}>
        {[{ value: '', label: 'All', icon: '📋', color: COLORS.textMuted },
          ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, ...v }))
        ].map(st => (
          <TouchableOpacity key={st.value} onPress={() => setStatusFilter(st.value)}
            style={[s.statusTab, statusFilter === st.value && { borderBottomColor: st.color, borderBottomWidth: 2 }]}>
            <Text style={{ fontSize: ms(12) }}>{st.icon}</Text>
            <Text style={[s.statusTabText, statusFilter === st.value && { color: st.color, fontWeight: '700' }]}>
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Booking List ──────────────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>
              {filter || statusFilter ? 'No bookings match this filter' : 'No bookings yet'}
            </Text>
            <Text style={s.emptyText}>
              {filter || statusFilter
                ? 'Try clearing the filter to see all bookings.'
                : 'Tap the + button below to add your first vendor booking.'}
            </Text>
          </View>
        }
        renderItem={({ item: b }) => {
          const sc  = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
          const svc = svcInfo(b.serviceType);
          const due = (b.amount || 0) - (b.advancePaid || 0);
          return (
            <View style={s.card}>
              {/* Card top row */}
              <View style={s.cardTop}>
                <View style={[s.svcIconBox, { backgroundColor: sc.bg }]}>
                  <Text style={s.svcIconText}>{svc.icon}</Text>
                </View>
                <View style={s.cardMid}>
                  <Text style={s.svcName}>{svc.label}</Text>
                  <Text style={s.vendorName} numberOfLines={1}>{b.vendorName}</Text>
                  {b.vendorPhone ? <Text style={s.phoneText}>📞 {b.vendorPhone}</Text> : null}
                </View>
                <View style={[s.badge, { backgroundColor: sc.bg }]}>
                  <Text style={{ fontSize: ms(11) }}>{sc.icon}</Text>
                  <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              {/* Amount row */}
              {b.amount > 0 && (
                <View style={s.amountRow}>
                  <View style={s.amountItem}>
                    <Text style={s.amountLabel}>Total</Text>
                    <Text style={[s.amountValue, { color: COLORS.gold }]}>
                      {fmtINR(b.amount)}
                    </Text>
                  </View>
                  <View style={s.amountDivider} />
                  <View style={s.amountItem}>
                    <Text style={s.amountLabel}>Advance Paid</Text>
                    <Text style={[s.amountValue, { color: COLORS.green }]}>
                      {fmtINR(b.advancePaid || 0)}
                    </Text>
                  </View>
                  <View style={s.amountDivider} />
                  <View style={s.amountItem}>
                    <Text style={s.amountLabel}>Balance Due</Text>
                    <Text style={[s.amountValue, { color: due > 0 ? COLORS.pink : COLORS.textMuted }]}>
                      {fmtINR(due)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Notes */}
              {b.notes ? <Text style={s.notes} numberOfLines={2}>📝 {b.notes}</Text> : null}

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(b)} activeOpacity={0.7}>
                  <Text style={s.editBtnText}>✏️  Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(b._id)} activeOpacity={0.7}>
                  <Text style={s.deleteBtnText}>🗑️  Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>{editing ? '✏️ Edit Booking' : '➕ New Booking'}</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* Service Type */}
                <Text style={s.fieldLabel}>Service Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
                  <View style={s.typeRow}>
                    {SERVICE_TYPES.map(t => (
                      <TouchableOpacity
                        key={t.value}
                        onPress={() => setForm({ ...form, serviceType: t.value })}
                        style={[s.typeChip, form.serviceType === t.value && s.typeChipActive]}
                      >
                        <Text style={s.typeChipIcon}>{t.icon}</Text>
                        <Text style={[s.typeChipText, form.serviceType === t.value && s.typeChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Vendor Name */}
                <Text style={s.fieldLabel}>Vendor / Person Name *</Text>
                <TextInput
                  style={s.input}
                  value={form.vendorName}
                  onChangeText={v => setForm({ ...form, vendorName: v })}
                  placeholder="e.g. Pandit Ramesh Sharma"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                />

                {/* Phone */}
                <Text style={s.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={s.input}
                  value={form.vendorPhone}
                  onChangeText={v => setForm({ ...form, vendorPhone: v })}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />

                {/* Amount Row */}
                <View style={s.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Total Amount (₹)</Text>
                    <TextInput
                      style={s.input}
                      value={form.amount}
                      onChangeText={v => setForm({ ...form, amount: v })}
                      placeholder="50000"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Advance Paid (₹)</Text>
                    <TextInput
                      style={s.input}
                      value={form.advancePaid}
                      onChangeText={v => setForm({ ...form, advancePaid: v })}
                      placeholder="10000"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Status */}
                <Text style={s.fieldLabel}>Booking Status</Text>
                <View style={s.statusChips}>
                  {Object.entries(STATUS_CONFIG).map(([key, sc]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setForm({ ...form, status: key })}
                      style={[
                        s.statusChip,
                        form.status === key && { backgroundColor: sc.bg, borderColor: sc.color },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: ms(14) }}>{sc.icon}</Text>
                      <Text style={[s.statusChipText, form.status === key && { color: sc.color, fontWeight: '700' }]}>
                        {sc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes */}
                <Text style={s.fieldLabel}>Notes / Special Requirements</Text>
                <TextInput
                  style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                  value={form.notes}
                  onChangeText={v => setForm({ ...form, notes: v })}
                  placeholder="Delivery time, special requirements, package details…"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />

                {/* Modal Buttons */}
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                    {saving
                      ? <ActivityIndicator color={COLORS.deep} size="small" />
                      : <Text style={s.saveBtnText}>{editing ? 'Update' : 'Add Booking'}</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.deep },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep, gap: 12 },
  loadingText:  { color: COLORS.textMuted, fontSize: ms(13) },

  // Stats header
  statsHeader:  { backgroundColor: COLORS.deep2, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.18)', paddingHorizontal: SPACING.md, paddingBottom: 12 },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  budgetRow:    { flexDirection: 'row' },
  budgetBox:    { flex: 1, alignItems: 'center' },
  budgetLabel:  { fontSize: ms(10), color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  budgetValue:  { fontSize: ms(15), fontWeight: '800' },
  budgetDivider:{ width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 4 },

  // Filter
  filterBar:     { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  filterContent: { paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight },
  chipActive:    { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipIcon:      { fontSize: ms(13) },
  chipText:      { color: COLORS.textSecondary, fontSize: ms(12), fontWeight: '600' },
  chipTextActive:{ color: COLORS.deep, fontWeight: '700' },

  // Status filter bar
  statusBar:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, paddingHorizontal: SPACING.md },
  statusTab:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statusTabText: { fontSize: ms(11), color: COLORS.textMuted, fontWeight: '600' },

  // List
  listContent:   { padding: SPACING.md, gap: 12, paddingBottom: ms(120) },

  // Card
  card:          { backgroundColor: COLORS.deep2, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  svcIconBox:    { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  svcIconText:   { fontSize: ms(22) },
  cardMid:       { flex: 1, minWidth: 0 },
  svcName:       { fontSize: ms(15), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  vendorName:    { fontSize: ms(13), color: COLORS.textSecondary },
  phoneText:     { fontSize: ms(11), color: COLORS.textMuted, marginTop: 2 },
  badge:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.full },
  badgeText:     { fontSize: ms(11), fontWeight: '700' },

  amountRow:     { flexDirection: 'row', backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 10 },
  amountItem:    { flex: 1, alignItems: 'center' },
  amountLabel:   { fontSize: ms(10), color: COLORS.textMuted, marginBottom: 3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  amountValue:   { fontSize: ms(14), fontWeight: '800' },
  amountDivider: { width: 1, backgroundColor: COLORS.borderLight },
  notes:         { fontSize: ms(12), color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },
  actions:       { flexDirection: 'row', gap: 8 },
  editBtn:       { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  editBtnText:   { color: COLORS.gold, fontSize: ms(13), fontWeight: '700' },
  deleteBtn:     { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.pinkBg, borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', alignItems: 'center' },
  deleteBtnText: { color: COLORS.pink, fontSize: ms(13), fontWeight: '700' },

  // Empty
  empty:       { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIcon:   { fontSize: ms(56), marginBottom: 14 },
  emptyTitle:  { fontSize: ms(16), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  emptyText:   { color: COLORS.textMuted, fontSize: ms(13), textAlign: 'center', lineHeight: 20 },

  // FAB
  fab:     { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', ...SHADOWS.gold },
  fabText: { color: COLORS.deep, fontSize: ms(30), fontWeight: '700', lineHeight: 34 },

  // Modal / Sheet
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.deep2,
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 24,
    maxHeight: '92%',
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle:  { fontSize: ms(20), fontWeight: '800', color: COLORS.goldLight, marginBottom: SPACING.md },

  // Form
  fieldLabel:  { fontSize: ms(12), color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md, padding: 13,
    color: COLORS.textPrimary, fontSize: ms(14), marginBottom: 14,
  },
  twoCol:      { flexDirection: 'row', gap: 10 },
  typeScroll:  { marginBottom: 14 },
  typeRow:     { flexDirection: 'row', gap: 6 },
  typeChip:    { paddingHorizontal: 11, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeChipActive:   { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  typeChipIcon:     { fontSize: ms(14) },
  typeChipText:     { color: COLORS.textSecondary, fontSize: ms(12), fontWeight: '600' },
  typeChipTextActive: { color: COLORS.deep, fontWeight: '700' },
  statusChips: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusChip:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  statusChipText: { color: COLORS.textMuted, fontSize: ms(12), fontWeight: '600' },
  modalBtns:   { flexDirection: 'row', gap: 10, marginTop: SPACING.sm, marginBottom: 8 },
  cancelBtn:   { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  cancelBtnText:{ color: COLORS.gold, fontWeight: '700', fontSize: ms(14) },
  saveBtn:     { flex: 2, paddingVertical: 14, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center', ...SHADOWS.gold },
  saveBtnText: { color: COLORS.deep, fontWeight: '800', fontSize: ms(15) },
});
