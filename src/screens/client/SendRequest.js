import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

export default function SendRequest({ route, navigation }) {
  const { vendor } = route.params;
  const vp = vendor?.vendorProfile || {};
  const [form, setForm] = useState({
    eventDate: '', message: '', budget: '',
    guestCount: '', venue: '', selectedServices: [],
  });
  const [loading, setLoading] = useState(false);

  const toggleService = (name) => {
    setForm(f => ({
      ...f,
      selectedServices: f.selectedServices.includes(name)
        ? f.selectedServices.filter(s => s !== name)
        : [...f.selectedServices, name],
    }));
  };

  const handleSend = async () => {
    if (!form.eventDate.trim()) return Alert.alert('Error', 'Event date is required.');
    setLoading(true);
    try {
      const res = await API.post(`/vendors/${vendor._id}/request`, {
        eventDate:        form.eventDate,
        message:          form.message,
        budget:           Number(form.budget) || undefined,
        guestCount:       Number(form.guestCount) || undefined,
        venue:            form.venue,
        selectedServices: form.selectedServices,
        serviceType:      vp.category || 'other',
      });
      Alert.alert('Sent! 🎉', res.data.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send request. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled">

      {/* Vendor Info Header */}
      <View style={s.vendorCard}>
        <View style={s.vendorAvatar}>
          <Text style={s.vendorAvatarText}>{vendor.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={s.vendorInfo}>
          <Text style={s.vendorBiz}>{vp.businessName || vendor.name}</Text>
          <Text style={s.vendorCat}>{vp.category?.replace(/_/g,' ')}</Text>
          <Text style={s.vendorCity}>📍 {vp.city}</Text>
        </View>
        {vp.isVerified && <Text style={s.verified}>✓ Verified</Text>}
      </View>

      <Text style={s.pageTitle}>📩 Send Booking Request</Text>

      {/* Services Selection */}
      {vp.services?.length > 0 && (
        <>
          <Text style={s.lbl}>Select Services (optional)</Text>
          <View style={s.servicesGrid}>
            {vp.services.map((svc, i) => (
              <TouchableOpacity key={i} onPress={() => toggleService(svc.name)}
                style={[s.svcChip, form.selectedServices.includes(svc.name) && s.svcChipActive]}>
                <Text style={[s.svcChipText, form.selectedServices.includes(svc.name) && s.svcChipTextActive]}>
                  {svc.name}
                </Text>
                {svc.price > 0 && (
                  <Text style={[s.svcChipPrice, form.selectedServices.includes(svc.name) && { color: '#1A0A2E' }]}>
                    {' '}₹{svc.price.toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Event Date */}
      <Text style={s.lbl}>Event Date * (YYYY-MM-DD)</Text>
      <TextInput style={s.input} value={form.eventDate} onChangeText={v => setForm({ ...form, eventDate: v })}
        placeholder="e.g. 2026-11-25" placeholderTextColor="rgba(253,246,236,0.3)" />

      {/* Guest Count */}
      <Text style={s.lbl}>Expected Guests</Text>
      <TextInput style={s.input} value={form.guestCount} onChangeText={v => setForm({ ...form, guestCount: v })}
        keyboardType="numeric" placeholder="e.g. 200" placeholderTextColor="rgba(253,246,236,0.3)" />

      {/* Venue */}
      <Text style={s.lbl}>Event Venue / Location</Text>
      <TextInput style={s.input} value={form.venue} onChangeText={v => setForm({ ...form, venue: v })}
        placeholder="e.g. Tulsi Banquet Hall, Prayagraj" placeholderTextColor="rgba(253,246,236,0.3)" />

      {/* Budget */}
      <Text style={s.lbl}>Your Budget (₹)</Text>
      <TextInput style={s.input} value={form.budget} onChangeText={v => setForm({ ...form, budget: v })}
        keyboardType="numeric" placeholder="e.g. 50000" placeholderTextColor="rgba(253,246,236,0.3)" />

      {/* Message */}
      <Text style={s.lbl}>Message to Vendor</Text>
      <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]}
        value={form.message} onChangeText={v => setForm({ ...form, message: v })} multiline
        placeholder="Describe your requirements — what you need, special requests, preferences..."
        placeholderTextColor="rgba(253,246,236,0.3)" />

      {/* Note */}
      <View style={s.noteCard}>
        <Text style={s.noteText}>💡 After you send the request, the vendor will review it and accept or reject. You can contact them once accepted.</Text>
      </View>

      <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={loading}>
        {loading ? <ActivityIndicator color="#1A0A2E" /> : <Text style={s.sendBtnText}>📩 Send Request</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.deep },
  vendorCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 20 },
  vendorAvatar:      { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center' },
  vendorAvatarText:  { color: COLORS.gold, fontSize: ms(20), fontWeight: '800' },
  vendorInfo:        { flex: 1 },
  vendorBiz:         { fontSize: ms(15), fontWeight: '800', color: COLORS.cream },
  vendorCat:         { fontSize: ms(12), color: COLORS.gold, marginTop: 2, textTransform: 'capitalize' },
  vendorCity:        { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 1 },
  verified:          { fontSize: ms(11), color: COLORS.green, backgroundColor: 'rgba(72,199,142,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  pageTitle:         { fontSize: ms(18), fontWeight: '800', color: COLORS.goldLight, marginBottom: 20 },
  lbl:               { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', marginBottom: 6, fontWeight: '500' },
  input:             { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.cream, fontSize: ms(14), marginBottom: 14 },
  servicesGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  svcChip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row' },
  svcChipActive:     { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  svcChipText:       { color: 'rgba(253,246,236,0.65)', fontSize: ms(12) },
  svcChipTextActive: { color: '#1A0A2E', fontWeight: '700' },
  svcChipPrice:      { fontSize: ms(11), color: 'rgba(253,246,236,0.5)' },
  noteCard:          { backgroundColor: 'rgba(99,179,237,0.08)', borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  noteText:          { fontSize: ms(12), color: 'rgba(253,246,236,0.6)', lineHeight: 18 },
  sendBtn:           { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, padding: 15, alignItems: 'center' },
  sendBtnText:       { color: '#1A0A2E', fontWeight: '800', fontSize: ms(16) },
});
