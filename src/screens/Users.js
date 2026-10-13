import React, { useState } from 'react';
import { View } from 'react-native';
import { RefreshCw, ShieldCheck, UserPlus, UsersRound } from 'lucide-react-native';
import { adminApi, buildQuery, dateTime, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Button, Card, C, Empty, Field, FilterRow, ListRow, LoadState, options, PageHeader, Pagination, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';
export default function Users({ navigate }) {
  const [filters, setFilters] = useState({ search: '', status: '' }); const [page, setPage] = useState(1); const [refreshIndex, setRefreshIndex] = useState(0);
  const query = buildQuery({ ...filters, page, limit: 25 });
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi(`/users?${query}`), [query, refreshIndex], filters.search ? 300 : 0);
  const { data: dashboard } = useApiData(() => adminApi('/dashboard'), []);
  const setFilter = (k, v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader title="Manage users" description="Wallet available, pending and total balances come from stored wallet records. Missing wallet documents are explicitly flagged, never shown as $0." actions={<Button label="Refresh balances" variant="outline" tone="dark" Icon={RefreshCw} onPress={() => setRefreshIndex((x) => x + 1)}/>}/>
    {dashboard ? <Stats><StatCard label="Total users" value={dashboard.users} Icon={UsersRound}/><StatCard label="New this month" value={dashboard.newUsers} tone="success" Icon={UserPlus}/><StatCard label="Active subscriptions" value={dashboard.activeSubscriptions} tone="info" Icon={ShieldCheck}/><StatCard label="League participants" value={dashboard.usersInLeagues} tone="warning" Icon={UsersRound}/></Stats> : null}
    <Card><FilterRow><Field label="Search users" value={filters.search} onChangeText={(v) => setFilter('search',v)} placeholder="Name, email or phone"/><SelectField label="Account status" value={filters.status} onChange={(v) => setFilter('status',v)} options={options(['active','suspended','closed'],'All statuses')}/></FilterRow></Card>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Card title="Users" subtitle={data?.pagination ? `${data.pagination.total} accounts` : ''} noPadding>
        {data?.rows?.length ? data.rows.map((u) => {
          const missing = u.walletStatus === 'missing' || !u.wallet;
          return <ListRow key={u.id} title={u.fullName} subtitle={`${u.email} · Joined ${dateTime(u.createdAt)}`} third={`${u.subscription?.planName || 'No active subscription'} · ${u.leagueCount || 0} leagues`} badge={u.status} onPress={() => navigate('userDetail',u.id)}>
            {missing ? <Txt style={{ color: C.danger, fontWeight: '700', fontSize: 12 }}>Wallet missing — investigate</Txt> : <Txt muted style={{ fontSize: 12 }}>Available {money(u.wallet.availableBalanceCents)} · Pending {money(u.wallet.pendingBalanceCents)} · Total {money(u.walletTotalCents ?? (Number(u.wallet.availableBalanceCents || 0) + Number(u.wallet.pendingBalanceCents || 0)))}</Txt>}
          </ListRow>;
        }) : <View style={{ padding: 18 }}><Empty title="No users match these filters" message="Clear the search or choose another account status."/></View>}
        <Pagination pagination={data?.pagination} onPageChange={setPage}/>
      </Card>
    </LoadState>
  </ScreenScroll>;
}
