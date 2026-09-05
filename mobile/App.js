import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  qualification: '',
  specialization: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  postalCode: '',
  password: '',
  confirmPassword: ''
};

function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', required = false }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8c98a8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );
}

export default function App() {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  useEffect(() => {
    if (!activeMeeting || !session) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/junnu/poll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeMeeting.roomId,
            peerId: activeMeeting.peerId,
            after: activeMeeting.after,
            identifier: session.user.email || session.user.phone,
            password: session.password,
            role: session.user.role
          })
        });
        const payload = await response.json();
        if (!cancelled && response.ok && payload.ok) {
          const incomingChat = (payload.messages || [])
            .filter((item) => item.type === 'chat' && item.data)
            .map((item) => item.data);
          if (incomingChat.length) setChatMessages((current) => [...current, ...incomingChat.filter((item) => !current.some((existing) => existing.id === item.id))]);
          setActiveMeeting((current) => current ? { ...current, after: payload.after || current.after } : current);
        }
      } catch (_error) {
        // Keep the room usable if a single poll misses during a network change.
      }
    };

    poll();
    const timer = setInterval(poll, 1800);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeMeeting?.roomId, activeMeeting?.peerId, session?.user?.id]);

  async function leaveMeeting() {
    if (activeMeeting && session) {
      await fetch(`${API_BASE_URL}/api/junnu/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeMeeting.roomId, peerId: activeMeeting.peerId, identifier: session.user.email || session.user.phone, password: session.password, role: session.user.role })
      }).catch(() => undefined);
    }
    setActiveMeeting(null);
    setChatMessages([]);
  }

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    setMessage('');
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register'
        ? { ...form, role, fullName: `${form.firstName} ${form.lastName}`.trim() }
        : { identifier: form.email || form.phone, password: form.password, role };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'Please check your details and try again.');
      setMessage(payload.message || (mode === 'register' ? 'Registration submitted for approval.' : 'Welcome back to Crab Learn.'));
      if (mode === 'register') {
        setForm(emptyForm);
        setMode('login');
      } else {
        setSession({ user: payload.student, password: form.password, classes: payload.classes || { sessions: [] }, assignments: payload.assignments || [] });
      }
    } catch (error) {
      setMessage(error.message || 'The service is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  const isTeacher = role === 'teacher';

  async function joinMeeting(meeting) {
    setBusy(true);
    setMessage('');
    try {
      const roomId = String(meeting.meeting_id || meeting.id);
      const response = await fetch(`${API_BASE_URL}/api/junnu/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, peerId: `${session.user.id}-${Date.now()}`, name: session.user.full_name, identifier: session.user.email || session.user.phone, password: session.password, role: session.user.role })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'Unable to join this meeting.');
      setActiveMeeting({ ...meeting, roomId, peerId: payload.peerId, after: payload.after || 0 });
      setChatMessages(payload.chat || []);
    } catch (error) {
      setMessage(error.message || 'Unable to join this meeting.');
    } finally {
      setBusy(false);
    }
  }

  async function openDirectChat(assignment) {
    await joinMeeting({
      id: `Direct-${assignment.id}`,
      meeting_id: `Direct-${assignment.id}`,
      subject: `Chat with ${session.user.role === 'student' ? assignment.teacher?.full_name : assignment.student?.full_name}`,
      mode_label: 'Direct chat',
      starts_at: new Date().toISOString(),
      join_url: ''
    });
  }

  async function sendChat() {
    const text = chatText.trim();
    if (!text || !activeMeeting) return;
    setChatText('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/junnu/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeMeeting.roomId, from: activeMeeting.peerId, to: '*', type: 'chat', identifier: session.user.email || session.user.phone, password: session.password, role: session.user.role, data: { id: `${activeMeeting.peerId}-${Date.now()}`, text } })
      });
      const payload = await response.json();
      if (payload.ok && payload.chat) setChatMessages(payload.chat);
    } catch (_error) {
      setMessage('Chat is temporarily unavailable.');
    }
  }

  if (session) {
    const currentMeetings = session.classes?.sessions || [];
    const previousMeetings = session.classes?.history || [];
    const meetings = [...currentMeetings, ...previousMeetings];
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.workspaceScroll}>
          <View style={styles.workspaceHeader}>
            <View>
              <Text style={styles.brand}>crablearn</Text>
              <Text style={styles.workspaceGreeting}>Hi, {session.user.first_name || session.user.full_name}</Text>
            </View>
            <Pressable onPress={() => { setSession(null); setActiveMeeting(null); }}><Text style={styles.signOut}>Sign out</Text></Pressable>
          </View>
          <Text style={styles.kicker}>YOUR CLASSROOM</Text>
          <Text style={styles.title}>Classes, chat, and live access.</Text>
          <Text style={styles.subtitle}>Everything for your next learning session, in one place.</Text>
          {activeMeeting ? (
            <View style={styles.card}>
              <View style={styles.meetingTitleRow}><View><Text style={styles.cardTitle}>Class chat</Text><Text style={styles.cardMeta}>{activeMeeting.subject || 'Junnu meeting'}</Text></View><Pressable onPress={leaveMeeting}><Text style={styles.closeText}>Leave</Text></Pressable></View>
              <View style={styles.chatBox}>
                {chatMessages.length ? chatMessages.map((item) => <View key={item.id} style={styles.chatBubble}><Text style={styles.chatName}>{item.name}</Text><Text style={styles.chatMessage}>{item.text}</Text></View>) : <Text style={styles.emptyText}>No messages yet. Say hello before class starts.</Text>}
              </View>
              <View style={styles.chatComposer}><TextInput value={chatText} onChangeText={setChatText} placeholder="Write a message" placeholderTextColor="#8c98a8" style={styles.chatInput} /><Pressable onPress={sendChat} style={styles.sendButton}><Text style={styles.sendText}>Send</Text></Pressable></View>
              {activeMeeting.join_url ? <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(activeMeeting.join_url)}><Text style={styles.primaryButtonText}>Open meeting room</Text></Pressable> : null}
            </View>
          ) : (
            <>
            <View style={styles.card}>
              <View style={styles.meetingTitleRow}><Text style={styles.cardTitle}>People to chat with</Text><Text style={styles.countBadge}>{session.assignments?.length || 0}</Text></View>
              {session.assignments?.length ? session.assignments.map((assignment) => (
                <View key={`chat-${assignment.id}`} style={styles.meetingRow}>
                  <View style={styles.meetingInfo}><Text style={styles.meetingSubject}>{session.user.role === 'student' ? assignment.teacher?.full_name : assignment.student?.full_name}</Text><Text style={styles.cardMeta}>{session.user.role === 'student' ? 'Your educator' : 'Assigned student'}</Text></View>
                  <Pressable style={styles.joinButton} onPress={() => openDirectChat(assignment)}><Text style={styles.joinText}>Chat</Text></Pressable>
                </View>
              )) : <Text style={styles.emptyText}>No student-educator assignment is connected yet.</Text>}
            </View>
            <View style={styles.card}>
              <View style={styles.meetingTitleRow}><Text style={styles.cardTitle}>Your meetings</Text><Text style={styles.countBadge}>{meetings.length}</Text></View>
              {meetings.length ? meetings.map((meeting) => (
                <View key={meeting.id} style={styles.meetingRow}>
                  <View style={styles.meetingInfo}><Text style={styles.meetingSubject}>{meeting.subject || 'Junnu class'}</Text><Text style={styles.cardMeta}>{meeting.mode_label || '1 to 1'} · {new Date(meeting.starts_at).toLocaleString()}</Text><Text style={styles.cardMeta}>{session.user.role === 'teacher' ? 'Teach this session' : 'Your learning session'}</Text></View>
                  <Pressable style={styles.joinButton} onPress={() => joinMeeting(meeting)}><Text style={styles.joinText}>Join</Text></Pressable>
                </View>
              )) : <Text style={styles.emptyText}>No meetings scheduled yet. Your next class will appear here.</Text>}
            </View>
            </>
          )}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}><Text style={styles.logoText}>CL</Text></View>
            <View style={styles.heroCopy}>
              <Text style={styles.brand}>crablearn</Text>
              <Text style={styles.tagline}>Personal learning, made human.</Text>
            </View>
            <View style={styles.heroOrb} />
          </View>

          <View style={styles.content}>
            <Text style={styles.kicker}>YOUR LEARNING SPACE</Text>
            <Text style={styles.title}>{mode === 'register' ? 'Start your next chapter.' : 'Welcome back.'}</Text>
            <Text style={styles.subtitle}>{isTeacher ? 'Share your expertise with students who are ready to grow.' : 'Build confidence with trusted one-to-one learning.'}</Text>

            <View style={styles.segmented}>
              {['student', 'teacher'].map((item) => (
                <Pressable key={item} style={[styles.segment, role === item && styles.segmentActive]} onPress={() => setRole(item)}>
                  <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>{item === 'student' ? 'Student' : 'Teacher'}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modeRow}>
              <Pressable onPress={() => setMode('register')}><Text style={[styles.modeText, mode === 'register' && styles.modeActive]}>Create account</Text></Pressable>
              <Text style={styles.modeDivider}>/</Text>
              <Pressable onPress={() => setMode('login')}><Text style={[styles.modeText, mode === 'login' && styles.modeActive]}>Log in</Text></Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{mode === 'register' ? `${isTeacher ? 'Teacher' : 'Student'} registration` : `${isTeacher ? 'Teacher' : 'Student'} login`}</Text>
              {mode === 'register' ? (
                <>
                  <View style={styles.twoColumn}>
                    <View style={styles.column}><Field label="First name" value={form.firstName} onChangeText={update('firstName')} placeholder="First name" required /></View>
                    <View style={styles.column}><Field label="Last name" value={form.lastName} onChangeText={update('lastName')} placeholder="Last name" required /></View>
                  </View>
                  <Field label="Email" value={form.email} onChangeText={update('email')} placeholder="you@example.com" keyboardType="email-address" required />
                  <Field label="Phone number" value={form.phone} onChangeText={update('phone')} placeholder="Optional mobile number" keyboardType="phone-pad" />
                  {isTeacher ? (
                    <>
                      <Field label="Qualification" value={form.qualification} onChangeText={update('qualification')} placeholder="B.Ed, M.Sc, Ph.D" required />
                      <Field label="Subject specialization" value={form.specialization} onChangeText={update('specialization')} placeholder="Mathematics, Science, English" required />
                    </>
                  ) : null}
                  <Field label="Address line 1" value={form.addressLine1} onChangeText={update('addressLine1')} placeholder="Street address" required />
                  <Field label="Address line 2" value={form.addressLine2} onChangeText={update('addressLine2')} placeholder="Area, landmark (optional)" />
                  <View style={styles.twoColumn}>
                    <View style={styles.column}><Field label="Country" value={form.country} onChangeText={update('country')} placeholder="IN" required /></View>
                    <View style={styles.column}><Field label="Postal code" value={form.postalCode} onChangeText={update('postalCode')} placeholder="Postal / ZIP" required /></View>
                  </View>
                </>
              ) : (
                <Field label="Email or phone" value={form.email} onChangeText={update('email')} placeholder="you@example.com" keyboardType="email-address" required />
              )}
              <Field label="Password" value={form.password} onChangeText={update('password')} placeholder="Your password" secureTextEntry required />
              {mode === 'register' ? <Field label="Confirm password" value={form.confirmPassword} onChangeText={update('confirmPassword')} placeholder="Repeat your password" secureTextEntry required /> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{mode === 'register' ? 'Submit registration' : 'Log in'}</Text>}
              </Pressable>
              <Text style={styles.footnote}>{mode === 'register' ? 'Your account will be reviewed before access is enabled.' : 'Use the email or phone number linked to your account.'}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#10243d'
  },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 36 },
  workspaceScroll: { paddingBottom: 40, backgroundColor: '#10243d', flexGrow: 1 },
  workspaceHeader: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workspaceGreeting: { color: '#c6d2df', fontSize: 15, marginTop: 6 },
  signOut: { color: '#f6a15e', fontWeight: '800', fontSize: 13 },
  hero: { minHeight: 190, paddingHorizontal: 24, paddingTop: 34, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#10243d', overflow: 'hidden' },
  logo: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#f05a0a', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroCopy: { marginLeft: 14 },
  brand: { color: '#fff', fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: '#b8c7d8', fontSize: 13, marginTop: 4 },
  heroOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -80, top: -100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  content: { marginTop: -48, paddingHorizontal: 18 },
  kicker: { color: '#f6a15e', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9 },
  title: { color: '#fff', fontSize: 32, lineHeight: 37, fontWeight: '800', maxWidth: 320 },
  subtitle: { color: '#c6d2df', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 340 },
  segmented: { flexDirection: 'row', padding: 4, marginTop: 24, borderRadius: 14, backgroundColor: '#203955' },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { color: '#b8c7d8', fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: '#19324a' },
  modeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 18 },
  modeText: { color: '#aebfd0', fontSize: 14, fontWeight: '700' },
  modeActive: { color: '#f6a15e' },
  modeDivider: { color: '#66809b', marginHorizontal: 11 },
  card: { padding: 20, borderRadius: 22, backgroundColor: '#fff', boxShadow: '0 10px 20px rgba(6, 21, 37, 0.22)', elevation: 8 },
  cardTitle: { color: '#19324a', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  cardMeta: { color: '#718096', fontSize: 12, lineHeight: 18 },
  meetingTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  countBadge: { minWidth: 28, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 20, backgroundColor: '#fff0e5', color: '#d35412', textAlign: 'center', fontWeight: '800' },
  closeText: { color: '#d35412', fontSize: 13, fontWeight: '800' },
  meetingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#edf0f3' },
  meetingInfo: { flex: 1, paddingRight: 12 },
  meetingSubject: { color: '#19324a', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  joinButton: { paddingVertical: 10, paddingHorizontal: 17, borderRadius: 10, backgroundColor: '#f05a0a' },
  joinText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  chatBox: { minHeight: 190, maxHeight: 330, padding: 12, marginBottom: 12, borderRadius: 14, backgroundColor: '#f4f7fa' },
  chatBubble: { alignSelf: 'flex-start', maxWidth: '88%', padding: 10, marginBottom: 8, borderRadius: 12, backgroundColor: '#fff' },
  chatName: { color: '#d35412', fontSize: 11, fontWeight: '800', marginBottom: 3 },
  chatMessage: { color: '#30465d', fontSize: 14, lineHeight: 19 },
  chatComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chatInput: { flex: 1, minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 12, backgroundColor: '#f8fafc', color: '#19324a' },
  sendButton: { paddingHorizontal: 14, minHeight: 46, justifyContent: 'center', borderRadius: 12, backgroundColor: '#19324a' },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  fieldGroup: { marginBottom: 13 },
  label: { color: '#30465d', fontSize: 12, fontWeight: '800', marginBottom: 7 },
  required: { color: '#f05a0a' },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 12, color: '#19324a', fontSize: 15, backgroundColor: '#f8fafc' },
  message: { color: '#bd4b16', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#f05a0a', marginTop: 4 },
  buttonPressed: { opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  footnote: { color: '#7b8795', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 14 }
});
