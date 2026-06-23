import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { ms } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { value: 'pandit',          label: '🛕 Pandit'          },
  { value: 'marriage_hall',   label: '🏛️ Marriage Hall'   },
  { value: 'tent_decoration', label: '⛺ Tent & Decoration'},
  { value: 'catering',        label: '👨‍🍳 Catering'       },
  { value: 'photographer',    label: '📸 Photographer'    },
  { value: 'dj_band',         label: '🎵 DJ / Band'       },
  { value: 'makeup_artist',   label: '💄 Makeup Artist'   },
  { value: 'baraat_vehicle',  label: '🚗 Baraat Vehicle'  },
  { value: 'florist',         label: '💐 Florist'         },
  { value: 'jewellery',       label: '💍 Jewellery'       },
  { value: 'clothing',        label: '👗 Clothing'        },
  { value: 'dahej_shop',      label: '🏪 Dahej Shop'      },
];

function Field({ label, value, onChange, placeholder, multiline, keyboardType }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.lbl}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 90, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(253,246,236,0.3)"
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

export default function VendorProfile({ navigation }) {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const vp = user?.vendorProfile || {};

  const [form, setForm] = useState({
    businessName: vp.businessName  || '',
    category:     vp.category      || 'pandit',
    city:         vp.city          || '',
    address:      vp.address       || '',
    description:  vp.description   || '',
    whatsapp:     vp.whatsapp      || '',
    experience:   String(vp.experience || ''),
    priceMin:     String(vp.priceRange?.min || ''),
    priceMax:     String(vp.priceRange?.max || ''),
    isAvailable:  vp.isAvailable !== false,
    languages:    (vp.languages || []).join(', '),
    pujaTypes:    (vp.pujaTypes || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.businessName.trim()) return Alert.alert('Error', 'Business name is required.');
    setSaving(true);
    try {
      const payload = {
        vendorProfile: {
          businessName: form.businessName,
          category:     form.category,
          city:         form.city,
          address:      form.address,
          description:  form.description,
          whatsapp:     form.whatsapp,
          experience:   Number(form.experience) || 0,
          isAvailable:  form.isAvailable,
          priceRange: {
            min: Number(form.priceMin) || 0,
            max: Number(form.priceMax) || 0,
          },
          languages: form.languages ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
          pujaTypes: form.pujaTypes  ? form.pujaTypes.split(',').map(p => p.trim()).filter(Boolean) : [],
        },
      };
      const res = await API.put('/vendors/me/profile', payload);
      const meRes = await API.get('/auth/me');
      updateUser(meRes.data);
      Alert.alert('Saved!', 'Your profile has been updated successfully.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: SPACING.md, paddingTop: insets.top + ms(16), paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled">

      <View style={s.headerCard}>
        <Text style={s.headerTitle}>👤 Edit Your Vendor Profile</Text>
        <Text style={s.headerSub}>Keep your profile complete and accurate to attract more clients.</Text>
      </View>

      <Field label="Business Name *" value={form.businessName}
        onChange={v => set('businessName', v)} placeholder="e.g. Pandit Ramesh Sharma Ji" />

      {/* Category */}
      <Text style={s.lbl}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.value} onPress={() => set('category', c.value)}
              style={[s.catChip, form.category === c.value && s.catChipActive]}>
              <Text style={[s.catChipText, form.category === c.value && s.catChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Field label="City" value={form.city} onChange={v => set('city', v)} placeholder="e.g. New Delhi" />
      <Field label="Address / Area" value={form.address} onChange={v => set('address', v)}
        placeholder="e.g. Lajpat Nagar, New Delhi" />

      <Field label="About / Description" value={form.description} onChange={v => set('description', v)}
        multiline placeholder="Tell clients about your experience, specialization, and what makes you unique..." />

      <Field label="WhatsApp Number" value={form.whatsapp} onChange={v => set('whatsapp', v)}
        placeholder="e.g. 9876543210" keyboardType="phone-pad" />

      <Field label="Years of Experience" value={form.experience} onChange={v => set('experience', v)}
        placeholder="e.g. 15" keyboardType="numeric" />

      {/* Price Range */}
      <Text style={s.lbl}>Price Range (₹)</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <TextInput style={[s.input, { flex: 1 }]} value={form.priceMin}
          onChangeText={v => set('priceMin', v)} placeholder="Min (e.g. 5000)"
          placeholderTextColor="rgba(253,246,236,0.3)" keyboardType="numeric" />
        <TextInput style={[s.input, { flex: 1 }]} value={form.priceMax}
          onChangeText={v => set('priceMax', v)} placeholder="Max (e.g. 50000)"
          placeholderTextColor="rgba(253,246,236,0.3)" keyboardType="numeric" />
      </View>

      <Field label="Languages (comma separated)" value={form.languages}
        onChange={v => set('languages', v)} placeholder="e.g. Hindi, English, Sanskrit" />

      {/* Puja Types — only show for pandit */}
      {form.category === 'pandit' && (
        <Field label="Puja / Ceremonies Offered (comma separated)" value={form.pujaTypes}
          onChange={v => set('pujaTypes', v)}
          placeholder="e.g. Vivah Puja, Satyanarayan Katha, Griha Pravesh" />
      )}

      {/* Availability toggle */}
      <View style={s.availRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.availTitle}>Currently Available for Bookings</Text>
          <Text style={s.availSub}>Turn off if you are fully booked</Text>
        </View>
        <Switch
          value={form.isAvailable}
          onValueChange={v => set('isAvailable', v)}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(201,168,76,0.4)' }}
          thumbColor={form.isAvailable ? COLORS.gold : 'rgba(255,255,255,0.4)'}
        />
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#1A0A2E" />
          : <Text style={s.saveBtnText}>💾 Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.deep },
  headerCard:      { backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 20 },
  headerTitle:     { fontSize: ms(16), fontWeight: '800', color: COLORS.goldLight },
  headerSub:       { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 4, lineHeight: 18 },
  fieldWrap:       { marginBottom: 14 },
  lbl:             { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', marginBottom: 6, fontWeight: '500' },
  input:           { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', borderRadius: RADIUS.md, padding: 12, color: '#FDF6EC', fontSize: ms(14) },
  catChip:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)' },
  catChipActive:   { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  catChipText:     { color: 'rgba(253,246,236,0.6)', fontSize: ms(12) },
  catChipTextActive:{ color: '#1A0A2E', fontWeight: '700' },
  availRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', borderRadius: RADIUS.lg, padding: 14, marginBottom: 20 },
  availTitle:      { fontSize: ms(14), color: '#FDF6EC', fontWeight: '600' },
  availSub:        { fontSize: ms(11), color: 'rgba(253,246,236,0.45)', marginTop: 2 },
  saveBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  saveBtnText:     { color: '#1A0A2E', fontWeight: '800', fontSize: ms(16) },
});
