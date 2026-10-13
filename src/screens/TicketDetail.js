import React, { useState } from 'react';
import { View } from 'react-native';
import { Clock3, LifeBuoy, MessageSquareText, UserRound } from 'lucide-react-native';
import { adminApi, dateTime, humanize } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, C, Detail, Empty, Field, LoadState, PageHeader, ScreenScroll, SelectField, StatCard, Stats, Txt, confirm } from '../components/UI';
export default function TicketDetail({ id, back, navigate }) {
  const { data, loading, refreshing, error, setError, refresh } = useApiData(() => adminApi(`/tickets/${id}`), [id]);
  const [response, setResponse] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const ticket = data?.ticket || {};
  const save = async (patch, text) => {
    setBusy(true); setError(''); setNotice('');
    try { await adminApi(`/tickets/${id}`, { method:'PATCH', body:patch }); setNotice(text); if (patch.response) setResponse(''); await refresh(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const statusChange = (s) => {
    if (s === 'closed') confirm('Close support ticket?', 'Close this support ticket and record your administrator identity? The closure is audit logged.', () => save({ status:s }, 'Ticket closed.'));
    else save({ status:s }, 'Ticket status updated.');
  };
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader eyebrow="Support management" title={`${ticket.ticketNumber || ''}: ${ticket.subject || 'Ticket details'}`} description={`Opened ${dateTime(ticket.createdAt)} by ${ticket.userId?.email || 'a guest user'}.`} back={back}/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Banner tone="success" text={notice}/>
      {data ? <>
        <Stats><StatCard label="Status" value={humanize(ticket.status)} Icon={LifeBuoy}/><StatCard label="Priority" value={humanize(ticket.priority)} tone="warning" Icon={Clock3}/><StatCard label="Category" value={humanize(ticket.category)} tone="info" Icon={MessageSquareText}/><StatCard label="Customer" value={ticket.userId?.fullName || 'Guest'} detail={ticket.userId?.email || 'No account email'} tone="success" Icon={UserRound}/></Stats>
        <Card title="Original message" subtitle={`Submitted ${dateTime(ticket.createdAt)}`}><Txt style={{ lineHeight: 24 }} selectable>{ticket.message || '—'}</Txt></Card>
        <Card title="Conversation history" subtitle="Administrator and customer replies in chronological order">
          {ticket.responses?.length ? ticket.responses.map((r,i) => <View key={`${r.createdAt}-${i}`} style={{ backgroundColor: r.authorRole === 'admin' ? '#f4f8ff' : C.bg, borderColor: r.authorRole === 'admin' ? '#d8e6ff' : C.border, borderWidth: 1, borderRadius: 13, padding: 15, marginBottom: 12 }}>
            <Txt strong>{r.authorId?.fullName || humanize(r.authorRole)}</Txt><Txt muted style={{ fontSize: 11, marginBottom: 7 }}>{dateTime(r.createdAt)}</Txt><Txt selectable>{r.message}</Txt>
          </View>) : <Empty title="No responses have been added yet"/>}
        </Card>
        <Card title="Add administrator response" subtitle="Response is recorded with the administrator identity and time">
          <Field value={response} onChangeText={setResponse} multiline placeholder="Write a clear response or internal resolution update"/>
          <Button label={busy ? 'Saving response…' : 'Add response'} disabled={busy || !response.trim()} onPress={() => save({ response:response.trim() }, 'Administrator response added.')}/>
        </Card>
        <Card title="Ticket controls" subtitle="Update status and priority as work progresses">
          <SelectField label="Status" value={ticket.status} disabled={busy} onChange={statusChange} options={['open','in-progress','waiting-user','resolved','closed']}/>
          <SelectField label="Priority" value={ticket.priority} disabled={busy} onChange={(priority) => save({ priority }, 'Ticket priority updated.')} options={['low','normal','high','urgent']}/>
        </Card>
        <Card title="Closure information"><Detail label="Current status" value={humanize(ticket.status)}/><Detail label="Last activity" value={dateTime(ticket.lastActivityAt)}/><Detail label="Closed by" value={ticket.closedBy?.fullName}/><Detail label="Closed at" value={dateTime(ticket.closedAt)} last/>
          {ticket.userId?._id ? <View style={{ alignSelf: 'flex-start', marginTop: 13 }}><Button label="Open member account" variant="outline" small onPress={() => navigate('userDetail',ticket.userId._id)}/></View> : null}
        </Card>
      </> : null}
    </LoadState>
  </ScreenScroll>;
}
