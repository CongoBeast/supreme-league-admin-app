import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { CalendarClock, RefreshCw, ShieldCheck, Trophy, UsersRound } from 'lucide-react-native';
import { adminApi, competitionEntryLabel, dateTime, humanize, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, confirm, Detail, Empty, Field, FilterRow, ListRow, LoadState, PageHeader, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';
const statuses = ['draft','open','full','upcoming','live','awaiting-review','cancelled'];
export default function LeagueDetail({ id, navigate, back }) {
  const { data, loading, refreshing, error, setError, refresh } = useApiData((p) => adminApi(`/leagues/${id}${p?.refresh ? '?refresh=1' : ''}`), [id]);
  const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(''); const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const didBackground = useRef(false);
  useEffect(() => { if (data && !didBackground.current) { didBackground.current = true; refresh({ refresh: true }); } }, [!!data]);
  const action = async (path, method, body, message) => {
    if (busy) return false;
    setBusy(true); setSuccess(''); setError('');
    try { await adminApi(`/leagues/${id}${path}`, { method, ...(body ? { body } : {}) }); setSuccess(message); await refresh(); return true; }
    catch (e) { setError(e.message); return false; } finally { setBusy(false); }
  };
  const league = data?.league || {}; const members = data?.leaderboard || []; const settlement = data?.settlement || {}; const verified = settlement.verified || {};
  const manualSettle = () => {
    if (!reason.trim()) return setError('Enter an override reason before manual settlement.');
    confirm('Manual settlement & prize payout', 'This can bypass delayed FPL data_checked, but backend verification MUST confirm all football fixtures are finished. You are authorising a real prize payment. Continue?', async () => {
      const ok = await action('/settlement/manual','POST',{ reason: reason.trim() },'League settled; prizes credited and winner emails queued.');
      if (ok) setReason('');
    }, true);
  };
  const removeMember = (member) => { const uid = member.user?._id; if (uid) confirm('Remove league member?',`Remove ${member.user?.fullName || member.user?.email || 'this member'} from the league?`, () => action(`/members/${uid}`,'DELETE',null,'Member removed.'), true); };
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader eyebrow="League management" title={league.name || 'League details'} description={league.description || 'Manage configuration, members, scores, rules and settlement.'} back={back} actions={league.status ? <SelectField label="League status" value={league.status} options={[{ value: 'settled', label: 'Settled (payment controls only)' }, ...statuses.map((s) => ({ value: s, label: humanize(s) }))]} onChange={(s) => { if (s !== 'settled' && s !== league.status) action('/status','PATCH',{ status: s },'League status updated.'); }} disabled={busy || league.status === 'settled'}/> : null}/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Banner tone="success" text={success}/>
      {data ? <>
        <Stats><StatCard label="Competition type" value={humanize(league.competitionType)} detail={humanize(league.ruleType)} Icon={Trophy}/><StatCard label="Members" value={`${members.length}/${league.maximumParticipants || 0}`} detail={`${settlement.eligibleParticipants ?? members.length} eligible for settlement`} Icon={UsersRound} tone="success"/><StatCard label="Entry / prize" value={`${competitionEntryLabel(league)} / ${money(league.displayedPrizeCents)}`} Icon={ShieldCheck} tone="warning"/><StatCard label="Gameweek window" value={`${league.startGameweek}–${league.endGameweek}`} detail={`Created ${dateTime(league.createdAt)}`} Icon={CalendarClock} tone="info"/></Stats>
        <Card title="Settlement control & diagnostics" subtitle="Changing a status does not pay prizes. Only the settlement controls do." warning>
          <Detail label="Football verified finished" value={verified.finished ? 'Yes' : 'No'}/><Detail label="FPL data_checked" value={verified.dataChecked ? 'Yes' : 'No'}/><Detail label="Eligible entries" value={settlement.eligibleParticipants}/><Detail label="Successfully scored" value={settlement.successfullyScored} last/>
          {settlement.meta?.lastError ? <Banner text={`Last settlement error: ${settlement.meta.lastError}`}/> : null}
          {settlement.scoreFailures?.length ? <Banner text={settlement.scoreFailures.join(' · ')}/> : null}
          {verified.fixtureStates?.length ? <Card title="Fixture verification">{verified.fixtureStates.map((f, i) => <View key={`${f.gameweek}-${i}`}><Txt strong>Gameweek {f.gameweek}</Txt><Detail label="Event finished" value={f.eventFinished ? 'Yes':'No'}/><Detail label="All fixtures finished" value={f.fixturesFinished ? 'Yes':'No'}/><Detail label="Fixtures" value={f.fixtureCount}/><Detail label="data_checked" value={f.dataChecked ? 'Yes':'No'} last/></View>)}</Card> : null}
          <View style={{ gap: 9, marginVertical: 14 }}><Button label="Refresh diagnostics" disabled={busy} variant="outline" Icon={RefreshCw} onPress={() => action('/refresh-scores','POST',{},'Scores refreshed from FPL.')}/><Button label="Retry automatic settlement" disabled={busy || league.status === 'settled'} Icon={Trophy} onPress={() => confirm('Retry settlement?', 'The server will verify the scores and eligibility before crediting prizes.', () => action('/settlement/retry','POST',{},'Automatic settlement retry completed.'))}/></View>
          <Field label="Manual settlement override reason" value={reason} onChangeText={setReason} multiline placeholder="E.g. I verified all final scores, but data_checked is delayed" helper="The override may bypass data_checked only. The backend still refuses settlement when fixtures are unfinished."/>
          <Button label={busy ? 'Updating…' : 'Manually settle & pay prizes'} tone="danger" disabled={busy || league.status === 'settled'} onPress={manualSettle}/>
        </Card>
        <Card title="League information" subtitle="Configuration, ownership and FPL timing">
          <Detail label="Status" value={humanize(league.status)}/><Detail label="Created by" value={league.createdBy?.fullName || league.createdBy?.email || 'System'}/><Detail label="Start gameweek" value={league.startGameweek}/><Detail label="End gameweek" value={league.endGameweek}/><Detail label="Join deadline" value={dateTime(league.fplJoinDeadlineAt)}/><Detail label="Football finished at" value={dateTime(league.fplFinishedAt)}/><Detail label="FPL data checked at" value={dateTime(league.fplDataCheckedAt)}/><Detail label="Official league" value={league.officialSupremeLeague ? 'Yes' : 'No'} last/>
        </Card>
        <Card title="League rules">{league.rules?.length ? league.rules.map((rule, i) => <Txt key={i} style={{ marginBottom: 9 }}>• {rule}</Txt>) : <Empty title="No league rules recorded"/>}</Card>
        <Card title="Add league member" subtitle="Add an existing user by email address">
          <Field label="User email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="member@example.com"/>
          <Button label={busy ? 'Updating league…' : 'Add member'} disabled={busy || !email.trim()} onPress={async () => { const ok = await action('/members','POST',{ email: email.trim() },'Member added to the league.'); if (ok) setEmail(''); }}/>
        </Card>
        <Card title="League leaderboard" subtitle={`${members.length} member(s) · prize and eligibility information`} noPadding>
          {members.length ? members.map((m, i) => <ListRow key={m.entryId || i} title={`${m.rank || '—'}. ${m.user?.fullName || 'Unknown user'}`} subtitle={`${m.user?.email || '—'} · Joined ${dateTime(m.joinedAt)}`} third={`${humanize(m.eligibilityStatus)} · Score ${m.score || 0} · Prize ${money(m.prizeCents)}`}>
            {m.scoreDetails?.captain ? <Txt muted style={{ fontSize: 11 }}>{m.scoreDetails.captain.name} {m.scoreDetails.captain.points} + {m.scoreDetails.viceCaptain?.name || 'Vice'} {m.scoreDetails.viceCaptain?.points || 0}</Txt> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {m.user?._id ? <Button small label="View user" onPress={() => navigate('userDetail', m.user._id)} variant="outline"/> : null}
              <Button small tone="danger" label="Remove" variant="outline" onPress={() => removeMember(m)} disabled={busy || league.status === 'settled' || !m.user?._id}/>
            </View>
          </ListRow>) : <View style={{ padding: 18 }}><Empty title="This league has no members" message="Use the form above to add an existing user."/></View>}
        </Card>
      </> : null}
    </LoadState>
  </ScreenScroll>;
}
