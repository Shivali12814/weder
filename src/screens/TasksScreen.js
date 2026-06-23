import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  getTasks, createTask, updateTask, toggleTask, deleteTask, getWeddings,
} from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { ms } from '../utils/responsive';

const PRIORITY = {
  high:   { color: COLORS.pink,   dot: COLORS.pink,   label: 'High'   },
  medium: { color: COLORS.yellow, dot: COLORS.yellow, label: 'Medium' },
  low:    { color: COLORS.green,  dot: COLORS.green,  label: 'Low'    },
};

const CATEGORIES = ['booking', 'shopping', 'invitation', 'catering', 'decoration', 'ceremony', 'other'];

const EMPTY_FORM = { title: '', description: '', category: 'other', dueDate: '', priority: 'medium' };

export default function TasksScreen() {
  const [weddingId, setWeddingId] = useState(null);
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [showDone,  setShowDone]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { initWedding(); }, []);

  const initWedding = async () => {
    try {
      const res = await getWeddings();
      if (res.data.length > 0) { setWeddingId(res.data[0]._id); fetchTasks(res.data[0]._id); }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const fetchTasks = async (wid) => {
    try {
      const res = await getTasks({ weddingId: wid || weddingId });
      setTasks(res.data);
    } catch (e) { console.log(e); }
  };

  const handleToggle = async (id) => {
    try { await toggleTask(id); fetchTasks(); }
    catch (e) { console.log(e); }
  };

  const handleDelete = (id) =>
    Alert.alert('Delete Task', 'This task will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTask(id); fetchTasks();
      }},
    ]);

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description || '',
      category: t.category,
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
      priority: t.priority,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Please enter a task title.');
    setSaving(true);
    try {
      const payload = { ...form, wedding: weddingId };
      if (editing) await updateTask(editing._id, payload);
      else         await createTask(payload);
      setModal(false); fetchTasks();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const displayed = showDone ? tasks : tasks.filter(t => !t.isCompleted);
  const done  = tasks.filter(t => t.isCompleted).length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>
    );
  }

  return (
    <View style={s.container}>
      {/* Progress Card */}
      <View style={s.progressCard}>
        <View style={s.progressRow}>
          <View>
            <Text style={s.progressTitle}>Progress</Text>
            <Text style={s.progressSub}>{done} of {total} completed</Text>
          </View>
          <View style={s.progressCircle}>
            <Text style={s.progressPct}>{pct}%</Text>
          </View>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
        <TouchableOpacity onPress={() => setShowDone(!showDone)} style={s.toggleBtn} activeOpacity={0.7}>
          <Text style={s.toggleBtnText}>
            {showDone ? '🙈 Hide Completed' : '👁 Show Completed'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={displayed}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: SPACING.md, gap: 10, paddingBottom: ms(120) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>{showDone ? '📋' : '🎉'}</Text>
            <Text style={s.emptyTitle}>{showDone ? 'No tasks found' : 'All done!'}</Text>
            <Text style={s.emptyText}>
              {showDone ? 'Add your first task below.' : 'All tasks have been completed.'}
            </Text>
          </View>
        }
        renderItem={({ item: t }) => {
          const pr = PRIORITY[t.priority] || PRIORITY.medium;
          return (
            <View style={[s.taskCard, t.isCompleted && s.taskCardDone]}>
              <View style={s.taskMain}>
                <TouchableOpacity
                  style={[s.checkbox, t.isCompleted && s.checkboxDone]}
                  onPress={() => handleToggle(t._id)}
                  activeOpacity={0.7}
                >
                  {t.isCompleted && <Text style={s.checkmark}>✓</Text>}
                </TouchableOpacity>

                <View style={s.taskBody}>
                  <Text
                    style={[s.taskTitle, t.isCompleted && s.taskTitleDone]}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>
                  {t.description ? (
                    <Text style={s.taskDesc} numberOfLines={1}>{t.description}</Text>
                  ) : null}
                  <View style={s.taskMeta}>
                    <View style={[s.priorityPill, { backgroundColor: pr.color + '22', borderColor: pr.color }]}>
                      <View style={[s.priDot, { backgroundColor: pr.dot }]} />
                      <Text style={[s.priorityLabel, { color: pr.color }]}>{pr.label}</Text>
                    </View>
                    <View style={s.categoryPill}>
                      <Text style={s.categoryLabel}>{t.category}</Text>
                    </View>
                    {t.dueDate && (
                      <Text style={s.dueDate}>
                        📅 {new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={s.taskActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(t)} activeOpacity={0.7}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(t._id)} activeOpacity={0.7}>
                  <Text style={s.delBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editing ? 'Edit Task' : 'New Task'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Task Title *</Text>
              <TextInput
                style={s.input}
                value={form.title}
                onChangeText={v => setForm({ ...form, title: v })}
                placeholder="e.g. Call the tent decorator"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={s.fieldLabel}>Description</Text>
              <TextInput
                style={[s.input, { height: 72, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={v => setForm({ ...form, description: v })}
                placeholder="Additional details…"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />

              <Text style={s.fieldLabel}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {Object.entries(PRIORITY).map(([key, pc]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setForm({ ...form, priority: key })}
                    style={[s.priorityChip, form.priority === key && { borderColor: pc.color, backgroundColor: pc.color + '22' }]}
                    activeOpacity={0.7}
                  >
                    <View style={[s.priDot, { backgroundColor: pc.dot }]} />
                    <Text style={[s.priorityChipText, form.priority === key && { color: pc.color, fontWeight: '700' }]}>
                      {pc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setForm({ ...form, category: c })}
                      style={[s.catChip, form.category === c && s.catChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.catChipText, form.category === c && s.catChipTextActive]}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={s.input}
                value={form.dueDate}
                onChangeText={v => setForm({ ...form, dueDate: v })}
                placeholder="2026-11-20"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={s.saveBtnText}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Task'}</Text>
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
  container:    { flex: 1, backgroundColor: COLORS.deep },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep },

  // Progress
  progressCard:   { margin: SPACING.md, marginBottom: 0, backgroundColor: COLORS.deep2, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  progressRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle:  { fontSize: ms(15), fontWeight: '700', color: COLORS.textPrimary },
  progressSub:    { fontSize: ms(12), color: COLORS.textSecondary, marginTop: 2 },
  progressCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.goldBg, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  progressPct:    { fontSize: ms(14), fontWeight: '800', color: COLORS.gold },
  progressTrack:  { height: 7, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 10 },
  progressFill:   { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },
  toggleBtn:      { alignSelf: 'flex-end' },
  toggleBtnText:  { color: COLORS.gold, fontSize: ms(12), fontWeight: '600' },

  // Task Card
  taskCard:      { backgroundColor: COLORS.deep2, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  taskCardDone:  { opacity: 0.5 },
  taskMain:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  checkbox:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  checkboxDone:  { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  checkmark:     { color: COLORS.deep, fontSize: ms(13), fontWeight: '900' },
  taskBody:      { flex: 1 },
  taskTitle:     { fontSize: ms(14), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskDesc:      { fontSize: ms(12), color: COLORS.textSecondary, marginBottom: 6 },
  taskMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  priorityPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1 },
  priDot:        { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: ms(10), fontWeight: '700' },
  categoryPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: COLORS.surface2 },
  categoryLabel: { fontSize: ms(10), color: COLORS.textMuted, fontWeight: '600' },
  dueDate:       { fontSize: ms(11), color: COLORS.gold, fontWeight: '500' },
  taskActions:   { flexDirection: 'row', gap: 8 },
  editBtn:       { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  editBtnText:   { color: COLORS.gold, fontSize: ms(12), fontWeight: '700' },
  delBtn:        { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.pinkBg, borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', alignItems: 'center' },
  delBtnText:    { color: COLORS.pink, fontSize: ms(12), fontWeight: '700' },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.lg },
  emptyIcon:  { fontSize: ms(52), marginBottom: 12 },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText:  { color: COLORS.textMuted, fontSize: ms(13), textAlign: 'center', lineHeight: 20 },

  // FAB
  fab:     { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', ...SHADOWS.green },
  fabText: { color: COLORS.deep, fontSize: ms(30), fontWeight: '700', lineHeight: 34 },

  // Sheet
  overlay:     { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet:       { backgroundColor: COLORS.deep2, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg, maxHeight: '92%', borderTopWidth: 1, borderColor: COLORS.border },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle:  { fontSize: ms(20), fontWeight: '800', color: COLORS.goldLight, marginBottom: SPACING.md },

  // Form
  fieldLabel:    { fontSize: ms(12), color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input:         { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: 13, color: COLORS.textPrimary, fontSize: ms(14), marginBottom: 14 },
  priorityChip:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  priorityChipText: { color: COLORS.textMuted, fontSize: ms(12) },
  catChip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.borderLight },
  catChipActive:    { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  catChipText:      { color: COLORS.textSecondary, fontSize: ms(12) },
  catChipTextActive:{ color: COLORS.deep, fontWeight: '700' },
  modalBtns:        { flexDirection: 'row', gap: 10, marginTop: SPACING.sm, marginBottom: SPACING.md },
  cancelBtn:        { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center' },
  cancelBtnText:    { color: COLORS.gold, fontWeight: '700', fontSize: ms(14) },
  saveBtn:          { flex: 2, paddingVertical: 14, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center', ...SHADOWS.gold },
  saveBtnText:      { color: COLORS.deep, fontWeight: '800', fontSize: ms(15) },
});
