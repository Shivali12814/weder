import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { ms } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRICE_TYPES = [
  { value: 'fixed',      label: 'Fixed Price' },
  { value: 'per_person', label: 'Per Person'  },
  { value: 'per_day',    label: 'Per Day'     },
  { value: 'negotiable', label: 'Negotiable'  },
];

const EMPTY = { name: '', description: '', price: '', priceType: 'fixed', isAvailable: true };

export default function VendorServices() {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [modal,   setModal]   = useState(false);
  const [editing, setEdit]    = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const services = user?.vendorProfile?.services || [];

  const openAdd  = () => { setEdit(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = (s) => { setEdit(s); setForm({ name: s.name, description: s.description || '', price: String(s.price || ''), priceType: s.priceType || 'fixed', isAvailable: s.isAvailable }); setModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Please enter a service name.');
    setSaving(true);
    try {
      let res;
      if (editing) res = await API.put(`/vendors/me/services/${editing._id}`, { ...form, price: Number(form.price) || 0 });
      else         res = await API.post('/vendors/me/services',               { ...form, price: Number(form.price) || 0 });
      // Refresh user profile
      const meRes = await API.get('/auth/me');
      updateUser(meRes.data);
      setModal(false);
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => Alert.alert('Delete Service?', 'This service will be permanently removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await API.delete(`/vendors/me/services/${id}`);
      const meRes = await API.get('/auth/me');
      updateUser(meRes.data);
    }},
  ]);

  return (
    <View style={s.container}>
      <FlatList
        data={services}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: SPACING.md, paddingTop: insets.top + ms(16), gap: 12, paddingBottom: ms(120) }}
        ListHeaderComponent={
          <View style={s.headerCard}>
            <Text style={s.headerTitle}>🛠️ Manage Your Services</Text>
            <Text style={s.headerSub}>Clients will see these services when browsing your profile and sending booking requests.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: ms(40), marginBottom: 12 }}>🛠️</Text>
            <Text style={s.emptyText}>No services added yet.{'\n'}Tap + to add your first service!</Text>
          </View>
        }
        renderItem={({ item: svc }) => (
          <View style={s.svcCard}>
            <View style={s.svcTop}>
              <View style={s.svcInfo}>
                <Text style={s.svcName}>{svc.name}</Text>
                {svc.description ? <Text style={s.svcDesc} numberOfLines={2}>{svc.description}</Text> : null}
              </View>
              <View style={[s.availBadge, { backgroundColor: svc.isAvailable ? 'rgba(72,199,142,0.15)' : 'rgba(128,128,128,0.15)' }]}>
                <Text style={{ fontSize: ms(10), color: svc.isAvailable ? COLORS.green : 'gray', fontWeight: '600' }}>
                  {svc.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
            {svc.price > 0 && (
              <Text style={s.svcPrice}>
                ₹{svc.price.toLocaleString()}
                <Text style={s.svcPriceType}> / {PRICE_TYPES.find(p => p.value === svc.priceType)?.label || svc.priceType}</Text>
              </Text>
            )}
            <View style={s.svcActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => openEdit(svc)}>
                <Text style={s.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(svc._id)}>
                <Text style={s.delBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editing ? 'Edit Service' : 'Add New Service'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.lbl}>Service Name *</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })}
                placeholder="e.g. Bridal Makeup, Full Catering, etc." placeholderTextColor="rgba(253,246,236,0.3)" />

              <Text style={s.lbl}>Description</Text>
              <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={form.description}
                onChangeText={v => setForm({ ...form, description: v })} multiline
                placeholder="Describe what's included in this service..." placeholderTextColor="rgba(253,246,236,0.3)" />

              <Text style={s.lbl}>Price (₹)</Text>
              <TextInput style={s.input} value={form.price} onChangeText={v => setForm({ ...form, price: v })}
                keyboardType="numeric" placeholder="e.g. 15000" placeholderTextColor="rgba(253,246,236,0.3)" />

              <Text style={s.lbl}>Price Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {PRICE_TYPES.map(pt => (
                  <TouchableOpacity key={pt.value} onPress={() => setForm({ ...form, priceType: pt.value })}
                    style={[s.ptChip, form.priceType === pt.value && s.ptChipActive]}>
                    <Text style={[s.ptText, form.priceType === pt.value && s.ptTextActive]}>{pt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={s.availRow} onPress={() => setForm({ ...form, isAvailable: !form.isAvailable })}>
                <View style={[s.checkbox, form.isAvailable && s.checkboxActive]}>
                  {form.isAvailable && <Text style={{ color: '#1A0A2E', fontSize: ms(11), fontWeight: '800' }}>✓</Text>}
                </View>
                <Text style={{ color: 'rgba(253,246,236,0.7)', fontSize: ms(14) }}>Currently Available</Text>
              </TouchableOpacity>

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={s.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Service'}</Text>
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
  container:     { flex: 1, backgroundColor: COLORS.deep },
  headerCard:    { backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 16 },
  headerTitle:   { fontSize: ms(16), fontWeight: '800', color: COLORS.goldLight },
  headerSub:     { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 4 },
  svcCard:       { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  svcTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  svcInfo:       { flex: 1 },
  svcName:       { fontSize: ms(15), fontWeight: '700', color: COLORS.cream },
  svcDesc:       { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 3, lineHeight: 18 },
  availBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  svcPrice:      { fontSize: ms(16), fontWeight: '800', color: COLORS.gold, marginBottom: 8 },
  svcPriceType:  { fontSize: ms(12), fontWeight: '400', color: 'rgba(253,246,236,0.5)' },
  svcActions:    { flexDirection: 'row', gap: 8 },
  editBtn:       { flex: 1, padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold, alignItems: 'center' },
  editBtnText:   { color: COLORS.gold, fontSize: ms(12), fontWeight: '600' },
  delBtn:        { flex: 1, padding: 8, borderRadius: RADIUS.md, backgroundColor: 'rgba(232,84,122,0.1)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.25)', alignItems: 'center' },
  delBtnText:    { color: COLORS.pink, fontSize: ms(12), fontWeight: '600' },
  fab:           { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  fabText:       { color: '#1A0A2E', fontSize: ms(28), fontWeight: '700', lineHeight: 32 },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { color: 'rgba(253,246,236,0.4)', fontSize: ms(14), textAlign: 'center', lineHeight: 22 },
  overlay:       { flex: 1, backgroundColor: 'rgba(10,5,20,0.88)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: COLORS.deep2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%', borderTopWidth: 1, borderColor: COLORS.border },
  modalTitle:    { fontSize: ms(18), fontWeight: '800', color: COLORS.goldLight, marginBottom: SPACING.md },
  lbl:           { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', marginBottom: 5, fontWeight: '500' },
  input:         { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.cream, fontSize: ms(14), marginBottom: 12 },
  ptChip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  ptChipActive:  { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  ptText:        { color: 'rgba(253,246,236,0.6)', fontSize: ms(12) },
  ptTextActive:  { color: '#1A0A2E', fontWeight: '700' },
  availRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  checkboxActive:{ backgroundColor: COLORS.gold },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: SPACING.md },
  cancelBtn:     { flex: 1, padding: 13, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.gold, alignItems: 'center' },
  cancelBtnText: { color: COLORS.gold, fontWeight: '700' },
  saveBtn:       { flex: 2, padding: 13, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center' },
  saveBtnText:   { color: '#1A0A2E', fontWeight: '700', fontSize: ms(15) },
});
