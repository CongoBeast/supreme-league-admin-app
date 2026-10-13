import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Activity, Gift, ShieldCheck, Trophy, UserRound, WalletCards } from 'lucide-react-native';
import { adminApi, dateTime, humanize, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Badge, Banner, Button, Card, C, confirm, Detail, Empty, Field, ListRow, LoadState, NoticeModal, PageHeader, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';

const positionalOrder = ['GKP','DEF','MID','FWD'];
function Squad({ snapshot }) {
  const lineup = snapshot?.lineup || [];
  if (!lineup.length) return <Empty title="Squad lineup not available"/>;
  const playerView = (p, i) => <View key={p.elementId || i} style={{ width: 72, alignItems: 'center', margin: 3, padding: 4 }}>
    <View style={{ width: 34, height: 42, backgroundColor: '#f0f7ff', borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#004c39' }}>
      <Text style={{ color: '#123d33', fontSize: 10, fontWeight: '900' }}>{String(p.club || p.position || '?').slice(0, 3).toUpperCase()}</Text>
    </View>
    <Txt style={{ color: '#fff', textAlign: 'center', fontSize: 10, fontWeight: '700' }} numberOfLines={2}>{p.name}</Txt>
    <Txt style={{ color: '#e6fff0', textAlign: 'center', fontSize: 10 }}>{p.points || 0} pts {p.isCaptain ? '(C)' : p.isViceCaptain ? '(V)' : ''}</Txt>
  </View>;
  return <View>
    <View style={{ backgroundColor: '#237d51', borderWidth: 3, borderColor: '#dceee3', borderRadius: 16, paddingVertical: 17, paddingHorizontal: 8, marginBottom: 10, overflow: 'hidden' }}>
      {positionalOrder.map((pos) => <View key={pos} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginVertical: 10, borderBottomWidth: pos !== 'FWD' ? .5 : 0, borderColor: '#88bda0', paddingBottom: 9 }}>
        {lineup.filter((p) => p.starter && String(p.position).toUpperCase() === pos).map(playerView)}
      </View>)}
    </View>
    <Txt strong style={{ marginBottom: 6 }}>Bench</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {lineup.filter((p) => !p.starter).map((p,i) => <View key={p.elementId || i} style={{ width: '23%', backgroundColor: C.bg, borderRadius: 10, padding: 9 }}><Txt style={{ fontSize: 12, fontWeight: '700' }}>{p.name}</Txt><Txt muted style={{ fontSize: 10 }}>{p.club || p.position} · {p.points || 0} pts</Txt></View>)}
    </View>
  </View>;
}
const actionLabels = { bonus: 'Award performance bonus', credit: 'Credit wallet', debit: 'Debit wallet', refund: 'Cancel subscription & refund', end: 'End subscription without refund' };
export default function UserDetail({ id, navigate, back }) {
  const { data, loading, refreshing, error, setError, refresh } = useApiData((opts) => adminApi(`/users/${id}${opts?.refresh ? '?refresh=1' : ''}`), [id]);
  const once = useRef(false);
  useEffect(() => { if (data?.user?.fplManagerId && !once.current) { once.current = true; refresh({ refresh: true }); } }, [!!data]);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null); const [amount, setAmount] = useState(''); const [reason, setReason] = useState(''); const [modalError, setModalError] = useState('');
  const open = (type, item) => { setAmount(type === 'refund' ? (Number(item?.amountCents || 0)/100).toFixed(2) : ''); setReason(''); setModalError(''); setModal({ type, item }); };
  const close = () => { if (!busy) setModal(null); };
  const operation = async (path, method, body, text) => {
    setBusy(true); setError(''); setNotice('');
    try { await adminApi(path, { method, body }); setNotice(text); await refresh(); return true; }
    catch (e) { setError(e.message); return false; } finally { setBusy(false); }
  };
  const updateStatus = (status) => {
    if (status === data?.user?.status) return;
    const proceed = () => operation(`/users/${id}/status`, 'PATCH', { status }, 'User account status updated.');
    if (status !== 'active') confirm('Change user status?', `Set ${data.user.fullName}'s account to ${humanize(status)}?`, proceed, true);
    else proceed();
  };
  const submit = () => {
    if (!modal || busy) return;
    if (!reason.trim()) return setModalError('A clear reason is required for this financial or subscription action.');
    let path, body;
    const { type, item } = modal;
    const cents = Math.round(Number(amount) * 100);
    if (type !== 'end' && (!Number.isFinite(cents) || cents < (type === 'refund' ? 0 : 1))) return setModalError('Enter a valid USD amount.');
    if (type === 'refund' && cents > Number(item.amountCents || 0)) return setModalError('Refund cannot exceed the subscription amount.');
    if (type === 'refund') { path = `/subscriptions/${item._id}/cancel-refund`; body = { refundAmountCents: cents, reason: reason.trim() }; }
    if (type === 'end') { path = `/subscriptions/${item._id}/end`; body = { reason: reason.trim() }; }
    if (type === 'credit' || type === 'debit') { path = `/users/${id}/wallet/${type}`; body = { amountCents: cents, reason: reason.trim() }; }
    if (type === 'bonus') { path = `/users/${id}/performance-bonus`; body = { amountCents: cents, reason: reason.trim() }; }
    const info = type === 'refund' ? `Cancel this subscription and credit ${money(cents)} as a wallet refund?`
      : type === 'end' ? 'End this subscription immediately with NO refund?'
      : `${type === 'debit' ? 'Deduct' : 'Credit'} ${money(cents)} ${type === 'bonus' ? 'as a performance bonus' : 'from/to this member’s wallet'}? A confirmation email may be sent.`;
    confirm(actionLabels[type], info, async () => {
      setBusy(true); setModalError(''); setError('');
      try {
        await adminApi(path, { method: 'POST', body });
        setModal(null);
        setNotice(type === 'refund' ? 'Subscription cancelled; refund credited to wallet.' : type === 'end' ? 'Subscription ended without a refund.' : type === 'bonus' ? 'Performance bonus credited and member emailed.' : `Wallet ${type === 'debit' ? 'debited' : 'credited'} and member emailed.`);
        await refresh();
      } catch (e) { setModalError(e.message); }
      finally { setBusy(false); }
    }, type === 'debit' || type === 'refund');
  };
  const user = data?.user || {}, wallet = data?.wallet;
  const subscriptions = data?.subscriptions || [], entries = data?.entries || [], transactions = data?.transactions || [];
  const active = subscriptions.filter((s) => s.status === 'active');
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader eyebrow="User management" title={user.fullName || 'User details'} description="Personal information, FPL team data, subscriptions, league participation and financial history." back={back} actions={user.status ? <SelectField label="Account status" value={user.status} options={['active','suspended','closed']} onChange={updateStatus} disabled={busy}/> : null}/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Banner tone="success" text={notice}/>
      {data ? <>
        <Stats><StatCard label="Account status" value={humanize(user.status)} detail={`Joined ${dateTime(user.createdAt)}`} Icon={UserRound}/><StatCard label="League entries" value={entries.length} tone="warning" Icon={Trophy}/><StatCard label="Active subscriptions" value={active.length} detail={`${subscriptions.length} total`} tone="success" Icon={ShieldCheck}/><StatCard label="Wallet balance" value={wallet ? money(wallet.availableBalanceCents) : 'Wallet missing'} detail={wallet ? `${money(wallet.pendingBalanceCents)} pending` : 'Balance unavailable'} tone="info" Icon={WalletCards}/></Stats>
        <Card title="Personal information" subtitle="Identity and contact details stored on the account">
          <Detail label="Full name" value={user.fullName}/><Detail label="Email" value={user.email}/><Detail label="Phone" value={user.phone}/><Detail label="Date of birth" value={dateTime(user.dateOfBirth)}/><Detail label="FPL manager ID" value={user.fplManagerId || data.profile?.fplManagerId}/><Detail label="Fantasy team" value={user.fantasyTeamName || data.profile?.fantasyTeamName}/><Detail label="Created" value={dateTime(user.createdAt)}/><Detail label="Last updated" value={dateTime(user.updatedAt)} last/>
        </Card>
        <Card title="Wallet information" subtitle="Current balances and last balance activity">
          {!wallet ? <Banner text="Wallet record missing — do not assume the balance is zero."/> : null}
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom: 12 }}><Button small label="Performance bonus" Icon={Gift} onPress={() => open('bonus')}/><Button small label="Credit wallet" variant="outline" onPress={() => open('credit')}/><Button small label="Debit wallet" variant="outline" tone="danger" onPress={() => open('debit')}/></View>
          <Detail label="Wallet ID" value={wallet?.walletIdentifier}/><Detail label="Currency" value={wallet?.currency || 'USD'}/><Detail label="Available" value={wallet ? money(wallet.availableBalanceCents) : '— missing'}/><Detail label="Pending" value={wallet ? money(wallet.pendingBalanceCents) : '— missing'}/><Detail label="Chargeback balance" value={wallet ? money(wallet.chargebackBalanceCents) : '— missing'}/><Detail label="Last balance update" value={dateTime(wallet?.lastBalanceUpdateAt)} last/>
        </Card>
        <Card title="Live FPL profile & squad" subtitle="Automatically refreshed from public FPL data when opened">
          {data.team?.snapshot ? <>
            <Stats><StatCard label="Gameweek" value={data.team.snapshot.gameweek}/><StatCard label="GW points" value={data.team.snapshot.gameweekPoints}/><StatCard label="Total points" value={data.team.snapshot.totalPoints}/><StatCard label="Overall rank" value={Number(data.team.snapshot.overallRank || 0).toLocaleString('en-GB')}/></Stats>
            <Squad snapshot={data.team.snapshot}/>
          </> : <Empty title={user.fplManagerId ? 'FPL squad not published yet' : 'No FPL manager linked'} message={data.team?.error || 'There is no current squad snapshot.'}/>}
        </Card>
        <Card title="Subscription history" subtitle="Every subscription linked to this account" noPadding>
          {subscriptions.length ? subscriptions.map((s) => <ListRow key={s._id} title={s.planName || humanize(s.planCode)} subtitle={`${humanize(s.paymentMethod)} · Activated ${dateTime(s.activatedAt || s.createdAt)}`} third={`Valid until ${dateTime(s.validUntil)}`} badge={s.status}>
            {!['cancelled','expired','replaced'].includes(s.status) ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 }}><Button small tone="dark" variant="outline" label="End (no refund)" onPress={() => open('end',s)}/><Button small tone="danger" variant="outline" label="Cancel & refund" onPress={() => open('refund',s)}/></View> : null}
          </ListRow>) : <View style={{ padding: 18 }}><Empty title="No subscriptions recorded"/></View>}
        </Card>
        <Card title="League participation" subtitle="Joining time, score and rank" noPadding>
          {entries.length ? entries.map((e) => <ListRow key={e._id} title={e.leagueId?.name || 'Deleted league'} subtitle={`${humanize(e.leagueId?.competitionType)} · Joined ${dateTime(e.joinedAt)}`} third={`Rank ${e.currentRank || '—'} · Score ${e.currentScore || 0}`} badge={e.eligibilityStatus} onPress={e.leagueId?._id ? () => navigate('leagueDetail',e.leagueId._id) : undefined}/>) : <View style={{ padding: 18 }}><Empty title="No league activity"/></View>}
        </Card>
        <Card title="Financial transactions" subtitle="Latest 200 transactions for this user" noPadding>
          {transactions.length ? transactions.map((t) => <ListRow key={t._id} title={`${money(t.amountCents)} · ${t.metadata?.purpose === 'performance-bonus' ? 'Performance bonus' : humanize(t.type)}`} subtitle={`${t.reference || '—'} · ${dateTime(t.createdAt)}`} badge={t.status}/>) : <View style={{ padding: 18 }}><Empty title="No transactions recorded"/></View>}
        </Card>
      </> : null}
    </LoadState>
    <NoticeModal visible={!!modal} onClose={close} title={modal ? actionLabels[modal.type] : ''}>
      <Banner text={modalError}/>
      <Txt muted style={{ marginBottom: 15 }}>{modal?.type === 'refund' ? 'End this subscription immediately and credit all or part of the amount paid to the member’s wallet. The reason is included in the member email.' : modal?.type === 'end' ? 'End this subscription without refunding any funds. The reason is recorded in the audit log.' : modal?.type === 'bonus' ? 'Credit the available/withdrawable balance, record a performance-bonus transaction and email the member.' : modal?.type === 'debit' ? 'Deduct available funds. The backend validates the balance and sends an email to the member.' : 'Add funds directly to this member’s wallet and send a confirmation email.'}</Txt>
      {modal?.type !== 'end' ? <Field label={modal?.type === 'refund' ? 'Refund amount (USD)' : 'Amount (USD)'} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" helper={modal?.type === 'refund' ? `Maximum ${money(modal?.item?.amountCents)}.` : undefined}/> : null}
      <Field label="Reason" value={reason} onChangeText={setReason} multiline placeholder="Explain the adjustment / subscription action"/>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}><Button label="Close" tone="dark" variant="outline" onPress={close} disabled={busy}/><Button label={busy ? 'Saving…' : actionLabels[modal?.type] || 'Confirm'} tone={['refund','debit'].includes(modal?.type) ? 'danger' : 'primary'} onPress={submit} disabled={busy}/></View>
    </NoticeModal>
  </ScreenScroll>;
}
