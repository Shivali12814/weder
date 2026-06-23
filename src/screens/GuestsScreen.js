import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { getGuests, createGuest, updateGuest, deleteGuest, getWeddings } from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { ms } from '../utils/responsive';

const RSVP = {
  confirmed: { color: COLORS.green,  bg: COLORS.greenBg,  label: 'Confirmed' },
  pending:   { color: COLORS.yellow, bg: COLORS.yellowBg, label: 'Pending'   },
  declined:  { color: COLORS.pink,   bg: COLORS.pinkBg,   label: 'Declined'  },
};

const SIDE = {
  groom:  { color: COLORS.blue, bg: COLORS.blueBg,  label: "Groom's Side" },
  bride:  { color: COLORS.pink, bg: COLORS.pinkBg,  label: "Bride's Side"  },
  common: { color: COLORS.gold, bg: COLORS.goldBg,  label: 'Both Sides'   },
};

const EMPTY_FORM = { name: '', phone: '', relation: '', side: 'common', rsvp: 'pending', plusOne: false, tableNo: '' };

export default function GuestsScreen() {
  const [weddingId, setWeddingId] = useState(null);
  const [guests,    setGuests]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [filter,    setFilter]    = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { initWedding(); }, []);

  const initWedding = async () => {
    try {
      const res = await getWeddings();
      if (res.data.length > 0) { setWeddingId(res.data[0]._id); fetchGuests(res.data[0]._id, ''); }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const fetchGuests = async (wid, rsvpFilter) => {
    try {
      const res = await getGuests({
        weddingId: wid || weddingId,
        ...(rsvpFilter && { rsvp: rsvpFilter }),
      });
      setGuests(res.data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { if (weddingId) fetchGuests(weddingId, filter); }, [filter]);

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({
      name: g.name, phone: g.phone || '', relation: g.relation || '',
      side: g.side, rsvp: g.rsvp, plusOne: g.plusOne,
      tableNo: String(g.tableNo || ''),
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Please enter the guest name.');
    setSaving(true);
    try {
      const payload = { ...form, wedding: weddingId, tableNo: Number(form.tableNo) || undefined };
      if (editing) await updateGuest(editing._id, payload);
      else         await createGuest(payload);
      setModal(false); fetchGuests(weddingId, filter);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) =>
    Alert.alert('Remove Guest', 'This guest will be removed from your list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteGuest(id); fetchGuests(weddingId, filter);
      }},
    ]);

  const confirmed = guests.filter(g => g.rsvp === 'confirmed').length;
  const pending   = guests.filter(g => g.rsvp === 'pending').length;
  const declined  = guests.filter(g => g.rsvp === 'declined').length;

  if (loading) {
    return (
      <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>
    );
  }

  return (
    <View style={s.container}>
      {/* Stats */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{guests.length}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: COLORS.green }]}>{confirmed}</Text>
          <Text style={s.statLabel}>Confirmed</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: COLORS.yellow }]}>{pending}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: COLORS.pink }]}>{declined}</Text>
          <Text style={s.statLabel}>Declined</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 8 }}
      >
        {['', 'confirmed', 'pending', 'declined'].map(v => (
          <TouchableOpacity
            key={v || '__all__'}
            onPress={() => setFilter(v)}
            style={[s.chip, filter === v && s.chipActive]}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, filter === v && s.chipTextActive]}>
              {v ? RSVP[v].label : 'All Guests'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Guest List */}
      <FlatList
        data={guests}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: SPACING.md, gap: 10, paddingBottom: ms(120) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTitle}>No guests yet</Text>
            <Text style={s.emptyText}>Tap + to start adding guests to your list.</Text>
          </View>
        }
        renderItem={({ item: g }) => {
          const rc = RSVP[g.rsvp] || RSVP.pending;
          const sc = SIDE[g.side] || SIDE.common;
          return (
            <View style={s.guestCard}>
              <View style={s.guestMain}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{g.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.guestInfo}>
                  <Text style={s.guestName}>{g.name} {g.plusOne ? '(+1)' : ''}</Text>
                  {g.phone    ? <Text style={s.guestMeta}>📞 {g.phone}</Text>    : null}
                  {g.relation ? <Text style={s.guestMeta}>👤 {g.relation}</Text> : null}
                  <View style={s.badgeRow}>
                    <View style={[s.badge, { backgroundColor: rc.bg }]}>
                      <Text style={[s.badgeText, { color: rc.color }]}>{rc.label}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.guestActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(g)} activeOpacity={0.7}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(g._id)} activeOpacity={0.7}>
                  <Text style={s.delBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editing ? 'Edit Guest' : 'Add Guest'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Guest Name *</Text>
              <TextInput
                style={s.input}
                value={form.name}
                onChangeText={v => setForm({ ...form, name: v })}
                placeholder="e.g. Ramesh Chacha"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Phone</Text>
                  <TextInput
                    style={s.input}
                    value={form.phone}
                    onChangeText={v => setForm({ ...form, phone: v })}
                    placeholder="9876543210"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Relation</Text>
                  <TextInput
                    style={s.input}
                    value={form.relation}
                    onChangeText={v => setForm({ ...form, relation: v })}
                    placeholder="Uncle, Mausi…"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <Text style={s.fieldLabel}>Side</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {Object.entries(SIDE).map(([key, sc]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setForm({ ...form, side: key })}
                    style={[s.sideChip, form.side === key && { backgroundColor: sc.bg, borderColor: sc.color }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.sideChipText, form.side === key && { color: sc.color, fontWeight: '700' }]}>
                      {sc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>RSVP Status</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {Object.entries(RSVP).map(([key, rc]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setForm({ ...form, rsvp: key })}
                    style={[s.rsvpChip, form.rsvp === key && { backgroundColor: rc.bg, borderColor: rc.color }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.rsvpChipText, form.rsvp === key && { color: rc.color, fontWeight: '700' }]}>
                      {rc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={s.checkRow}
                onPress={() => setForm({ ...form, plusOne: !form.plusOne })}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, form.plusOne && s.checkboxActive]}>
                  {form.plusOne && <Text style={s.checkTick}>✓</Text>}
                </View>
                <Text style={s.checkLabel}>Guest is bringing a plus one</Text>
              </TouchableOpacity>

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={s.saveBtnText}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Guest'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.deep },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep },

  // Stats
  statsBar:     { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  statItem:     { flex: 1, alignItems: 'center' },
  statNum:      { fontSize: ms(20), fontWeight: '800', color: COLORS.textPrimary },
  statLabel:    { fontSize: ms(10), color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  statDivider:  { width: 1, backgroundColor: COLORS.borderLight, marginVertical: 4 },

  // Filter
  filterBar:      { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight },
  chipActive:     { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText:       { color: COLORS.textSecondary, fontSize: ms(12), fontWeight: '600' },
  chipTextActive: { color: COLORS.deep, fontWeight: '700' },

  // Guest Card
  guestCard:   { backgroundColor: COLORS.deep2, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  guestMain:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  avatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.goldBg, borderWidth: 1.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText:  { color: COLORS.gold, fontSize: ms(18), fontWeight: '800' },
  guestInfo:   { flex: 1 },
  guestName:   { fontSize: ms(15), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  guestMeta:   { fontSize: ms(12), color: COLORS.textSecondary, marginTop: 1 },
  badgeRow:    { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  badge:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText:   { fontSize: ms(10), fontWeight: '700' },
  guestActions:{ flexDirection: 'row', gap: 8 },
  editBtn:     { flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  editBtnText: { color: COLORS.gold, fontSize: ms(12), fontWeight: '700' },
  delBtn:      { flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.pinkBg, borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', alignItems: 'center' },
  delBtnText:  { color: COLORS.pink, fontSize: ms(12), fontWeight: '700' },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.lg },
  emptyIcon:  { fontSize: ms(52), marginBottom: 12 },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText:  { color: COLORS.textMuted, fontSize: ms(13), textAlign: 'center', lineHeight: 20 },

  // FAB
  fab:     { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.blue, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.blue, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  fabText: { color: COLORS.deep, fontSize: ms(30), fontWeight: '700', lineHeight: 34 },

  // Sheet
  overlay:     { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet:       { backgroundColor: COLORS.deep2, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg, maxHeight: '92%', borderTopWidth: 1, borderColor: COLORS.border },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle:  { fontSize: ms(20), fontWeight: '800', color: COLORS.goldLight, marginBottom: SPACING.md },

  // Form
  fieldLabel:   { fontSize: ms(12), color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input:        { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: 13, color: COLORS.textPrimary, fontSize: ms(14), marginBottom: 14 },
  sideChip:     { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center' },
  sideChipText: { color: COLORS.textMuted, fontSize: ms(11), fontWeight: '600' },
  rsvpChip:     { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center' },
  rsvpChipText: { color: COLORS.textMuted, fontSize: ms(11), fontWeight: '600' },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.gold },
  checkTick:    { color: COLORS.deep, fontSize: ms(12), fontWeight: '900' },
  checkLabel:   { color: COLORS.textSecondary, fontSize: ms(14) },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: SPACING.sm, marginBottom: SPACING.md },
  cancelBtn:    { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  cancelBtnText:{ color: COLORS.gold, fontWeight: '700', fontSize: ms(14) },
  saveBtn:      { flex: 2, paddingVertical: 14, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center', ...SHADOWS.gold },
  saveBtnText:  { color: COLORS.deep, fontWeight: '800', fontSize: ms(15) },
});
