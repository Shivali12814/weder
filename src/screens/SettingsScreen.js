import React, { useState, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useAuth }           from '../context/AuthContext';
import API                   from '../utils/api';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import { ms } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Small reusable pieces ────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    <View style={s.card}>{children}</View>
  </View>
);

const Row = ({ icon, label, value, onPress, danger, right }) => (
  <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={s.rowIcon}>{icon}</Text>
    <View style={s.rowBody}>
      <Text style={[s.rowLabel, danger && { color: COLORS.pink }]}>{label}</Text>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
    </View>
    {right || (onPress ? <Text style={s.chevron}>›</Text> : null)}
  </TouchableOpacity>
);

const Divider = () => <View style={s.divider} />;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Profile edit state ────────────────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);
  const [profileName,  setProfileName]  = useState(user?.name  || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password state ────────────────────────────────────────────────────────
  const [showPassword,   setShowPassword]   = useState(false);
  const [currentPwd,     setCurrentPwd]     = useState('');
  const [newPwd,         setNewPwd]         = useState('');
  const [confirmPwd,     setConfirmPwd]     = useState('');
  const [pwdSaving,      setPwdSaving]      = useState(false);

  // ── Wedding state ─────────────────────────────────────────────────────────
  const [showWedding,    setShowWedding]    = useState(false);
  const [wedding,        setWedding]        = useState(null);
  const [weddingLoading, setWeddingLoading] = useState(false);
  const [weddingName,    setWeddingName]    = useState('');
  const [weddingDate,    setWeddingDate]    = useState('');
  const [weddingVenue,   setWeddingVenue]   = useState('');
  const [weddingCity,    setWeddingCity]    = useState('');
  const [weddingBudget,  setWeddingBudget]  = useState('');
  const [weddingGuests,  setWeddingGuests]  = useState('');
  const [weddingSaving,  setWeddingSaving]  = useState(false);

  // ── Notification toggles (in-memory prefs) ────────────────────────────────
  const [notifBooking,  setNotifBooking]  = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifVendor,   setNotifVendor]   = useState(true);
  const [notifEmail,    setNotifEmail]    = useState(false);

  // ── Privacy toggles ───────────────────────────────────────────────────────
  const [privacyProfile,  setPrivacyProfile]  = useState(true);
  const [privacyAnalytics,setPrivacyAnalytics]= useState(true);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!profileName.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    setProfileSaving(true);
    try {
      const res = await API.put('/auth/profile', { name: profileName.trim(), phone: profilePhone.trim() });
      if (updateUser) updateUser(res.data);
      Alert.alert('Success', 'Profile updated successfully.');
      setShowProfile(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update profile.');
    } finally { setProfileSaving(false); }
  };

  const savePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd)
      return Alert.alert('Error', 'All password fields are required.');
    if (newPwd.length < 6)
      return Alert.alert('Error', 'New password must be at least 6 characters.');
    if (newPwd !== confirmPwd)
      return Alert.alert('Error', 'New passwords do not match.');
    setPwdSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert('Success', 'Password changed successfully. Please log in again.', [
        { text: 'OK', onPress: logout },
      ]);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPassword(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not change password.');
    } finally { setPwdSaving(false); }
  };

  const loadWedding = async () => {
    setWeddingLoading(true);
    try {
      const res = await API.get('/weddings');
      const w = Array.isArray(res.data) ? res.data[0] : res.data?.weddings?.[0];
      if (w) {
        setWedding(w);
        setWeddingName(`${w.groomName || ''} & ${w.brideName || ''}`);
        setWeddingDate(w.weddingDate ? w.weddingDate.split('T')[0] : '');
        setWeddingVenue(w.venue || '');
        setWeddingCity(w.city || '');
        setWeddingBudget(String(w.totalBudget || ''));
        setWeddingGuests(String(w.guestCount || ''));
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load wedding details.');
    } finally { setWeddingLoading(false); }
  };

  const openWedding = () => {
    setShowWedding(true);
    loadWedding();
  };

  const saveWedding = async () => {
    if (!wedding) return;
    setWeddingSaving(true);
    try {
      const parts = weddingName.split('&');
      await API.put(`/weddings/${wedding._id}`, {
        groomName:   parts[0]?.trim() || wedding.groomName,
        brideName:   parts[1]?.trim() || wedding.brideName,
        weddingDate: weddingDate || wedding.weddingDate,
        venue:       weddingVenue,
        city:        weddingCity,
        totalBudget: parseInt(weddingBudget) || wedding.totalBudget,
        guestCount:  parseInt(weddingGuests) || wedding.guestCount,
      });
      Alert.alert('Success', 'Wedding details updated.');
      setShowWedding(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update wedding details.');
    } finally { setWeddingSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and ALL data (wedding, bookings, dahej items, guests). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete', style: 'destructive',
          onPress: () => Alert.alert(
            'Final Confirmation',
            'Type your email in the next step to confirm. Are you absolutely sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete My Account', style: 'destructive',
                onPress: async () => {
                  try {
                    await API.delete('/auth/account');
                    logout();
                  } catch (e) {
                    Alert.alert('Error', e.response?.data?.message || 'Could not delete account.');
                  }
                },
              },
            ]
          ),
        },
      ]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + ms(24) }]}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={s.userName}>{user?.name}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        {user?.phone ? <Text style={s.userPhone}>📱 {user.phone}</Text> : null}
      </View>

      {/* Account */}
      <Section title="Account">
        <Row icon="✏️" label="Edit Profile"        onPress={() => { setProfileName(user?.name || ''); setProfilePhone(user?.phone || ''); setShowProfile(true); }} />
        <Divider />
        <Row icon="🔒" label="Change Password"     onPress={() => setShowPassword(true)} />
        <Divider />
        <Row icon="💍" label="Wedding Details"      onPress={openWedding} />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row icon="📩" label="Booking Alerts"       right={<Switch value={notifBooking}  onValueChange={setNotifBooking}  trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="⏰" label="Wedding Reminders"    right={<Switch value={notifReminder} onValueChange={setNotifReminder} trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="🏪" label="Vendor Updates"       right={<Switch value={notifVendor}   onValueChange={setNotifVendor}   trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="📧" label="Email Notifications"  right={<Switch value={notifEmail}    onValueChange={setNotifEmail}    trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <Row icon="👁️" label="Public Profile"       value="Visible to vendors when you send requests"
          right={<Switch value={privacyProfile}   onValueChange={setPrivacyProfile}   trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="📊" label="Share Usage Data"    value="Help us improve the app"
          right={<Switch value={privacyAnalytics} onValueChange={setPrivacyAnalytics} trackColor={{ true: COLORS.gold }} thumbColor="#fff" />} />
      </Section>

      {/* Help & Support */}
      <Section title="Help & Support">
        <Row icon="❓" label="FAQ"                  onPress={() => Alert.alert('FAQs', 'Visit weder.in/faq for frequently asked questions.')} />
        <Divider />
        <Row icon="💬" label="Contact Support"      onPress={() => Alert.alert('Contact Support', 'Email: support@weder.in\nWhatsApp: +91 99999 00000\nHours: 9 AM – 9 PM, Mon–Sat')} />
        <Divider />
        <Row icon="🐛" label="Report a Bug"         onPress={() => Alert.alert('Report Bug', 'Send a detailed description to bugs@weder.in and we will fix it within 24 hours.')} />
        <Divider />
        <Row icon="⭐" label="Rate the App"         onPress={() => Alert.alert('Rate Weder', 'Thank you! Please rate us on the Play Store / App Store.')} />
      </Section>

      {/* About */}
      <Section title="About">
        <Row icon="ℹ️" label="About Weder"       value="All-in-one Indian wedding management" onPress={() => Alert.alert('About Weder', 'Weder helps you plan every aspect of your wedding — vendors, budget, guests, dahej, and more.\n\nBuilt with ❤️ for Indian families.')} />
        <Divider />
        <Row icon="📋" label="Terms of Service"    onPress={() => Alert.alert('Terms of Service', 'Visit weder.in/terms for our full terms of service.')} />
        <Divider />
        <Row icon="🛡️" label="Privacy Policy"      onPress={() => Alert.alert('Privacy Policy', 'Visit weder.in/privacy for our privacy policy.')} />
        <Divider />
        <Row icon="🔖" label="App Version"          value="v1.0.0 (Build 100)" />
      </Section>

      {/* Session */}
      <Section title="Session">
        <Row icon="🚪" label="Log Out" onPress={handleLogout} danger />
      </Section>

      {/* Danger Zone */}
      <View style={s.dangerSection}>
        <Text style={s.dangerTitle}>⚠️ Danger Zone</Text>
        <View style={s.dangerCard}>
          <Text style={s.dangerDesc}>Permanently delete your account and all associated data. This action cannot be undone.</Text>
          <TouchableOpacity style={s.dangerBtn} onPress={handleDeleteAccount}>
            <Text style={s.dangerBtnText}>🗑️ Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <Modal visible={showProfile} transparent animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Edit Profile</Text>

            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput style={s.input} value={profileName} onChangeText={setProfileName}
              placeholder="Your name" placeholderTextColor={COLORS.textMuted} />

            <Text style={s.inputLabel}>Phone Number</Text>
            <TextInput style={s.input} value={profilePhone} onChangeText={setProfilePhone}
              placeholder="10-digit mobile number" placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad" maxLength={10} />

            <Text style={s.infoNote}>📧 Email cannot be changed for security reasons.</Text>

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowProfile(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={profileSaving}>
                {profileSaving ? <ActivityIndicator color="#1A0A2E" size="small" />
                  : <Text style={s.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ──────────────────────────────────────────── */}
      <Modal visible={showPassword} transparent animationType="slide" onRequestClose={() => setShowPassword(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Change Password</Text>

            <Text style={s.inputLabel}>Current Password</Text>
            <TextInput style={s.input} value={currentPwd} onChangeText={setCurrentPwd}
              placeholder="Enter current password" placeholderTextColor={COLORS.textMuted}
              secureTextEntry autoCapitalize="none" />

            <Text style={s.inputLabel}>New Password</Text>
            <TextInput style={s.input} value={newPwd} onChangeText={setNewPwd}
              placeholder="Minimum 6 characters" placeholderTextColor={COLORS.textMuted}
              secureTextEntry autoCapitalize="none" />

            <Text style={s.inputLabel}>Confirm New Password</Text>
            <TextInput style={s.input} value={confirmPwd} onChangeText={setConfirmPwd}
              placeholder="Re-enter new password" placeholderTextColor={COLORS.textMuted}
              secureTextEntry autoCapitalize="none" />

            <Text style={s.infoNote}>🔒 After changing your password you will be logged out automatically.</Text>

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowPassword(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={savePassword} disabled={pwdSaving}>
                {pwdSaving ? <ActivityIndicator color="#1A0A2E" size="small" />
                  : <Text style={s.saveBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Wedding Details Modal ──────────────────────────────────────────── */}
      <Modal visible={showWedding} transparent animationType="slide" onRequestClose={() => setShowWedding(false)}>
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={s.sheetScroll} keyboardShouldPersistTaps="handled">
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Wedding Details</Text>

            {weddingLoading ? (
              <ActivityIndicator color={COLORS.gold} size="large" style={{ marginVertical: 40 }} />
            ) : !wedding ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ fontSize: ms(40), marginBottom: 12 }}>💍</Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                  No wedding created yet.{'\n'}Go to Dashboard to create your wedding.
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.inputLabel}>Groom & Bride Names</Text>
                <TextInput style={s.input} value={weddingName} onChangeText={setWeddingName}
                  placeholder="e.g. Rahul & Priya" placeholderTextColor={COLORS.textMuted} />

                <Text style={s.inputLabel}>Wedding Date (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={weddingDate} onChangeText={setWeddingDate}
                  placeholder="2025-02-14" placeholderTextColor={COLORS.textMuted} />

                <Text style={s.inputLabel}>Venue</Text>
                <TextInput style={s.input} value={weddingVenue} onChangeText={setWeddingVenue}
                  placeholder="Hall or location name" placeholderTextColor={COLORS.textMuted} />

                <Text style={s.inputLabel}>City</Text>
                <TextInput style={s.input} value={weddingCity} onChangeText={setWeddingCity}
                  placeholder="City" placeholderTextColor={COLORS.textMuted} />

                <Text style={s.inputLabel}>Total Budget (₹)</Text>
                <TextInput style={s.input} value={weddingBudget} onChangeText={setWeddingBudget}
                  placeholder="e.g. 2500000" placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric" />

                <Text style={s.inputLabel}>Expected Guests</Text>
                <TextInput style={s.input} value={weddingGuests} onChangeText={setWeddingGuests}
                  placeholder="e.g. 400" placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric" />

                <View style={s.sheetActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setShowWedding(false)}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={saveWedding} disabled={weddingSaving}>
                    {weddingSaving ? <ActivityIndicator color="#1A0A2E" size="small" />
                      : <Text style={s.saveBtnText}>Save Changes</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.deep },

  // Header
  header:          { alignItems: 'center', paddingBottom: 32, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 2, borderColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:      { fontSize: ms(34), fontWeight: '800', color: COLORS.gold },
  userName:        { fontSize: ms(20), fontWeight: '800', color: COLORS.cream, marginBottom: 4 },
  userEmail:       { fontSize: ms(13), color: COLORS.textSecondary, marginBottom: 2 },
  userPhone:       { fontSize: ms(12), color: COLORS.textMuted },

  // Sections
  section:         { marginTop: 24, paddingHorizontal: SPACING.md },
  sectionTitle:    { fontSize: ms(11), fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  card:            { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, overflow: 'hidden' },

  // Rows
  row:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: SPACING.md, minHeight: 52 },
  rowIcon:         { fontSize: ms(18), width: 30, textAlign: 'center', marginRight: 12 },
  rowBody:         { flex: 1 },
  rowLabel:        { fontSize: ms(14), fontWeight: '600', color: COLORS.cream },
  rowValue:        { fontSize: ms(11), color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  chevron:         { fontSize: ms(22), color: COLORS.textMuted, marginLeft: 8 },
  divider:         { height: 1, backgroundColor: COLORS.borderLight, marginLeft: 58 },

  // Danger
  dangerSection:   { marginTop: 24, marginHorizontal: SPACING.md },
  dangerTitle:     { fontSize: ms(11), fontWeight: '700', color: COLORS.pink, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  dangerCard:      { backgroundColor: 'rgba(232,84,122,0.07)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.3)', borderRadius: RADIUS.lg, padding: SPACING.md },
  dangerDesc:      { fontSize: ms(13), color: 'rgba(253,246,236,0.55)', lineHeight: 20, marginBottom: 14 },
  dangerBtn:       { padding: 12, borderRadius: RADIUS.full, backgroundColor: 'rgba(232,84,122,0.15)', borderWidth: 1, borderColor: 'rgba(232,84,122,0.45)', alignItems: 'center' },
  dangerBtnText:   { color: COLORS.pink, fontSize: ms(14), fontWeight: '700' },

  // Modal / Sheet
  overlay:         { flex: 1, backgroundColor: 'rgba(6,2,14,0.88)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#1F1042', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 36 },
  sheetScroll:     { backgroundColor: '#1F1042', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 36 },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetTitle:      { fontSize: ms(18), fontWeight: '800', color: COLORS.cream, marginBottom: 20 },

  // Inputs
  inputLabel:      { fontSize: ms(12), fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 14 },
  input:           { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.cream, fontSize: ms(14) },
  infoNote:        { fontSize: ms(12), color: COLORS.textMuted, marginTop: 16, lineHeight: 18 },

  // Sheet actions
  sheetActions:    { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn:       { flex: 1, padding: 13, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText:   { color: COLORS.textSecondary, fontSize: ms(14), fontWeight: '600' },
  saveBtn:         { flex: 2, padding: 13, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center' },
  saveBtnText:     { color: '#1A0A2E', fontSize: ms(14), fontWeight: '800' },
});
