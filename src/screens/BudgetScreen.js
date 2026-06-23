import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { getBudget, getWeddings } from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { ms } from '../utils/responsive';

const SERVICE_LABELS = {
  pandit:           '🛕 Pandit',
  marriage_hall:    '🏛️ Marriage Hall',
  tent_decoration:  '⛺ Tent & Decor',
  catering:         '👨‍🍳 Catering',
  photographer:     '📸 Photographer',
  dj_band:          '🎵 DJ / Band',
  makeup_artist:    '💄 Makeup Artist',
  baraat_vehicle:   '🚗 Baraat Vehicles',
  florist:          '💐 Florist',
  invitation_cards: '📄 Invitation Cards',
  other:            '🎪 Other',
};

const formatL = (n) => `₹${(n / 100000).toFixed(2)}L`;

export default function BudgetScreen() {
  const [wedding, setWedding] = useState(null);
  const [budget,  setBudget]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initBudget(); }, []);

  const initBudget = async () => {
    try {
      const wRes = await getWeddings();
      if (wRes.data.length > 0) {
        const w = wRes.data[0];
        setWedding(w);
        const bRes = await getBudget(w._id);
        setBudget(bRes.data);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>
    );
  }

  if (!budget || !wedding) {
    return (
      <View style={s.center}>
        <Text style={s.noDataIcon}>💰</Text>
        <Text style={s.noDataTitle}>No Budget Data</Text>
        <Text style={s.noDataText}>Add a wedding first to track your budget.</Text>
      </View>
    );
  }

  const { totalBudget, totalCommitted, totalPaid, remaining, byService } = budget;
  const usedPct    = totalBudget ? Math.min(100, Math.round((totalPaid / totalBudget) * 100)) : 0;
  const commitPct  = totalBudget ? Math.min(100, Math.round((totalCommitted / totalBudget) * 100)) : 0;
  const isOver     = remaining < 0;
  const leftover   = Math.abs(remaining);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <View style={s.grid}>
        {[
          { icon: '🏦', label: 'Total Budget',  val: totalBudget,    color: COLORS.goldLight },
          { icon: '📋', label: 'Committed',      val: totalCommitted, color: COLORS.blue      },
          { icon: '✅', label: 'Paid So Far',    val: totalPaid,      color: COLORS.green     },
          {
            icon: isOver ? '⚠️' : '💰',
            label: isOver ? 'Over Budget' : 'Remaining',
            val: leftover,
            color: isOver ? COLORS.pink : COLORS.yellow,
          },
        ].map((c, i) => (
          <View key={i} style={[s.summaryCard, { borderTopColor: c.color }]}>
            <Text style={s.summaryIcon}>{c.icon}</Text>
            <Text style={[s.summaryVal, { color: c.color }]}>{formatL(c.val)}</Text>
            <Text style={s.summaryLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Budget Utilisation */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Budget Utilisation</Text>

        <View style={s.barSection}>
          <View style={s.barLabelRow}>
            <Text style={s.barLabel}>Paid</Text>
            <Text style={[s.barPct, isOver && { color: COLORS.pink }]}>{usedPct}%</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${usedPct}%`, backgroundColor: isOver ? COLORS.pink : COLORS.green }]} />
          </View>
        </View>

        <View style={s.barSection}>
          <View style={s.barLabelRow}>
            <Text style={s.barLabel}>Committed</Text>
            <Text style={s.barPct}>{commitPct}%</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${commitPct}%`, backgroundColor: COLORS.blue }]} />
          </View>
        </View>

        {isOver && (
          <View style={s.overBudgetAlert}>
            <Text style={s.overBudgetText}>
              ⚠️ You have exceeded your budget by {formatL(leftover)}
            </Text>
          </View>
        )}
      </View>

      {/* Service Breakdown */}
      {Object.keys(byService).length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Breakdown by Service</Text>
          {Object.entries(byService)
            .sort(([, a], [, b]) => b - a)
            .map(([service, amount]) => {
              const pct = totalCommitted ? Math.round((amount / totalCommitted) * 100) : 0;
              return (
                <View key={service} style={s.breakdownRow}>
                  <View style={s.breakdownHeader}>
                    <Text style={s.serviceLabel}>{SERVICE_LABELS[service] || service}</Text>
                    <View style={s.breakdownRight}>
                      <Text style={s.serviceAmt}>₹{amount.toLocaleString()}</Text>
                      <Text style={s.servicePct}>{pct}%</Text>
                    </View>
                  </View>
                  <View style={s.miniTrack}>
                    <View style={[s.miniFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* Tips */}
      <View style={[s.card, s.tipsCard]}>
        <Text style={s.tipsTitle}>💡 Budget Tips</Text>
        {[
          'Tent & decoration vendors have the most room for negotiation.',
          'Book caterers early — request bulk discounts for larger guest counts.',
          'Photographers book out fast; advance booking saves 15–20%.',
          'Buy dahej items off-season for 20–30% savings.',
        ].map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipArrow}>→</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.deep },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep, gap: 10 },
  noDataIcon: { fontSize: ms(48), marginBottom: 4 },
  noDataTitle:{ fontSize: ms(17), fontWeight: '700', color: COLORS.textPrimary },
  noDataText: { fontSize: ms(13), color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

  // Summary Grid
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  summaryCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.deep2,
    borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: RADIUS.xl, borderTopWidth: 3,
    padding: SPACING.md, ...SHADOWS.sm,
  },
  summaryIcon:  { fontSize: ms(22), marginBottom: 6 },
  summaryVal:   { fontSize: ms(20), fontWeight: '800', marginBottom: 2 },
  summaryLabel: { fontSize: ms(11), color: COLORS.textMuted, fontWeight: '600' },

  // Card
  card:      { backgroundColor: COLORS.deep2, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize: ms(15), fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  // Bar chart
  barSection:   { marginBottom: 14 },
  barLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel:     { fontSize: ms(12), color: COLORS.textSecondary, fontWeight: '600' },
  barPct:       { fontSize: ms(12), color: COLORS.gold, fontWeight: '700' },
  barTrack:     { height: 8, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: RADIUS.full },
  overBudgetAlert: { backgroundColor: COLORS.pinkBg, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: 4, borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)' },
  overBudgetText:  { color: COLORS.pink, fontSize: ms(12), fontWeight: '600' },

  // Breakdown
  breakdownRow:    { marginBottom: SPACING.sm },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  serviceLabel:    { fontSize: ms(13), color: COLORS.textPrimary, fontWeight: '500' },
  breakdownRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceAmt:      { fontSize: ms(13), color: COLORS.gold, fontWeight: '700' },
  servicePct:      { fontSize: ms(11), color: COLORS.textMuted, fontWeight: '600', minWidth: 30, textAlign: 'right' },
  miniTrack:       { height: 5, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, overflow: 'hidden' },
  miniFill:        { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },

  // Tips
  tipsCard:  { borderColor: 'rgba(201,168,76,0.35)' },
  tipsTitle: { fontSize: ms(14), fontWeight: '700', color: COLORS.goldLight, marginBottom: SPACING.sm },
  tipRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipArrow:  { color: COLORS.gold, fontSize: ms(13), marginTop: 1, flexShrink: 0 },
  tipText:   { flex: 1, fontSize: ms(12), color: COLORS.textSecondary, lineHeight: 18 },
});
