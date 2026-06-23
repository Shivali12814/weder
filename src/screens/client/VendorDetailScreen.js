import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import API from '../../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { wp, ms } from '../../utils/responsive';

// Responsive sizing via ms() from responsive.js

const CAT_ICONS = {
  pandit:          '🛕',
  marriage_hall:   '🏛️',
  tent_decoration: '⛺',
  catering:        '👨‍🍳',
  photographer:    '📸',
  dj_band:         '🎵',
  makeup_artist:   '💄',
  baraat_vehicle:  '🚗',
  dahej_shop:      '🏪',
  jewellery:       '💍',
  clothing:        '👗',
  electronics:     '📺',
  furniture:       '🛏️',
  florist:         '💐',
};

const PRICE_TYPE_LABELS = {
  fixed:      'Fixed',
  per_person: 'Per Person',
  per_day:    'Per Day',
  negotiable: 'Negotiable',
};

function InfoRow({ icon, label, val, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View style={s.infoRow}>
        <View style={s.infoIconBox}><Text style={s.infoIconText}>{icon}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.infoLabel}>{label}</Text>
          <Text style={[s.infoVal, onPress && { color: COLORS.gold }]}>{val}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VendorDetailScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/vendors/${vendorId}`)
      .then(r => setData(r.data))
      .catch(e => console.log(e))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>
  );

  if (!data?.vendor) return (
    <View style={s.center}>
      <Text style={s.errorText}>Vendor not found.</Text>
    </View>
  );

  const { vendor, reviews = [] } = data;
  const vp      = vendor.vendorProfile || {};
  const catIcon = CAT_ICONS[vp.category] || '🏪';
  const catLabel = vp.category?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Vendor';

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (vp.rating?.toFixed(1) || null);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.deep }}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero Card ── */}
        <View style={s.hero}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarIcon}>{catIcon}</Text>
            </View>
            {vp.isVerified && (
              <View style={s.verBadge}><Text style={s.verBadgeText}>✓ Verified</Text></View>
            )}
          </View>

          <Text style={s.bizName}>{vp.businessName || vendor.name}</Text>
          <Text style={s.ownerName}>by {vendor.name}</Text>

          <View style={s.heroTags}>
            <View style={s.catPill}>
              <Text style={s.catPillText}>{catIcon} {catLabel}</Text>
            </View>
            {vp.city && (
              <View style={s.cityPill}>
                <Text style={s.cityPillText}>📍 {vp.city}</Text>
              </View>
            )}
          </View>

          <View style={s.ratingRow}>
            {avgRating && (
              <>
                <Text style={s.ratingNum}>{avgRating}</Text>
                <Text style={s.ratingStar}>⭐</Text>
                <Text style={s.reviewCount}>({vp.reviewCount || reviews.length} reviews)</Text>
              </>
            )}
            {vp.experience > 0 && (
              <View style={s.expBadge}>
                <Text style={s.expText}>{vp.experience}+ yrs exp</Text>
              </View>
            )}
          </View>

          {vp.priceRange?.min > 0 && (
            <View style={s.priceRangeRow}>
              <Text style={s.priceRangeLabel}>Starting from</Text>
              <Text style={s.priceRangeVal}>
                ₹{vp.priceRange.min?.toLocaleString('en-IN')}
                {vp.priceRange.max ? ` — ₹${vp.priceRange.max?.toLocaleString('en-IN')}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── About ── */}
        {vp.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.description}>{vp.description}</Text>
          </View>
        ) : null}

        {/* ── Contact ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Details</Text>
          <View style={s.infoCard}>
            {vendor.phone ? (
              <InfoRow icon="📞" label="Phone" val={vendor.phone}
                onPress={() => Linking.openURL(`tel:${vendor.phone}`)} />
            ) : null}
            {vp.whatsapp ? (
              <InfoRow icon="💬" label="WhatsApp" val={vp.whatsapp}
                onPress={() => Linking.openURL(`https://wa.me/91${vp.whatsapp}`)} />
            ) : null}
            {vp.address ? (
              <InfoRow icon="🏠" label="Address" val={vp.address} />
            ) : null}
            {vp.city ? (
              <InfoRow icon="📍" label="City" val={vp.city} />
            ) : null}
          </View>
        </View>

        {/* ── Services & Pricing ── */}
        {vp.services?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services & Pricing</Text>
            {vp.services.map((svc, i) => (
              <View key={i} style={s.svcCard}>
                <View style={s.svcLeft}>
                  <View style={s.svcNumBox}>
                    <Text style={s.svcNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.svcName}>{svc.name}</Text>
                    {svc.description ? (
                      <Text style={s.svcDesc}>{svc.description}</Text>
                    ) : null}
                  </View>
                </View>
                {svc.price > 0 ? (
                  <View style={s.svcPriceWrap}>
                    <Text style={s.svcPrice}>₹{svc.price?.toLocaleString('en-IN')}</Text>
                    <Text style={s.svcPriceType}>{PRICE_TYPE_LABELS[svc.priceType] || svc.priceType || 'Fixed'}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* ── Puja Types (pandit specific) ── */}
        {vp.pujaTypes?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ceremonies Performed</Text>
            <View style={s.tagsWrap}>
              {vp.pujaTypes.map((p, i) => (
                <View key={i} style={s.pujaTag}>
                  <Text style={s.pujaTagText}>🕉 {p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Stats strip ── */}
        {(vp.totalBookings > 0 || vp.completedBookings > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Track Record</Text>
            <View style={s.statsStrip}>
              {vp.totalBookings > 0 && (
                <View style={s.statBox}>
                  <Text style={s.statNum}>{vp.totalBookings}</Text>
                  <Text style={s.statLbl}>Bookings</Text>
                </View>
              )}
              {vp.completedBookings > 0 && (
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: COLORS.green }]}>{vp.completedBookings}</Text>
                  <Text style={s.statLbl}>Completed</Text>
                </View>
              )}
              {avgRating && (
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: COLORS.gold }]}>{avgRating}</Text>
                  <Text style={s.statLbl}>Avg Rating</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Languages ── */}
        {vp.languages?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Languages</Text>
            <View style={s.tagsWrap}>
              {vp.languages.map((l, i) => (
                <View key={i} style={s.langTag}>
                  <Text style={s.langTagText}>🌐 {l}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Customer Reviews ({reviews.length})</Text>
            {reviews.slice(0, 6).map((r, i) => (
              <View key={i} style={s.reviewCard}>
                <View style={s.reviewTop}>
                  <View style={s.reviewAvatar}>
                    <Text style={s.reviewAvatarText}>{r.client?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewerName}>{r.client?.name || 'Anonymous'}</Text>
                    <Text style={s.reviewDate}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={s.reviewRatingBox}>
                    <Text style={s.reviewRatingNum}>{r.rating?.toFixed(1)}</Text>
                    <Text style={s.reviewRatingStar}>⭐</Text>
                  </View>
                </View>
                {r.comment ? (
                  <Text style={s.reviewComment}>"{r.comment}"</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ── Floating Book Button ── */}
      <View style={s.ctaBar}>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('SendRequest', { vendor })}
        >
          <Text style={s.ctaBtnText}>📩 Send Booking Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.deep },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep },
  errorText:       { color: COLORS.cream, fontSize: ms(16) },

  // Hero
  hero:            { padding: SPACING.lg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarWrap:      { position: 'relative', marginBottom: 14 },
  avatar:          { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  avatarIcon:      { fontSize: ms(38) },
  verBadge:        { position: 'absolute', bottom: -4, right: -6, backgroundColor: 'rgba(72,199,142,0.18)', borderWidth: 1, borderColor: COLORS.green, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  verBadgeText:    { fontSize: ms(10), color: COLORS.green, fontWeight: '700' },
  bizName:         { fontSize: ms(22), fontWeight: '800', color: COLORS.goldLight, textAlign: 'center', marginBottom: 4 },
  ownerName:       { fontSize: ms(13), color: COLORS.textSecondary, marginBottom: 12 },
  heroTags:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catPill:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: COLORS.border },
  catPillText:     { fontSize: ms(12), color: COLORS.gold, fontWeight: '600', textTransform: 'capitalize' },
  cityPill:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  cityPillText:    { fontSize: ms(12), color: COLORS.textSecondary },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  ratingNum:       { fontSize: ms(20), fontWeight: '800', color: COLORS.gold },
  ratingStar:      { fontSize: ms(14) },
  reviewCount:     { fontSize: ms(12), color: COLORS.textMuted, marginRight: 8 },
  expBadge:        { backgroundColor: 'rgba(99,179,237,0.12)', borderWidth: 1, borderColor: 'rgba(99,179,237,0.3)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  expText:         { fontSize: ms(11), color: COLORS.blue, fontWeight: '600' },
  priceRangeRow:   { alignItems: 'center' },
  priceRangeLabel: { fontSize: ms(11), color: COLORS.textMuted, marginBottom: 2 },
  priceRangeVal:   { fontSize: ms(16), fontWeight: '800', color: COLORS.gold },

  // Section
  section:         { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 4 },
  sectionTitle:    { fontSize: ms(15), fontWeight: '800', color: COLORS.goldLight, marginBottom: 12, letterSpacing: 0.3 },
  description:     { fontSize: ms(14), color: COLORS.textSecondary, lineHeight: 22 },

  // Info Card
  infoCard:        { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, overflow: 'hidden' },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoIconBox:     { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: 'rgba(201,168,76,0.12)', justifyContent: 'center', alignItems: 'center' },
  infoIconText:    { fontSize: ms(16) },
  infoLabel:       { fontSize: ms(11), color: COLORS.textMuted, marginBottom: 2 },
  infoVal:         { fontSize: ms(14), color: COLORS.textPrimary, fontWeight: '500' },

  // Services
  svcCard:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, marginBottom: 8 },
  svcLeft:         { flexDirection: 'row', gap: 10, flex: 1 },
  svcNumBox:       { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: 'rgba(201,168,76,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  svcNum:          { color: COLORS.gold, fontSize: ms(12), fontWeight: '800' },
  svcName:         { fontSize: ms(14), fontWeight: '700', color: COLORS.cream, marginBottom: 3 },
  svcDesc:         { fontSize: ms(12), color: COLORS.textMuted, lineHeight: 18 },
  svcPriceWrap:    { alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 },
  svcPrice:        { fontSize: ms(15), fontWeight: '800', color: COLORS.gold },
  svcPriceType:    { fontSize: ms(10), color: COLORS.textMuted, marginTop: 1 },

  // Tags
  tagsWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pujaTag:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: COLORS.border },
  pujaTagText:     { fontSize: ms(12), color: COLORS.goldLight },
  langTag:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(99,179,237,0.1)', borderWidth: 1, borderColor: 'rgba(99,179,237,0.3)' },
  langTagText:     { fontSize: ms(12), color: COLORS.blue },

  // Stats strip
  statsStrip:      { flexDirection: 'row', backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, overflow: 'hidden' },
  statBox:         { flex: 1, paddingVertical: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.borderLight },
  statNum:         { fontSize: ms(22), fontWeight: '800', color: COLORS.cream },
  statLbl:         { fontSize: ms(11), color: COLORS.textMuted, marginTop: 2 },

  // Reviews
  reviewCard:      { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 8 },
  reviewTop:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(201,168,76,0.18)', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText:{ color: COLORS.gold, fontSize: ms(15), fontWeight: '800' },
  reviewerName:    { fontSize: ms(13), fontWeight: '700', color: COLORS.cream },
  reviewDate:      { fontSize: ms(11), color: COLORS.textMuted, marginTop: 1 },
  reviewRatingBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewRatingNum: { fontSize: ms(15), fontWeight: '800', color: COLORS.gold },
  reviewRatingStar:{ fontSize: ms(12) },
  reviewComment:   { fontSize: ms(13), color: COLORS.textSecondary, lineHeight: 20, fontStyle: 'italic' },

  // CTA
  ctaBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md, paddingBottom: 28, backgroundColor: 'rgba(13,7,25,0.96)', borderTopWidth: 1, borderTopColor: COLORS.border },
  ctaBtn:  { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center', ...SHADOWS.gold },
  ctaBtnText: { color: '#1A0A2E', fontWeight: '800', fontSize: ms(16) },
});
