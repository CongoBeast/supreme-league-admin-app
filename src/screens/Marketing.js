import React, { useState } from 'react';
import { View } from 'react-native';
import { Mail, RefreshCw, Send } from 'lucide-react-native';
import { adminApi, dateTime } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { MetaAds } from '../components/Analytics';
import { Banner, Button, Card, confirm, Empty, Field, ListRow, LoadState, PageHeader, ScreenScroll, Txt } from '../components/UI';
const BLANK = { subject:'', headline:'', preheader:'', message:'' };
export default function Marketing() {
  const [form, setForm] = useState(BLANK); const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(''); const [actionError, setActionError] = useState(''); const [refreshToken, setRefreshToken] = useState(0);
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi('/marketing/campaigns'), [refreshToken]);
  const { campaigns = [], optedInCount = 0, email } = data || {};
  const change = (key) => (value) => setForm((s) => ({ ...s, [key]: value }));
  const run = async (path, method, body, success) => {
    setBusy(true); setActionError(''); setNotice('');
    try { const result = await adminApi(path, { method, ...(body ? { body } : {}) }); setNotice(typeof success === 'function' ? success(result) : success); await refresh(); return result; }
    catch (e) { setActionError(e.message); return null; } finally { setBusy(false); }
  };
  const submit = async () => {
    if (!form.subject.trim() || !form.headline.trim() || !form.message.trim()) return setActionError('Subject, headline and message are required.');
    const ok = await run('/marketing/campaigns','POST',form,'Campaign saved as a draft. No email is sent until it is activated.');
    if (ok) setForm(BLANK);
  };
  const setStatus = (c,status) => {
    const doIt = () => run(`/marketing/campaigns/${c._id}`,'PATCH',{ status }, `Campaign ${status === 'active' ? 'activated' : 'paused'}.`);
    if (status === 'active') confirm('Activate promotional email?', `Activate “${c.subject}”? Emails go to members who explicitly opted into marketing.`, doIt);
    else doIt();
  };
  const testEmail = async () => {
    setBusy(true); setActionError(''); setNotice('');
    try { const r = await adminApi('/notifications/test-admin-email',{ method: 'POST' });
      if (r.notification?.status === 'sent') setNotice('Test message accepted by Resend. Confirm receipt in the operations mailbox.');
      else setActionError(r.notification?.error || r.notification?.reason || 'Test email was not submitted.');
    } catch (e) { setActionError(e.message); } finally { setBusy(false); }
  };
  const batch = () => confirm('Send next campaign batch?', 'This sends real promotional messages to eligible opted-in members using the server’s idempotent campaign runner.', () => run('/marketing/campaigns/run','POST',null,(r) => typeof r.skipped === 'string' ? r.skipped : `Campaign batch: ${r.sent || 0} sent, ${r.skipped || 0} skipped.${r.failed ? ' Provider error: '+r.failed : ''}`));
  return <ScreenScroll refreshing={refreshing} onRefresh={() => { refresh(); setRefreshToken((x) => x+1); }}>
    <PageHeader title="Marketing and promotional emails" description="Compose campaigns, activate them deliberately and track deliveries to customers who opted into marketing." actions={<Button label="Refresh" variant="outline" tone="dark" Icon={RefreshCw} onPress={() => setRefreshToken((x) => x+1)}/>}/>
    <Banner text={actionError}/><Banner text={notice} tone="success"/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      {data ? <>
        {email && !email.enabled ? <Banner tone="warning" text="Email delivery is disabled. Configure EMAILS_ENABLED and Resend credentials on your backend before activating campaigns."/> : null}
        {email?.enabled && !email.adminInboxConfigured ? <Banner tone="warning" text="Admin notification email is not configured. Critical operations alerts may be missed."/> : null}
        <Banner tone="info" text={`${optedInCount} opted-in profile(s). Promotional emails only reach explicit marketing opt-ins, in small, idempotent batches. Users can opt out in Profile.`}/>
        <View style={{ alignSelf: 'flex-start', marginBottom: 15 }}><Button label="Send test to admin inbox" variant="outline" tone="dark" Icon={Mail} onPress={testEmail} disabled={busy || !email?.enabled || !email?.adminInboxConfigured}/></View>
        <Card title="New promotional email" subtitle="Save as a draft before activating. Plain text is safely formatted in the email template.">
          <Field label="Email subject" value={form.subject} onChangeText={change('subject')} maxLength={160}/><Field label="Headline" value={form.headline} onChangeText={change('headline')} maxLength={160}/><Field label="Preview line (optional)" value={form.preheader} onChangeText={change('preheader')} maxLength={240}/><Field label="Message" value={form.message} onChangeText={change('message')} maxLength={4000} multiline/>
          <Button label={busy ? 'Saving…' : 'Save campaign draft'} onPress={submit} disabled={busy}/>
        </Card>
        <Card title="Campaigns" subtitle="Up to 100 recent campaigns. Paused campaigns can be resumed." action={<Button small label="Send next batch" Icon={Send} onPress={batch} disabled={busy || !email?.enabled} variant="outline"/>} noPadding>
          {campaigns.length ? campaigns.map((c) => <ListRow key={c._id} title={c.subject} subtitle={`${c.headline} · Created ${dateTime(c.createdAt)}`} third={`${c.sentCount || 0} sent / ${c.skippedCount || 0} skipped`} badge={c.status}>
            {c.status === 'active' ? <View style={{ alignSelf:'flex-start', marginTop:8 }}><Button small tone="warning" variant="outline" label="Pause" disabled={busy} onPress={() => setStatus(c,'paused')}/></View> : ['draft','paused'].includes(c.status) ? <View style={{ alignSelf:'flex-start', marginTop:8 }}><Button small variant="outline" label="Activate" disabled={busy || !email?.enabled} onPress={() => setStatus(c,'active')}/></View> : null}
          </ListRow>) : <View style={{ padding: 18 }}><Empty title="No promotional campaigns created yet"/></View>}
        </Card>
      </> : null}
    </LoadState>
    <MetaAds refreshToken={refreshToken}/>
  </ScreenScroll>;
}
