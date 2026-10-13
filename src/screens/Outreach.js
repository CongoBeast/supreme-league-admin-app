import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { Link2Off, MessageCircle, Trophy, UserRoundCheck, UserRoundX } from 'lucide-react-native';
import { adminApi, buildQuery, count, dateTime, whatsappHref } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, Empty, Field, FilterRow, ListRow, LoadState, PageHeader, Pagination, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';
const opts = (pairs) => pairs.map(([value,label]) => ({ value, label }));
export default function Outreach({ navigate }) {
  const [filters, setFilters] = useState({ search: '', contacted: 'all', team: 'all', paidLeague: 'all' });
  const [page, setPage] = useState(1); const [busyId, setBusyId] = useState(''); const [actionError, setActionError] = useState('');
  const query = buildQuery({ ...filters, page, limit: 25 });
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi(`/outreach?${query}`), [query], filters.search ? 300 : 0);
  const setFilter = (k,v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const toggle = async (u) => {
    setBusyId(u.id); setActionError('');
    try { await adminApi(`/outreach/${u.id}`, { method:'PATCH', body: { contacted: !u.whatsappOutreach?.contacted } }); await refresh(); }
    catch (e) { setActionError(e.message); } finally { setBusyId(''); }
  };
  const stats = data?.stats || {}, total = stats.totalUsers || 0;
  const detail = (m) => `${Number(m?.percentage || 0).toFixed(1)}% of ${count(total)} users`;
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader eyebrow="Member outreach" title="WhatsApp outreach" description="Track which members were contacted, open their WhatsApp chat and prioritise users without a linked FPL team or paid-league history."/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      {data && <Stats><StatCard label="Contacted" value={count(stats.contacted?.count)} detail={detail(stats.contacted)} tone="success" Icon={UserRoundCheck}/><StatCard label="Uncontacted" value={count(stats.uncontacted?.count)} detail={detail(stats.uncontacted)} tone="warning" Icon={UserRoundX}/><StatCard label="Team not linked" value={count(stats.notLinked?.count)} detail={detail(stats.notLinked)} tone="danger" Icon={Link2Off}/><StatCard label="Never played paid league" value={count(stats.neverPaidLeague?.count)} detail={detail(stats.neverPaidLeague)} tone="info" Icon={Trophy}/></Stats>}
      <Card><FilterRow>
        <Field label="Search members" placeholder="Name, email or phone" value={filters.search} onChangeText={(v) => setFilter('search',v)}/>
        <SelectField label="WhatsApp status" value={filters.contacted} onChange={(v) => setFilter('contacted',v)} options={opts([['all','All'],['uncontacted','Uncontacted'],['contacted','Contacted']])}/>
        <SelectField label="FPL team" value={filters.team} onChange={(v) => setFilter('team',v)} options={opts([['all','All team states'],['unlinked','Not linked'],['linked','Linked']])}/>
        <SelectField label="Paid league history" value={filters.paidLeague} onChange={(v) => setFilter('paidLeague',v)} options={opts([['all','All users'],['never','Never played paid'],['played','Has played paid']])}/>
      </FilterRow></Card>
      <Banner text={actionError}/>
      <Card title="Members" subtitle={data?.pagination ? `${data.pagination.total} outreach records` : ''} noPadding>
        {data?.rows?.length ? data.rows.map((u) => {
          const contacted = Boolean(u.whatsappOutreach?.contacted), href = whatsappHref(u.phone);
          return <ListRow key={u.id} title={u.fullName} subtitle={`${u.email} · ${u.phone || 'No phone'}`} third={`${u.teamLinked ? 'FPL team linked' : 'FPL team not linked'} · ${u.hasPlayedPaidLeague ? 'Played paid league' : 'Never played paid'}${u.fantasyTeamName ? ' · ' + u.fantasyTeamName : ''}`} badge={contacted ? 'contacted' : 'pending'}>
            {contacted && <Txt muted style={{ fontSize: 11 }}>Last contacted: {dateTime(u.whatsappOutreach?.contactedAt)}</Txt>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
              {href ? <Button small variant="outline" label="Open WhatsApp" Icon={MessageCircle} onPress={() => Linking.openURL(href).catch(() => setActionError('Could not open WhatsApp.'))}/> : null}
              <Button small tone={contacted ? 'dark' : 'primary'} label={busyId === u.id ? 'Saving…' : contacted ? 'Mark uncontacted' : 'Mark contacted'} onPress={() => toggle(u)} disabled={!!busyId}/>
              <Button small variant="outline" label="User details" onPress={() => navigate('userDetail',u.id)}/>
            </View>
          </ListRow>;
        }) : <View style={{ padding:18 }}><Empty title="No users match these outreach filters"/></View>}
        <Pagination pagination={data?.pagination} onPageChange={setPage}/>
      </Card>
    </LoadState>
  </ScreenScroll>;
}
