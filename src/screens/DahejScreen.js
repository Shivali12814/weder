import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
  RefreshControl, Animated,
} from 'react-native';
import {
  getDahejItems, getDahejSummary, seedDahejItems, createDahejItem,
  updateDahejItem, deleteDahejItem, getWeddings, createWedding,
} from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { ms } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'furniture',   icon: '🛏️', label: 'Furniture',   color: '#8B7355' },
  { value: 'electronics', icon: '📺', label: 'Electronics', color: '#4A90D9' },
  { value: 'jewellery',   icon: '💍', label: 'Jewellery',   color: '#C9A84C' },
  { value: 'clothing',    icon: '👗', label: 'Clothing',    color: '#E8547A' },
  { value: 'kitchen',     icon: '🍳', label: 'Kitchen',     color: '#48C78E' },
  { value: 'pooja',       icon: '🪔', label: 'Pooja',       color: '#FF9500' },
  { value: 'gifts',       icon: '🎀', label: 'Gifts',       color: '#AF52DE' },
  { value: 'vehicles',    icon: '🚗', label: 'Vehicles',    color: '#FF3B30' },
  { value: 'other',       icon: '📦', label: 'Other',       color: '#8E8E93' },
];

const STATUS = {
  pending:  { label: 'Pending',  icon: '⏳', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  ordered:  { label: 'Ordered',  icon: '📦', color: '#4A90D9', bg: 'rgba(74,144,217,0.12)' },
  received: { label: 'Received', icon: '✅', color: '#48C78E', bg: 'rgba(72,199,142,0.12)' },
};

const SORT_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'price_desc', label: 'Price High–Low' },
  { value: 'price_asc',  label: 'Price Low–High' },
  { value: 'status',     label: 'Status' },
  { value: 'newest',     label: 'Recently Added' },
];

const catInfo  = (v) => CATEGORIES.find(c => c.value === v) || { icon: '📦', label: v, color: '#8E8E93' };
const fmtPrice = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const EMPTY_FORM = {
  name: '', category: 'other', quantity: '1',
  estimatedPrice: '', actualPrice: '', shopName: '',
  status: 'pending', notes: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label, color }) => (
  <View style={[pill.wrap, { borderColor: color + '40' }]}>
    <Text style={pill.icon}>{icon}</Text>
    <Text style={[pill.value, { color }]}>{value}</Text>
    <Text style={pill.label}>{label}</Text>
  </View>
);
const pill = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1 },
  icon:  { fontSize: ms(18), marginBottom: 3 },
  value: { fontSize: ms(15), fontWeight: '800', marginBottom: 1 },
  label: { fontSize: ms(9), color: 'rgba(253,246,236,0.45)', fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DahejScreen() {
  const insets = useSafeAreaInsets();
  const [weddingId,   setWeddingId]   = useState(null);
  const [items,       setItems]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // Filters & UI
  const [catFilter,   setCatFilter]   = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('category');
  const [viewMode,    setViewMode]    = useState('grid');   // 'grid' | 'list'
  const [showSort,    setShowSort]    = useState(false);

  // Modals
  const [modal,       setModal]       = useState(false);
  const [detailItem,  setDetailItem]  = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => { initWedding(); }, []);

  const initWedding = async () => {
    try {
      const res = await getWeddings();
      let wid;
      if (res.data.length > 0) {
        wid = res.data[0]._id;
      } else {
        // No wedding yet — auto-create a default one so the screen works
        const weddingDate = new Date();
        weddingDate.setFullYear(weddingDate.getFullYear() + 1);
        const created = await createWedding({
          groomName:   'Groom',
          brideName:   'Bride',
          weddingDate: weddingDate.toISOString(),
          venue:       '',
          city:        '',
          totalBudget: 0,
          guestCount:  0,
        });
        wid = created.data._id;
      }
      setWeddingId(wid);

      // Auto-seed demo items if this wedding has none yet
      const itemCheck = await getDahejItems({ weddingId: wid });
      if (itemCheck.data.length === 0) {
        await seedDahejItems({ weddingId: wid });
      }

      await Promise.all([fetchItems(wid), fetchSummary(wid)]);
    } catch (e) {
      console.log('initWedding error:', e?.response?.data || e?.message || e);
    } finally { setLoading(false); }
  };

  const fetchItems = async (wid, overrides = {}) => {
    try {
      const params = {
        weddingId: wid || weddingId,
        sort,
        ...(catFilter    && { category: catFilter }),
        ...(statusFilter && { status:   statusFilter }),
        ...(search       && { search }),
        ...overrides,
      };
      const res = await getDahejItems(params);
      setItems(res.data);
    } catch (e) {
      console.log('fetchItems error:', e?.response?.data || e?.message || e);
    }
  };

  const fetchSummary = async (wid) => {
    try {
      const res = await getDahejSummary({ weddingId: wid || weddingId });
      setSummary(res.data);
    } catch (e) {
      console.log('fetchSummary error:', e?.response?.data || e?.message || e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(weddingId), fetchSummary(weddingId)]);
    setRefreshing(false);
  }, [weddingId, catFilter, statusFilter, search, sort]);

  // Re-fetch when filters change
  useEffect(() => {
    if (weddingId) fetchItems(weddingId);
  }, [catFilter, statusFilter, sort]);

  const handleSearch = () => { if (weddingId) fetchItems(weddingId); };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: catFilter || 'other' });
    setModal(true);
  };

  const openEdit = (item) => {
    setDetailItem(null);
    setEditing(item);
    setForm({
      name:           item.name,
      category:       item.category,
      quantity:       String(item.quantity || 1),
      estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : '',
      actualPrice:    item.actualPrice    ? String(item.actualPrice)    : '',
      shopName:       item.shopName  || '',
      status:         item.status    || 'pending',
      notes:          item.notes     || '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Please enter the item name.');
    setSaving(true);
    try {
      const payload = {
        wedding:        weddingId,
        name:           form.name.trim(),
        category:       form.category,
        quantity:       Number(form.quantity)       || 1,
        estimatedPrice: Number(form.estimatedPrice) || 0,
        actualPrice:    Number(form.actualPrice)    || 0,
        shopName:       form.shopName.trim(),
        status:         form.status,
        notes:          form.notes.trim(),
      };
      if (editing) await updateDahejItem(editing._id, payload);
      else         await createDahejItem(payload);
      setModal(false);
      await Promise.all([fetchItems(weddingId), fetchSummary(weddingId)]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) =>
    Alert.alert('Remove Item', 'This item will be permanently removed from your list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setDetailItem(null);
        await deleteDahejItem(id);
        await Promise.all([fetchItems(weddingId), fetchSummary(weddingId)]);
      }},
    ]);

  const cycleStatus = async (item) => {
    const order  = ['pending', 'ordered', 'received'];
    const next   = order[(order.indexOf(item.status) + 1) % order.length];
    try {
      await updateDahejItem(item._id, { status: next });
      await Promise.all([fetchItems(weddingId), fetchSummary(weddingId)]);
    } catch (e) { Alert.alert('Error', 'Could not update status.'); }
  };

  // ── Computed values ───────────────────────────────────────────────────────
  const totalEst    = summary?.totalEstimated || 0;
  const totalActual = summary?.totalActual    || 0;
  const received    = summary?.received       || 0;
  const pending     = summary?.pending        || 0;
  const ordered     = summary?.ordered        || 0;
  const totalItems  = summary?.totalItems     || items.length;

  const progressPct = totalItems > 0 ? Math.round((received / totalItems) * 100) : 0;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={COLORS.gold} size="large" />
      <Text style={s.loadingText}>Loading your trousseau list…</Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* ── Stats Header ─────────────────────────────────────────────────── */}
      <View style={[s.statsHeader, { paddingTop: insets.top + ms(12) }]}>
        <View style={s.statsRow}>
          <StatPill icon="📋" value={totalItems}    label="Total Items"    color={COLORS.cream} />
          <StatPill icon="⏳" value={pending}        label="Pending"        color="#FFB800" />
          <StatPill icon="📦" value={ordered}        label="Ordered"        color="#4A90D9" />
          <StatPill icon="✅" value={received}       label="Received"       color={COLORS.green} />
        </View>

        {/* Budget comparison */}
        <View style={s.budgetRow}>
          <View style={s.budgetBox}>
            <Text style={s.budgetLabel}>Estimated Budget</Text>
            <Text style={[s.budgetValue, { color: COLORS.gold }]}>{fmtPrice(totalEst)}</Text>
          </View>
          <View style={s.budgetDivider} />
          <View style={s.budgetBox}>
            <Text style={s.budgetLabel}>Actual Spent</Text>
            <Text style={[s.budgetValue, { color: COLORS.green }]}>{fmtPrice(totalActual)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        {totalItems > 0 && (
          <View style={s.progressWrap}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={s.progressLabel}>{progressPct}% received</Text>
          </View>
        )}
      </View>

      {/* ── Search + Controls ─────────────────────────────────────────────── */}
      <View style={s.controlsRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Search items…"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); fetchItems(weddingId, { search: '' }); }}>
              <Text style={s.clearX}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setShowSort(!showSort)}>
          <Text style={s.iconBtnText}>⇅</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
          <Text style={s.iconBtnText}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sort options */}
      {showSort && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.sortBar} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8, paddingVertical: 8 }}>
          {SORT_OPTIONS.map(o => (
            <TouchableOpacity key={o.value} onPress={() => { setSort(o.value); setShowSort(false); }}
              style={[s.sortChip, sort === o.value && s.sortChipActive]}>
              <Text style={[s.sortChipText, sort === o.value && s.sortChipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Category Filter ───────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.catBar} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8, paddingVertical: 8 }}>
        {[{ value: '', icon: '🔍', label: 'All', color: COLORS.gold }, ...CATEGORIES].map(c => (
          <TouchableOpacity key={c.value} onPress={() => setCatFilter(c.value)}
            style={[s.catChip, catFilter === c.value && { backgroundColor: c.color + '25', borderColor: c.color }]}>
            <Text style={s.catChipIcon}>{c.icon}</Text>
            <Text style={[s.catChipText, catFilter === c.value && { color: c.color, fontWeight: '700' }]}>{c.label}</Text>
            {summary?.byCategory?.[c.value] && (
              <View style={[s.catBadge, { backgroundColor: c.color + '30' }]}>
                <Text style={[s.catBadgeText, { color: c.color }]}>{summary.byCategory[c.value].count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Status Filter ─────────────────────────────────────────────────── */}
      <View style={s.statusBar}>
        {[{ value: '', label: 'All', icon: '📋', color: COLORS.textMuted }, ...Object.entries(STATUS).map(([k, v]) => ({ value: k, ...v }))].map(st => (
          <TouchableOpacity key={st.value} onPress={() => setStatusFilter(st.value)}
            style={[s.statusTab, statusFilter === st.value && { borderBottomColor: st.color, borderBottomWidth: 2 }]}>
            <Text style={{ fontSize: ms(13) }}>{st.icon}</Text>
            <Text style={[s.statusTabText, statusFilter === st.value && { color: st.color, fontWeight: '700' }]}>{st.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Items List ────────────────────────────────────────────────────── */}
      <FlatList
        key={viewMode}
        data={items}
        keyExtractor={i => i._id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 10 } : null}
        contentContainerStyle={{ padding: SPACING.md, gap: 10, paddingBottom: ms(120) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🎁</Text>
            <Text style={s.emptyTitle}>{search || catFilter || statusFilter ? 'No items match your filters' : 'Your trousseau list is empty'}</Text>
            <Text style={s.emptyText}>{search || catFilter || statusFilter ? 'Try clearing the filters' : 'Tap the + button to start adding items'}</Text>
          </View>
        }
        renderItem={({ item }) => viewMode === 'grid'
          ? <GridCard item={item} onPress={() => setDetailItem(item)} onStatusPress={() => cycleStatus(item)} />
          : <ListCard item={item} onPress={() => setDetailItem(item)} onStatusPress={() => cycleStatus(item)} />
        }
      />

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── Item Detail Modal ─────────────────────────────────────────────── */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        {detailItem && (
          <View style={s.overlay}>
            <View style={s.detailSheet}>
              <View style={s.sheetHandle} />
              {(() => {
                const cat = catInfo(detailItem.category);
                const sc  = STATUS[detailItem.status] || STATUS.pending;
                return (
                  <>
                    {/* Header */}
                    <View style={s.detailHeader}>
                      <View style={[s.detailIconBox, { backgroundColor: cat.color + '20' }]}>
                        <Text style={s.detailIcon}>{cat.icon}</Text>
                      </View>
                      <View style={s.detailHeaderText}>
                        <Text style={s.detailName}>{detailItem.name}</Text>
                        <Text style={s.detailCat}>{cat.label} · Qty {detailItem.quantity}</Text>
                      </View>
                      <View style={[s.detailStatusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={{ fontSize: ms(14) }}>{sc.icon}</Text>
                        <Text style={[s.detailStatusText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>

                    {/* Price breakdown */}
                    <View style={s.priceGrid}>
                      <View style={s.priceBox}>
                        <Text style={s.priceBoxLabel}>Estimated (per unit)</Text>
                        <Text style={[s.priceBoxValue, { color: COLORS.gold }]}>{fmtPrice(detailItem.estimatedPrice)}</Text>
                      </View>
                      <View style={s.priceBox}>
                        <Text style={s.priceBoxLabel}>Actual (per unit)</Text>
                        <Text style={[s.priceBoxValue, { color: COLORS.green }]}>{fmtPrice(detailItem.actualPrice)}</Text>
                      </View>
                      <View style={s.priceBox}>
                        <Text style={s.priceBoxLabel}>Total Estimated</Text>
                        <Text style={[s.priceBoxValue, { color: COLORS.gold }]}>{fmtPrice((detailItem.estimatedPrice || 0) * (detailItem.quantity || 1))}</Text>
                      </View>
                      <View style={s.priceBox}>
                        <Text style={s.priceBoxLabel}>Total Actual</Text>
                        <Text style={[s.priceBoxValue, { color: COLORS.green }]}>{fmtPrice((detailItem.actualPrice || 0) * (detailItem.quantity || 1))}</Text>
                      </View>
                    </View>

                    {/* Shop & Notes */}
                    {detailItem.shopName ? (
                      <View style={s.detailRow}>
                        <Text style={s.detailRowIcon}>🏪</Text>
                        <View>
                          <Text style={s.detailRowLabel}>Shop / Vendor</Text>
                          <Text style={s.detailRowValue}>{detailItem.shopName}</Text>
                        </View>
                      </View>
                    ) : null}
                    {detailItem.notes ? (
                      <View style={s.detailRow}>
                        <Text style={s.detailRowIcon}>📝</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detailRowLabel}>Notes</Text>
                          <Text style={s.detailRowValue}>{detailItem.notes}</Text>
                        </View>
                      </View>
                    ) : null}
                    {detailItem.createdAt ? (
                      <View style={s.detailRow}>
                        <Text style={s.detailRowIcon}>📅</Text>
                        <View>
                          <Text style={s.detailRowLabel}>Added On</Text>
                          <Text style={s.detailRowValue}>{new Date(detailItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Status quick-change */}
                    <Text style={s.detailSectionTitle}>Update Status</Text>
                    <View style={s.statusBtns}>
                      {Object.entries(STATUS).map(([key, sc]) => (
                        <TouchableOpacity key={key}
                          style={[s.statusBtn, detailItem.status === key && { backgroundColor: sc.bg, borderColor: sc.color }]}
                          onPress={async () => {
                            await updateDahejItem(detailItem._id, { status: key });
                            setDetailItem({ ...detailItem, status: key });
                            fetchItems(weddingId); fetchSummary(weddingId);
                          }}>
                          <Text style={{ fontSize: ms(16) }}>{sc.icon}</Text>
                          <Text style={[s.statusBtnText, detailItem.status === key && { color: sc.color, fontWeight: '700' }]}>{sc.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Actions */}
                    <View style={s.detailActions}>
                      <TouchableOpacity style={s.detailCloseBtn} onPress={() => setDetailItem(null)}>
                        <Text style={s.detailCloseBtnText}>Close</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.detailEditBtn} onPress={() => openEdit(detailItem)}>
                        <Text style={s.detailEditBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.detailDelBtn} onPress={() => handleDelete(detailItem._id)}>
                        <Text style={s.detailDelBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        )}
      </Modal>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editing ? '✏️ Edit Item' : '➕ Add Trousseau Item'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={s.fieldLabel}>Item Name *</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })}
                placeholder="e.g. Double Bed, Gold Necklace, Samsung TV…"
                placeholderTextColor={COLORS.textMuted} />

              <Text style={s.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c.value} onPress={() => setForm({ ...form, category: c.value })}
                      style={[s.formCatChip, form.category === c.value && { backgroundColor: c.color + '25', borderColor: c.color }]}>
                      <Text style={{ fontSize: ms(16) }}>{c.icon}</Text>
                      <Text style={[s.formCatText, form.category === c.value && { color: c.color, fontWeight: '700' }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Quantity</Text>
                  <TextInput style={s.input} value={form.quantity}
                    onChangeText={v => setForm({ ...form, quantity: v })}
                    keyboardType="numeric" placeholder="1" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={s.fieldLabel}>Estimated Price (₹)</Text>
                  <TextInput style={s.input} value={form.estimatedPrice}
                    onChangeText={v => setForm({ ...form, estimatedPrice: v })}
                    keyboardType="numeric" placeholder="e.g. 45000"
                    placeholderTextColor={COLORS.textMuted} />
                </View>
              </View>

              <Text style={s.fieldLabel}>Actual Price Paid (₹) — optional</Text>
              <TextInput style={s.input} value={form.actualPrice}
                onChangeText={v => setForm({ ...form, actualPrice: v })}
                keyboardType="numeric" placeholder="Fill after purchase"
                placeholderTextColor={COLORS.textMuted} />

              <Text style={s.fieldLabel}>Shop / Vendor Name</Text>
              <TextInput style={s.input} value={form.shopName}
                onChangeText={v => setForm({ ...form, shopName: v })}
                placeholder="e.g. Tanishq, Croma, Home Centre"
                placeholderTextColor={COLORS.textMuted} />

              <Text style={s.fieldLabel}>Notes</Text>
              <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]}
                value={form.notes} onChangeText={v => setForm({ ...form, notes: v })}
                placeholder="Color, size, delivery date, special instructions…"
                placeholderTextColor={COLORS.textMuted} multiline />

              <Text style={s.fieldLabel}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {Object.entries(STATUS).map(([key, sc]) => (
                  <TouchableOpacity key={key} onPress={() => setForm({ ...form, status: key })}
                    style={[s.formStatusChip, form.status === key && { backgroundColor: sc.bg, borderColor: sc.color }]}>
                    <Text style={{ fontSize: ms(16) }}>{sc.icon}</Text>
                    <Text style={[s.formStatusText, form.status === key && { color: sc.color, fontWeight: '700' }]}>{sc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.formBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={COLORS.deep} size="small" />
                    : <Text style={s.saveBtnText}>{editing ? 'Update Item' : 'Add Item'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Card Components ──────────────────────────────────────────────────────────
function GridCard({ item, onPress, onStatusPress }) {
  const cat = catInfo(item.category);
  const sc  = STATUS[item.status] || STATUS.pending;
  return (
    <TouchableOpacity style={[gc.card, { flex: 1 }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[gc.iconBox, { backgroundColor: cat.color + '18' }]}>
        <Text style={gc.icon}>{cat.icon}</Text>
      </View>
      <Text style={gc.name} numberOfLines={2}>{item.name}</Text>
      {item.quantity > 1 && <Text style={gc.qty}>Qty: {item.quantity}</Text>}
      {item.estimatedPrice > 0 && (
        <Text style={gc.price}>{fmtPrice(item.estimatedPrice * item.quantity)}</Text>
      )}
      {item.shopName ? <Text style={gc.shop} numberOfLines={1}>🏪 {item.shopName}</Text> : null}
      <TouchableOpacity onPress={onStatusPress} style={[gc.badge, { backgroundColor: sc.bg }]} activeOpacity={0.7}>
        <Text style={{ fontSize: ms(10) }}>{sc.icon}</Text>
        <Text style={[gc.badgeText, { color: sc.color }]}>{sc.label}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const gc = StyleSheet.create({
  card:      { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', borderRadius: 18, padding: 14, marginBottom: 2 },
  iconBox:   { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  icon:      { fontSize: ms(22) },
  name:      { fontSize: ms(13), fontWeight: '700', color: '#FDF6EC', marginBottom: 3, lineHeight: 18 },
  qty:       { fontSize: ms(11), color: 'rgba(253,246,236,0.45)', marginBottom: 2 },
  price:     { fontSize: ms(13), color: '#C9A84C', fontWeight: '700', marginBottom: 4 },
  shop:      { fontSize: ms(10), color: 'rgba(253,246,236,0.4)', marginBottom: 6 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginTop: 'auto' },
  badgeText: { fontSize: ms(10), fontWeight: '700' },
});

function ListCard({ item, onPress, onStatusPress }) {
  const cat = catInfo(item.category);
  const sc  = STATUS[item.status] || STATUS.pending;
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[lc.iconBox, { backgroundColor: cat.color + '18' }]}>
        <Text style={{ fontSize: ms(20) }}>{cat.icon}</Text>
      </View>
      <View style={lc.body}>
        <Text style={lc.name} numberOfLines={1}>{item.name}</Text>
        <View style={lc.metaRow}>
          <Text style={lc.meta}>{cat.label}</Text>
          {item.quantity > 1 && <Text style={lc.meta}> · Qty {item.quantity}</Text>}
          {item.shopName ? <Text style={lc.meta}> · {item.shopName}</Text> : null}
        </View>
        {item.notes ? <Text style={lc.notes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={lc.right}>
        {item.estimatedPrice > 0 && (
          <Text style={lc.price}>{fmtPrice(item.estimatedPrice * item.quantity)}</Text>
        )}
        <TouchableOpacity onPress={onStatusPress} style={[lc.badge, { backgroundColor: sc.bg }]}>
          <Text style={[lc.badgeText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
const lc = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', borderRadius: 16, padding: 12, gap: 12 },
  iconBox:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  body:     { flex: 1, minWidth: 0 },
  name:     { fontSize: ms(14), fontWeight: '700', color: '#FDF6EC', marginBottom: 3 },
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap' },
  meta:     { fontSize: ms(11), color: 'rgba(253,246,236,0.45)' },
  notes:    { fontSize: ms(11), color: 'rgba(253,246,236,0.35)', marginTop: 2 },
  right:    { alignItems: 'flex-end', gap: 6 },
  price:    { fontSize: ms(13), fontWeight: '700', color: '#C9A84C' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:{ fontSize: ms(10), fontWeight: '700' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D0719' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0719', gap: 12 },
  loadingText: { color: 'rgba(253,246,236,0.5)', fontSize: ms(13) },

  // Stats header
  statsHeader:  { backgroundColor: '#160B2E', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.18)', paddingHorizontal: SPACING.md, paddingBottom: 10 },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  budgetRow:    { flexDirection: 'row', marginBottom: 10 },
  budgetBox:    { flex: 1, alignItems: 'center' },
  budgetLabel:  { fontSize: ms(10), color: 'rgba(253,246,236,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  budgetValue:  { fontSize: ms(16), fontWeight: '800' },
  budgetDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar:  { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#48C78E', borderRadius: 3 },
  progressLabel:{ fontSize: ms(10), color: '#48C78E', fontWeight: '700', width: 70, textAlign: 'right' },

  // Controls
  controlsRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  searchBox:    { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', borderRadius: 12, paddingHorizontal: 10 },
  searchIcon:   { fontSize: ms(14), marginRight: 6 },
  searchInput:  { flex: 1, color: '#FDF6EC', fontSize: ms(13), paddingVertical: 9 },
  clearX:       { color: 'rgba(253,246,236,0.4)', fontSize: ms(14), paddingHorizontal: 4 },
  iconBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', justifyContent: 'center', alignItems: 'center' },
  iconBtnText:  { fontSize: ms(16), color: '#C9A84C' },

  // Sort
  sortBar:      { flexGrow: 0, backgroundColor: 'rgba(22,11,46,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.12)' },
  sortChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sortChipActive:    { backgroundColor: 'rgba(201,168,76,0.18)', borderColor: '#C9A84C' },
  sortChipText:      { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', fontWeight: '600' },
  sortChipTextActive:{ color: '#C9A84C' },

  // Category bar
  catBar:       { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  catChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  catChipIcon:  { fontSize: ms(13) },
  catChipText:  { color: 'rgba(253,246,236,0.55)', fontSize: ms(12), fontWeight: '600' },
  catBadge:     { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, marginLeft: 2 },
  catBadgeText: { fontSize: ms(9), fontWeight: '800' },

  // Status tab bar
  statusBar:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md },
  statusTab:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statusTabText:{ fontSize: ms(11), color: 'rgba(253,246,236,0.45)', fontWeight: '600' },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.lg },
  emptyIcon:  { fontSize: ms(56), marginBottom: 14 },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: '#FDF6EC', marginBottom: 6 },
  emptyText:  { color: 'rgba(253,246,236,0.4)', fontSize: ms(13), textAlign: 'center', lineHeight: 20 },

  // FAB
  fab:     { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#C9A84C', justifyContent: 'center', alignItems: 'center', shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabText: { color: '#1A0A2E', fontSize: ms(32), fontWeight: '700', lineHeight: 36 },

  // Overlay / sheets
  overlay:     { flex: 1, backgroundColor: 'rgba(6,2,14,0.88)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#1F1042', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: SPACING.lg, maxHeight: '92%', borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  detailSheet: { backgroundColor: '#1F1042', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: SPACING.lg, borderTopWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: ms(20), fontWeight: '800', color: '#F0D080', marginBottom: 16 },

  // Detail modal
  detailHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  detailIconBox:    { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  detailIcon:       { fontSize: ms(26) },
  detailHeaderText: { flex: 1 },
  detailName:       { fontSize: ms(17), fontWeight: '800', color: '#FDF6EC', marginBottom: 3 },
  detailCat:        { fontSize: ms(12), color: 'rgba(253,246,236,0.5)' },
  detailStatusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  detailStatusText: { fontSize: ms(12), fontWeight: '700' },

  priceGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  priceBox:     { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  priceBoxLabel:{ fontSize: ms(10), color: 'rgba(253,246,236,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  priceBoxValue:{ fontSize: ms(16), fontWeight: '800' },

  detailRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  detailRowIcon:  { fontSize: ms(18), width: 24, textAlign: 'center', marginTop: 2 },
  detailRowLabel: { fontSize: ms(10), color: 'rgba(253,246,236,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  detailRowValue: { fontSize: ms(13), color: '#FDF6EC', lineHeight: 19 },

  detailSectionTitle: { fontSize: ms(11), color: '#C9A84C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  statusBtns:   { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  statusBtnText:{ fontSize: ms(12), color: 'rgba(253,246,236,0.5)', fontWeight: '600' },

  detailActions:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailCloseBtn:   { flex: 2, paddingVertical: 13, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center' },
  detailCloseBtnText:{ color: 'rgba(253,246,236,0.6)', fontWeight: '600', fontSize: ms(14) },
  detailEditBtn:    { flex: 3, paddingVertical: 13, borderRadius: 30, backgroundColor: '#C9A84C', alignItems: 'center' },
  detailEditBtnText:{ color: '#1A0A2E', fontWeight: '800', fontSize: ms(14) },
  detailDelBtn:     { width: 48, paddingVertical: 13, borderRadius: 30, backgroundColor: 'rgba(232,84,122,0.12)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', alignItems: 'center' },
  detailDelBtnText: { fontSize: ms(16) },

  // Form
  fieldLabel:   { fontSize: ms(12), color: 'rgba(253,246,236,0.55)', fontWeight: '600', marginBottom: 6, marginTop: 4, letterSpacing: 0.3 },
  input:        { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', borderRadius: 12, padding: 13, color: '#FDF6EC', fontSize: ms(14), marginBottom: 14 },
  formCatChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  formCatText:  { color: 'rgba(253,246,236,0.5)', fontSize: ms(11) },
  formStatusChip: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  formStatusText: { fontSize: ms(12), color: 'rgba(253,246,236,0.5)', fontWeight: '600' },
  formBtns:     { flexDirection: 'row', gap: 12, marginBottom: 24 },
  cancelBtn:    { flex: 1, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5, borderColor: '#C9A84C', alignItems: 'center' },
  cancelBtnText:{ color: '#C9A84C', fontWeight: '700', fontSize: ms(14) },
  saveBtn:      { flex: 2, paddingVertical: 14, borderRadius: 30, backgroundColor: '#C9A84C', alignItems: 'center' },
  saveBtnText:  { color: '#1A0A2E', fontWeight: '800', fontSize: ms(15) },
});
