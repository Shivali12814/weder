import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getWeddings, getDashboard, getTasks, toggleTask } from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/theme';
import { wp, ms } from '../utils/responsive';
import WederLogo from '../components/WederLogo';

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color }) => (
  <View style={[s.statCard, SHADOWS.md]}>
    <View style={[s.statIconBg, { backgroundColor: color + '22' }]}>
      <Text style={s.statEmoji}>{icon}</Text>
    </View>
    <Text style={[s.statNum, { color }]}>{value ?? '—'}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ── Progress bar ───────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, color = COLORS.green }) => (
  <View style={s.bar}>
    <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
  </View>
);

// ── Task row ───────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onToggle }) => (
  <TouchableOpacity style={s.taskRow} onPress={() => onToggle(task._id)} activeOpacity={0.7}>
    <View style={[s.taskDot, task.isCompleted && s.taskDotDone]}>
      {task.isCompleted && <Text style={s.tick}>✓</Text>}
    </View>
    <Text style={[s.taskTitle, task.isCompleted && s.taskDone]} numberOfLines={1}>{task.title}</Text>
    {task.dueDate && (
      <Text style={s.taskDate}>
        {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </Text>
    )}
  </TouchableOpacity>
);

const fmtINR   = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };

// ── Quick action ───────────────────────────────────────────────────────────────
const QUICK = [
  { icon: '🏪', label: 'Vendors',   screen: 'Vendors'   },
  { icon: '📋', label: 'Bookings',  screen: 'Bookings'  },
  { icon: '💒', label: 'Trousseau', screen: 'Trousseau' },
  { icon: '👥', label: 'Guests',    screen: 'Guests'    },
  { icon: '💰', label: 'Budget',    screen: 'Budget'    },
  { icon: '✅', label: 'Tasks',     screen: 'Tasks'     },
];

const CARD_W = (wp(92) - ms(12)) / 2;

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [active,   setActive]  = useState(null);
  const [dash,     setDash]    = useState(null);
  const [tasks,    setTasks]   = useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getWeddings();
      if (res.data.length > 0) {
        const w = res.data[0];
        setActive(w);
        const [dRes, tRes] = await Promise.all([
          getDashboard(w._id),
          getTasks({ weddingId: w._id, isCompleted: false }),
        ]);
        setDash(dRes.data);
        setTasks(tRes.data.slice(0, 5));
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const toggle = async (id) => {
    try { await toggleTask(id); setTasks(p => p.filter(t => t._id !== id)); }
    catch (e) { console.log(e); }
  };

  const nav = (screen) => navigation.navigate(screen);

  if (loading) return (
    <View style={[s.root, s.center]}>
      <ActivityIndicator color={COLORS.gold} size="large" />
      <Text style={s.loadText}>Loading…</Text>
    </View>
  );

  const stats     = dash?.stats || {};
  const wedding   = dash?.wedding || active;
  const daysLeft  = wedding?.weddingDate
    ? Math.ceil((new Date(wedding.weddingDate) - new Date()) / 86400000)
    : null;
  const budget    = wedding?.totalBudget || 0;
  const spent     = stats.budgetUsed || stats.totalSpent || 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const progress  = stats.progressPercent || 0;
  const guestCount= stats.actualGuestCount ?? wedding?.guestCount ?? 0;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={s.root}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + ms(12) }]}>
        <WederLogo variant="sm" horizontal />
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: ms(32) }} showsVerticalScrollIndicator={false}>

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <View style={s.greetBox}>
          <Text style={s.greetSub}>Good {greeting()},</Text>
          <Text style={s.greetName}>{firstName} 👋</Text>
        </View>

        {/* ── Countdown card ────────────────────────────────────────────── */}
        {daysLeft !== null && (
          <View style={[s.countCard, SHADOWS.gold]}>
            <View style={{ flex: 1 }}>
              <Text style={s.countNames} numberOfLines={1}>
                {wedding.groomName} × {wedding.brideName}
              </Text>
              <Text style={s.countDateText}>
                {new Date(wedding.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              {!!(wedding.venue || wedding.city) && (
                <Text style={s.countVenue} numberOfLines={1}>{wedding.venue || wedding.city}</Text>
              )}
            </View>
            <View style={s.countBadge}>
              <Text style={s.countNum}>{Math.max(0, daysLeft)}</Text>
              <Text style={s.countUnit}>DAYS</Text>
            </View>
          </View>
        )}

        {/* ── Stats grid ────────────────────────────────────────────────── */}
        <View style={s.grid}>
          <StatCard icon="📋" value={stats.totalBookings ?? 0}  label="Bookings"   color={COLORS.blue}  />
          <StatCard icon="👥" value={guestCount}                label="Guests"     color={COLORS.pink}  />
          <StatCard icon="✅" value={stats.completedTasks ?? 0} label="Tasks Done" color={COLORS.green} />
          <StatCard icon="🎁" value={stats.totalDahejItems ?? 0}label="Trousseau"  color={COLORS.gold}  />
        </View>

        {/* ── Budget bar ────────────────────────────────────────────────── */}
        {budget > 0 && (
          <View style={[s.section, SHADOWS.md]}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>💰 Budget</Text>
              <Text style={s.secBadge}>{budgetPct}% used</Text>
            </View>
            <ProgressBar
              pct={budgetPct}
              color={budgetPct > 85 ? COLORS.red : budgetPct > 60 ? COLORS.yellow : COLORS.green}
            />
            <View style={s.budgetRow}>
              <View>
                <Text style={s.budgetLbl}>Spent</Text>
                <Text style={[s.budgetVal, { color: COLORS.pink }]}>{fmtINR(spent)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.budgetLbl}>Total Budget</Text>
                <Text style={[s.budgetVal, { color: COLORS.gold }]}>{fmtINR(budget)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Task progress ──────────────────────────────────────────────── */}
        {(stats.totalTasks > 0) && (
          <View style={[s.section, SHADOWS.md]}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>📌 Tasks</Text>
              <Text style={s.secBadge}>{progress}% done</Text>
            </View>
            <ProgressBar pct={progress} />
            <Text style={s.secNote}>{stats.completedTasks} of {stats.totalTasks} completed</Text>
          </View>
        )}

        {/* ── Pending tasks ──────────────────────────────────────────────── */}
        {tasks.length > 0 && (
          <View style={[s.section, SHADOWS.md]}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>📝 Up Next</Text>
              <TouchableOpacity onPress={() => nav('Tasks')}>
                <Text style={s.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {tasks.map(t => <TaskRow key={t._id} task={t} onToggle={toggle} />)}
          </View>
        )}

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <Text style={s.quickHeader}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {QUICK.map(q => (
            <TouchableOpacity
              key={q.screen}
              style={[s.quickCard, SHADOWS.sm]}
              onPress={() => nav(q.screen)}
              activeOpacity={0.75}
            >
              <Text style={s.quickEmoji}>{q.icon}</Text>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── No wedding yet ────────────────────────────────────────────── */}
        {!wedding && (
          <View style={s.noWedding}>
            <Text style={s.noWeddingIcon}>💍</Text>
            <Text style={s.noWeddingTitle}>Set Up Your Wedding</Text>
            <Text style={s.noWeddingText}>Go to Settings → Wedding Details to add your wedding information.</Text>
            <TouchableOpacity style={s.setupBtn} onPress={() => nav('Settings')}>
              <Text style={s.setupBtnText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.deep },
  center:  { justifyContent: 'center', alignItems: 'center' },
  loadText:{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: ms(12) },
  scroll:  { flex: 1 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ms(16), paddingBottom: ms(12), backgroundColor: COLORS.deep2, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  logoutBtn:   { paddingVertical: ms(6), paddingHorizontal: ms(12), borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  logoutText:  { ...TYPOGRAPHY.tiny, color: COLORS.gold },

  // Greeting
  greetBox:  { paddingHorizontal: ms(16), paddingTop: ms(20), paddingBottom: ms(8) },
  greetSub:  { ...TYPOGRAPHY.captionB, color: COLORS.textMuted, letterSpacing: 0.5 },
  greetName: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, marginTop: ms(2) },

  // Countdown
  countCard:     { marginHorizontal: ms(16), marginBottom: ms(16), backgroundColor: COLORS.surface2, borderRadius: RADIUS.xl, padding: ms(18), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  countNames:    { ...TYPOGRAPHY.h4, color: COLORS.goldLight, marginBottom: ms(4), flex: 1 },
  countDateText: { ...TYPOGRAPHY.captionB, color: COLORS.textSecondary, marginBottom: ms(2) },
  countVenue:    { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  countBadge:    { alignItems: 'center', backgroundColor: COLORS.goldBg, borderRadius: RADIUS.lg, paddingVertical: ms(10), paddingHorizontal: ms(14), marginLeft: ms(12), borderWidth: 1, borderColor: COLORS.border, minWidth: ms(64) },
  countNum:      { ...TYPOGRAPHY.h1, color: COLORS.goldBright },
  countUnit:     { color: COLORS.gold, fontSize: ms(9), fontWeight: '700', letterSpacing: 1 },

  // Stats grid
  grid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: ms(16), justifyContent: 'space-between', marginBottom: ms(4) },
  statCard:  { width: CARD_W, backgroundColor: COLORS.surface2, borderRadius: RADIUS.lg, padding: ms(14), alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: ms(12) },
  statIconBg:{ width: ms(42), height: ms(42), borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: ms(8) },
  statEmoji: { fontSize: ms(20) },
  statNum:   { ...TYPOGRAPHY.h2 },
  statLabel: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginTop: ms(2) },

  // Sections
  section:  { marginHorizontal: ms(16), marginBottom: ms(14), backgroundColor: COLORS.surface2, borderRadius: RADIUS.lg, padding: ms(16), borderWidth: 1, borderColor: COLORS.borderLight },
  secHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(10) },
  secTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  secBadge: { ...TYPOGRAPHY.captionB, color: COLORS.gold },
  secNote:  { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: ms(6) },
  seeAll:   { ...TYPOGRAPHY.captionB, color: COLORS.gold },

  // Progress bar
  bar:     { height: ms(5), backgroundColor: COLORS.surface3, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: ms(10) },
  barFill: { height: '100%', borderRadius: RADIUS.full },

  // Budget row
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLbl: { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginBottom: ms(2) },
  budgetVal: { ...TYPOGRAPHY.bodyB },

  // Tasks
  taskRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: ms(8), borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  taskDot:    { width: ms(20), height: ms(20), borderRadius: ms(10), borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: ms(10) },
  taskDotDone:{ backgroundColor: COLORS.green, borderColor: COLORS.green },
  tick:       { color: '#fff', fontSize: ms(11), fontWeight: '800' },
  taskTitle:  { ...TYPOGRAPHY.bodyM, color: COLORS.textPrimary, flex: 1 },
  taskDone:   { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskDate:   { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginLeft: ms(8) },

  // Quick actions
  quickHeader: { ...TYPOGRAPHY.label, color: COLORS.textMuted, paddingHorizontal: ms(16), marginBottom: ms(10), marginTop: ms(4) },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: ms(16), justifyContent: 'space-between' },
  quickCard:   { width: CARD_W, backgroundColor: COLORS.surface2, borderRadius: RADIUS.lg, paddingVertical: ms(16), alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: ms(12) },
  quickEmoji:  { fontSize: ms(26), marginBottom: ms(6) },
  quickLabel:  { ...TYPOGRAPHY.captionB, color: COLORS.textSecondary },

  // No wedding
  noWedding:      { alignItems: 'center', margin: ms(16), padding: ms(24), backgroundColor: COLORS.surface2, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight },
  noWeddingIcon:  { fontSize: ms(48), marginBottom: ms(12) },
  noWeddingTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: ms(8) },
  noWeddingText:  { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', lineHeight: ms(20), marginBottom: ms(16) },
  setupBtn:       { backgroundColor: COLORS.gold, paddingVertical: ms(12), paddingHorizontal: ms(24), borderRadius: RADIUS.full },
  setupBtnText:   { color: COLORS.deep, fontWeight: '800', fontSize: ms(14) },
});
