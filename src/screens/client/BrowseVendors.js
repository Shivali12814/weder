import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { ms } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATS = [
  { value: '',                label: '🔍 All'             },
  { value: 'pandit',          label: '🛕 Pandit'          },
  { value: 'marriage_hall',   label: '🏛️ Marriage Hall'   },
  { value: 'tent_decoration', label: '⛺ Tent'             },
  { value: 'catering',        label: '👨‍🍳 Catering'       },
  { value: 'photographer',    label: '📸 Photographer'    },
  { value: 'dj_band',         label: '🎵 DJ / Band'       },
  { value: 'makeup_artist',   label: '💄 Makeup'          },
  { value: 'baraat_vehicle',  label: '🚗 Baraat'          },
  { value: 'dahej_shop',      label: '🏪 Dahej Shop'      },
  { value: 'jewellery',       label: '💍 Jewellery'       },
  { value: 'clothing',        label: '👗 Clothing'        },
  { value: 'electronics',     label: '📺 Electronics'     },
  { value: 'furniture',       label: '🛏️ Furniture'       },
  { value: 'florist',         label: '💐 Florist'         },
];

export default function BrowseVendors({ navigation }) {
  const insets = useSafeAreaInsets();
  const [vendors,   setVendors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [cat,       setCat]       = useState('');
  const [city,      setCity]      = useState('');
  const [search,    setSearch]    = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/vendors', {
        params: {
          ...(cat    && { category: cat }),
          ...(city   && { city }),
          ...(search && { search }),
        },
      });
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('BrowseVendors error:', e.message, e.response?.data);
      setError(e.response?.data?.message || 'Could not connect to server. Make sure the backend is running.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [cat, city]);

  const stars = (r) => '⭐'.repeat(Math.min(Math.round(r || 0), 5));

  return (
    <View style={s.container}>
      {/* Search */}
      <View style={[s.searchBar, { paddingTop: insets.top + ms(10) }]}>
        <TextInput style={s.searchInput} placeholder="🔍 Search vendor or service..." placeholderTextColor="rgba(253,246,236,0.3)"
          value={search} onChangeText={setSearch} onSubmitEditing={fetchVendors} returnKeyType="search" />
        <TextInput style={[s.searchInput, { maxWidth: 120 }]} placeholder="📍 City" placeholderTextColor="rgba(253,246,236,0.3)"
          value={city} onChangeText={setCity} onSubmitEditing={fetchVendors} returnKeyType="search" />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingVertical: 8, gap: 8 }}>
        {CATS.map(c => (
          <TouchableOpacity key={c.value} onPress={() => setCat(c.value)}
            style={[s.catChip, cat === c.value && s.catChipActive]}>
            <Text style={[s.catText, cat === c.value && s.catTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchVendors} style={s.retryBtn}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: SPACING.md, gap: 14, paddingBottom: ms(40) }}
          ListEmptyComponent={
            !error ? (
              <View style={s.empty}>
                <Text style={{ fontSize: ms(40), marginBottom: 12 }}>🔍</Text>
                <Text style={s.emptyText}>No vendors found{'\n'}Try a different city or category</Text>
              </View>
            ) : null
          }
          renderItem={({ item: v }) => {
            const vp = v.vendorProfile || {};
            return (
              <TouchableOpacity style={s.card} onPress={() => navigation.navigate('VendorDetail', { vendorId: v._id })}>
                <View style={s.cardTop}>
                  <View style={s.vendorAvatar}>
                    <Text style={s.vendorAvatarText}>{v.name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View style={s.vendorInfo}>
                    <Text style={s.vendorBiz}>{vp.businessName || v.name}</Text>
                    <Text style={s.vendorName}>{v.name}</Text>
                    <View style={s.tagRow}>
                      <Text style={s.catTag}>{CATS.find(c => c.value === vp.category)?.label || vp.category}</Text>
                      {vp.isVerified && <Text style={s.verTag}>✓ Verified</Text>}
                    </View>
                  </View>
                  <View style={s.ratingBox}>
                    <Text style={s.ratingNum}>{vp.rating?.toFixed(1) || '—'}</Text>
                    <Text style={s.ratingIcon}>⭐</Text>
                    <Text style={s.reviewCount}>{vp.reviewCount || 0} reviews</Text>
                  </View>
                </View>

                {vp.city && <Text style={s.city}>📍 {vp.city}{vp.address ? ` • ${vp.address}` : ''}</Text>}
                {vp.description && <Text style={s.desc} numberOfLines={2}>{vp.description}</Text>}

                {vp.priceRange?.min > 0 && (
                  <Text style={s.price}>₹{vp.priceRange.min.toLocaleString()} — ₹{vp.priceRange.max?.toLocaleString()}</Text>
                )}

                {/* Services preview */}
                {vp.services?.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {vp.services.slice(0, 3).map((svc, i) => (
                        <View key={i} style={s.svcTag}>
                          <Text style={s.svcTagText}>{svc.name}</Text>
                          {svc.price > 0 && <Text style={s.svcTagPrice}> ₹{svc.price.toLocaleString()}</Text>}
                        </View>
                      ))}
                      {vp.services.length > 3 && <View style={s.svcTag}><Text style={s.svcTagText}>+{vp.services.length - 3} more</Text></View>}
                    </View>
                  </ScrollView>
                )}

                <View style={s.cardActions}>
                  <TouchableOpacity style={s.detailBtn} onPress={() => navigation.navigate('VendorDetail', { vendorId: v._id })}>
                    <Text style={s.detailBtnText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.bookBtn} onPress={() => navigation.navigate('SendRequest', { vendor: v })}>
                    <Text style={s.bookBtnText}>📩 Send Request</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.deep },
  searchBar:       { flexDirection: 'row', gap: 8, padding: SPACING.md, paddingBottom: 0, paddingTop: 0 },
  searchInput:     { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 10, color: COLORS.cream, fontSize: ms(13) },
  catBar:          { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catChip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  catChipActive:   { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  catText:         { color: 'rgba(253,246,236,0.6)', fontSize: ms(12) },
  catTextActive:   { color: '#1A0A2E', fontWeight: '700' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:            { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  cardTop:         { flexDirection: 'row', gap: 12, marginBottom: 10 },
  vendorAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  vendorAvatarText:{ color: COLORS.gold, fontSize: ms(22), fontWeight: '800' },
  vendorInfo:      { flex: 1 },
  vendorBiz:       { fontSize: ms(15), fontWeight: '800', color: COLORS.cream },
  vendorName:      { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginTop: 1 },
  tagRow:          { flexDirection: 'row', gap: 6, marginTop: 4 },
  catTag:          { fontSize: ms(10), color: COLORS.gold, backgroundColor: 'rgba(201,168,76,0.12)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  verTag:          { fontSize: ms(10), color: COLORS.green, backgroundColor: 'rgba(72,199,142,0.12)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  ratingBox:       { alignItems: 'center' },
  ratingNum:       { fontSize: ms(18), fontWeight: '800', color: COLORS.gold },
  ratingIcon:      { fontSize: ms(12) },
  reviewCount:     { fontSize: ms(10), color: 'rgba(253,246,236,0.4)', marginTop: 1 },
  city:            { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', marginBottom: 4 },
  desc:            { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', lineHeight: 18, marginBottom: 6 },
  price:           { fontSize: ms(13), color: COLORS.gold, fontWeight: '600', marginBottom: 4 },
  svcTag:          { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row' },
  svcTagText:      { fontSize: ms(11), color: 'rgba(253,246,236,0.65)' },
  svcTagPrice:     { fontSize: ms(11), color: COLORS.gold },
  cardActions:     { flexDirection: 'row', gap: 10, marginTop: 12 },
  detailBtn:       { flex: 1, padding: 9, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.gold, alignItems: 'center' },
  detailBtnText:   { color: COLORS.gold, fontSize: ms(12), fontWeight: '600' },
  bookBtn:         { flex: 2, padding: 9, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center' },
  bookBtnText:     { color: '#1A0A2E', fontSize: ms(13), fontWeight: '800' },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyText:       { color: 'rgba(253,246,236,0.4)', fontSize: ms(14), textAlign: 'center', lineHeight: 22 },
  errorBanner:     { margin: SPACING.md, backgroundColor: 'rgba(232,84,122,0.12)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.35)', borderRadius: RADIUS.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorBannerText: { flex: 1, color: '#FF8FA8', fontSize: ms(12), lineHeight: 18 },
  retryBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(232,84,122,0.2)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.4)' },
  retryBtnText:    { color: '#FF8FA8', fontSize: ms(12), fontWeight: '700' },
});
