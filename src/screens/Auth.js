import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Button, C, Field, S, Banner, Txt } from '../components/UI';
import { adminApi } from '../services/api';

const FORM = { fullName: '', email: '', phone: '', password: '', setupKey: '' };
export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const update = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const submit = async () => {
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.');
    if (mode === 'signup' && (!form.fullName.trim() || !form.setupKey || form.password.length < 12)) return setError('Name, setup key and a password of at least 12 characters are required.');
    setError(''); setBusy(true);
    try {
      if (mode === 'signup') {
        await adminApi('/auth/register', { method: 'POST', body: { ...form, email: form.email.trim() } });
        setCreated(true); setForm({ ...FORM, email: form.email.trim() });
      } else {
        await adminApi('/auth/login', { method: 'POST', body: { email: form.email.trim(), password: form.password } });
        // Confirm the cookie was accepted by the native HTTP client before opening admin screens.
        const result = await adminApi('/session');
        if (!result?.admin) throw new Error('Login succeeded but the session cookie was not retained by your device. Check HTTPS and native cookie handling.');
        onAuthenticated(result.admin);
      }
    } catch (err) { setError(err.message || 'Sign-in failed.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ backgroundColor: C.sidebar, paddingHorizontal: 26, paddingTop: 34, paddingBottom: 40, minHeight: 258, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 36 }}>
          <View style={{ height: 45, width: 45, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent }}><ShieldCheck size={24} color="#fff"/></View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Supreme Fantasy League</Text>
        </View>
        <Text style={{ color: '#79c2fc', fontWeight: '800', letterSpacing: 1.1, fontSize: 11, marginBottom: 9 }}>{mode === 'login' ? 'RESTRICTED OPERATIONS PORTAL' : 'PRIVATE ADMINISTRATOR ENROLMENT'}</Text>
        <Text style={{ color: '#fff', fontSize: 29, fontWeight: '800', letterSpacing: -1.1, lineHeight: 35 }}>{mode === 'login' ? 'Manage the competition with confidence.' : 'Create an authorised operations account.'}</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 13, fontSize: 13, lineHeight: 21 }}>{mode === 'login' ? 'Review leagues, users, financial activity and support from one secure administrator workspace.' : 'A valid server-side setup key is required to create an administrator.'}</Text>
      </View>
      <View style={{ padding: 26, width: '100%', maxWidth: 550, alignSelf: 'center', paddingBottom: 60 }}>
        <Text style={[S.title, { fontSize: 26, marginBottom: 5 }]}>{mode === 'login' ? 'Administrator sign in' : 'Administrator enrolment'}</Text>
        <Txt muted style={{ marginBottom: 22 }}>{mode === 'login' ? 'Use your authorised administrator account.' : 'Create a restricted management account.'}</Txt>
        <Banner text={error}/>
        {created && mode === 'signup' ? <>
          <Banner tone="success" text="Administrator created successfully. You may now sign in."/>
          <Button label="Continue to sign in" block onPress={() => { setMode('login'); setCreated(false); }}/>
        </> : <>
          {mode === 'signup' ? <Field label="Full name" value={form.fullName} onChangeText={update('fullName')} autoCapitalize="words"/> : null}
          <Field label="Email address" value={form.email} onChangeText={update('email')} autoComplete="email" keyboardType="email-address"/>
          {mode === 'signup' ? <Field label="Phone number" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad"/> : null}
          <Field label="Password" value={form.password} onChangeText={update('password')} secret autoComplete={mode === 'login' ? 'current-password' : 'new-password'} helper={mode === 'signup' ? 'Use at least 12 characters.' : undefined}/>
          {mode === 'signup' ? <Field label="Administrator setup key" value={form.setupKey} onChangeText={update('setupKey')} secret helper="Enter the server-side ADMIN_SIGNUP_KEY. Do not hard-code the key into the app."/> : null}
          <Button label={busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create administrator'} onPress={submit} block disabled={busy}/>
        </>}
        <View style={{ alignItems: 'center', marginTop: 28 }}><Button label={mode === 'login' ? 'Enrol administrator with setup key' : 'Back to sign in'} tone="dark" variant="outline" onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setCreated(false); }}/></View>
        <Txt muted style={{ fontSize: 11, marginTop: 28, textAlign: 'center' }}>Administrator access is restricted and audited by the backend.</Txt>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
