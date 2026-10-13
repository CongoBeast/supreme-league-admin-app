import React, { useState } from 'react';
import { View } from 'react-native';
import { AlertTriangle, CheckCircle2, LifeBuoy } from 'lucide-react-native';
import { adminApi, buildQuery, dateTime, humanize } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Card, Empty, Field, FilterRow, ListRow, LoadState, options, PageHeader, Pagination, ScreenScroll, SelectField, StatCard, Stats } from '../components/UI';
export default function Tickets({ navigate }) {
  const [filters, setFilters] = useState({ search:'', status:'', priority:'', category:'' }); const [page, setPage] = useState(1);
  const query = buildQuery({ ...filters, page, limit:25 });
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi(`/tickets?${query}`), [query], filters.search ? 300 : 0);
  const setFilter = (k,v) => { setPage(1); setFilters((f) => ({ ...f, [k]:v })); };
  const rows = data?.rows || [], visibleOpen = rows.filter((t) => ['open','in-progress','waiting-user'].includes(t.status)).length;
  return <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
    <PageHeader title="Support tickets" description="Review customer issues, prioritise urgent requests, respond to users and keep a complete closure trail."/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      {data ? <Stats><StatCard label="Matching tickets" value={data.pagination?.total || 0} Icon={LifeBuoy}/><StatCard label="Open on this page" value={visibleOpen} tone="warning" Icon={LifeBuoy}/><StatCard label="Urgent on this page" value={rows.filter((t) => t.priority === 'urgent').length} tone="danger" Icon={AlertTriangle}/><StatCard label="Closed on this page" value={rows.filter((t) => t.status === 'closed').length} tone="success" Icon={CheckCircle2}/></Stats> : null}
      <Card><FilterRow>
        <Field label="Search tickets" value={filters.search} onChangeText={(v) => setFilter('search',v)} placeholder="Ticket number, subject or message"/>
        <SelectField label="Status" value={filters.status} onChange={(v) => setFilter('status',v)} options={options(['open','in-progress','waiting-user','resolved','closed'],'All statuses')}/>
        <SelectField label="Priority" value={filters.priority} onChange={(v) => setFilter('priority',v)} options={options(['low','normal','high','urgent'],'All priorities')}/>
        <Field label="Category" value={filters.category} onChangeText={(v) => setFilter('category',v)} placeholder="Payment, account, league…"/>
      </FilterRow></Card>
      <Card title="Support tickets" subtitle={data?.pagination ? `${data.pagination.total} results` : ''} noPadding>
        {rows.length ? rows.map((t) => <ListRow key={t._id} title={`${t.ticketNumber} · ${t.subject}`} subtitle={`${t.userId?.fullName || 'Guest'} · ${t.userId?.email || 'No account email'}`} third={`${humanize(t.category)} · ${humanize(t.priority)} priority · ${dateTime(t.lastActivityAt)}${t.closedBy?.fullName ? ' · Closed by '+t.closedBy.fullName : ''}`} badge={t.status} onPress={() => navigate('ticketDetail', t._id)}/>) : <View style={{ padding: 18 }}><Empty title="No support tickets match these filters"/></View>}
        <Pagination pagination={data?.pagination} onPageChange={setPage}/>
      </Card>
    </LoadState>
  </ScreenScroll>;
}
