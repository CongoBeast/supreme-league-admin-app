import React, { useState } from 'react';
import { View } from 'react-native';
import { Layers3, RefreshCw, Trophy, UsersRound } from 'lucide-react-native';
import { adminApi, buildQuery, competitionEntryLabel, dateTime, humanize } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, Empty, Field, FilterRow, ListRow, LoadState, options, PageHeader, Pagination, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';
const statuses = ['draft','open','full','upcoming','live','awaiting-review','settled','cancelled'];
export default function Leagues({ navigate }) {
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState(''); const [actionError, setActionError] = useState(''); const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const query = buildQuery({ ...filters, page, limit: 25 });
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi(`/leagues?${query}`), [query, index], filters.search ? 300 : 0);
  const { data: dashboard } = useApiData(() => adminApi('/dashboard'), []);
  const setFilter = (k, v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const checkResults = async () => {
    setBusy(true); setNotice(''); setActionError('');
    try {
      const r = await adminApi('/maintenance/check-results', { method: 'POST' });
      setNotice(`Checked every league: ${r?.standard?.refreshed || 0}/${r?.standard?.checked || 0} standard league(s) rescored; ${r?.supreme?.supremeSettlement?.settled || 0} Supreme league(s) settled. ${r?.standard?.failures?.length || 0} score sync error(s).`);
      setIndex((s) => s + 1);
    } catch (e) { setActionError(e.message); } finally { setBusy(false); }
  };
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader title="Manage leagues" description="Search every competition, review capacity and status, and manage its members, rules and leaderboard." actions={<Button label={busy ? 'Checking results…' : 'Check results status'} variant="outline" Icon={RefreshCw} onPress={checkResults} disabled={busy}/>}/>
    <Banner text={notice} tone="success"/><Banner text={actionError}/>
    {dashboard ? <Stats><StatCard label="All leagues" value={dashboard.leagues?.total} Icon={Trophy}/><StatCard label="Active leagues" value={dashboard.leagues?.active} Icon={UsersRound} tone="success"/><StatCard label="Inactive leagues" value={Math.max(0, dashboard.leagues?.total - dashboard.leagues?.active)} tone="warning" Icon={Layers3}/><StatCard label="League types" value={dashboard.leagues?.byType?.length} tone="info" Icon={Layers3}/></Stats> : null}
    <Card><FilterRow>
      <Field label="Search leagues" value={filters.search} onChangeText={(v) => setFilter('search', v)} placeholder="Name, type or status"/>
      <SelectField label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={options(statuses, 'All statuses')}/>
      <SelectField label="Competition type" value={filters.type} onChange={(v) => setFilter('type', v)} options={[{ value: '', label: 'All types' }, ...(dashboard?.leagues?.byType || []).map((t) => ({ value: t._id, label: humanize(t._id) }))]}/>
    </FilterRow></Card>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Card title="Leagues" subtitle={data?.pagination ? `${data.pagination.total} results` : ''} noPadding>
        {data?.rows?.length ? data.rows.map((l) => <ListRow key={l._id} title={l.name} subtitle={`${humanize(l.competitionType)} · ${l.memberCount}/${l.maximumParticipants} members`} third={`Gameweeks ${l.startGameweek}–${l.endGameweek} · ${competitionEntryLabel(l)} · ${dateTime(l.createdAt)}`} badge={l.status} onPress={() => navigate('leagueDetail', l._id)}/>) : <View style={{ padding: 18 }}><Empty title="No leagues match these filters" message="Clear the search or select another league status or type."/></View>}
        <Pagination pagination={data?.pagination} onPageChange={setPage}/>
      </Card>
    </LoadState>
  </ScreenScroll>;
}
