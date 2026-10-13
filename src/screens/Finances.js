import React, { useState } from 'react';
import { View } from 'react-native';
import { ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, RefreshCw, WalletCards } from 'lucide-react-native';
import { adminApi, buildQuery, dateTime, defaultDateRange, humanize, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, confirm, Detail, Empty, Field, FilterRow, ListRow, LoadState, NoticeModal, options, PageHeader, Pagination, ScreenScroll, SelectField, StatCard, Stats, Txt } from '../components/UI';
const types = ['deposit','subscription','entry-fee','platform-fee','prize','withdrawal','refund','adjustment'];
const statuses = ['pending','processing','completed','failed','cancelled','refunded','rejected'];
export default function Finances({ navigate }) {
  const [filters, setFilters] = useState(() => ({ search:'', type:'', provider:'', status:'', direction:'', minAmount:'', maxAmount:'', ...defaultDateRange() }));
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(''); const [note, setNote] = useState(''); const [statusBusy, setStatusBusy] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const query = buildQuery({ ...filters, page, limit: 50, refresh: refreshIndex || undefined });
  const { data, loading, refreshing, error, refresh } = useApiData(() => adminApi(`/transactions?${query}`), [query], filters.search ? 300 : 0);
  const setFilter = (key, value) => { setPage(1); setFilters((s) => ({ ...s, [key]:value })); };
  const open = async (id) => {
    setSelected({ _id:id }); setModalLoading(true); setModalError(''); setNote('');
    try { const r = await adminApi(`/transactions/${id}`); setSelected(r.transaction); }
    catch (e) { setModalError(e.message); } finally { setModalLoading(false); }
  };
  const updateWithdrawal = (status) => {
    confirm(`Mark withdrawal ${status}?`, status === 'completed' ? 'Only mark paid after actually sending USD to the confirmed destination and checking bank/provider records. The user will receive an email.' : `Change withdrawal status to ${status}? This is recorded and may trigger an email.`, async () => {
      setStatusBusy(true); setModalError('');
      try { const r = await adminApi(`/withdrawals/${selected._id}/status`, { method:'PATCH', body: { status, note } }); setSelected(r.transaction); setNote(''); await refresh(); }
      catch (e) { setModalError(e.message); } finally { setStatusBusy(false); }
    }, status === 'rejected' || status === 'cancelled' || status === 'completed');
  };
  const summary = data?.summary || [], breakdown = data?.revenueBreakdown || [];
  const totalFor = (type) => Number(breakdown.find((r) => r.type === type)?.amountCents || 0);
  const sumCredit = summary.filter((r) => r._id?.status === 'completed' && r._id?.direction === 'credit').reduce((a, r) => a + Number(r.amountCents || 0), 0);
  const totals = { inflow: Number(data?.cashIn?.amountCents ?? sumCredit), subscriptions: totalFor('subscription'), revenue: Number(data?.revenue?.amountCents || 0), payoutsDue: Number(data?.payoutsDue?.amountCents || 0) };
  return <ScreenScroll refreshing={refreshing} onRefresh={() => setRefreshIndex((v) => v+1)}>
    <PageHeader title="Financial management" description="Review incoming funds, subscriptions, league fees, payouts and every recorded transaction." actions={<Button label="Refresh database" variant="outline" tone="dark" Icon={RefreshCw} onPress={() => setRefreshIndex((v) => v+1)}/>}/>
    <LoadState data={data} loading={loading} error={error} onRetry={refresh}>
      <Card title="Verified-record cash flow" subtitle="Lifetime, this month, last month · UTC months · mock and wallet-funded payments excluded">
        {[['Since launch',data?.cashAccounting?.lifetime],['This month',data?.cashAccounting?.thisMonth],['Last month',data?.cashAccounting?.lastMonth]].map(([label, cash]) => <View key={label} style={{ borderWidth: 1, borderColor: '#e6eaf0', padding: 13, marginBottom: 9, borderRadius: 14 }}><Txt strong>{label}</Txt><Detail label="Collected" value={money(cash?.collectedCents)}/><Detail label="Withdrawals paid" value={money(cash?.paidOutCents)}/><Detail label="Net movement" value={money(cash?.netCashMovementCents)} last/></View>)}
        <Txt muted>Ledger totals require reconciliation against external provider or bank statements. Wallet prize credits are internal, not cash withdrawals.</Txt>
      </Card>
      {data ? <Stats><StatCard label="Cash inflow" value={money(totals.inflow)} detail={`${filters.from} to ${filters.to}`} Icon={ArrowDownToLine} tone="success"/><StatCard label="Platform revenue" value={money(totals.revenue)} Icon={CircleDollarSign}/><StatCard label="Subscriptions" value={money(totals.subscriptions)} Icon={WalletCards} tone="warning"/><StatCard label="Payouts due" value={money(totals.payoutsDue)} Icon={ArrowUpFromLine} tone="danger"/></Stats> : null}
      <Card title="Transaction filters" subtitle="Dates use YYYY-MM-DD and follow UTC reporting windows">
        <FilterRow><Field label="From (YYYY-MM-DD)" value={filters.from} onChangeText={(v) => setFilter('from',v)} placeholder="YYYY-MM-DD"/><Field label="To (YYYY-MM-DD)" value={filters.to} onChangeText={(v) => setFilter('to',v)} placeholder="YYYY-MM-DD"/><Field label="Search" value={filters.search} onChangeText={(v) => setFilter('search',v)} placeholder="Reference or description"/>
          <SelectField label="Purpose" value={filters.type} onChange={(v) => setFilter('type',v)} options={options(types,'All purposes')}/>
          <SelectField label="Status" value={filters.status} onChange={(v) => setFilter('status',v)} options={options(statuses,'All statuses')}/>
          <SelectField label="Direction" value={filters.direction} onChange={(v) => setFilter('direction',v)} options={[{ value:'', label:'Both directions' },{ value:'credit', label:'Credit' },{ value:'debit',label:'Debit' }]}/>
          <Field label="Provider" value={filters.provider} onChangeText={(v) => setFilter('provider',v)} placeholder="e.g. paynow"/>
          <Field label="Minimum amount (USD)" value={filters.minAmount} onChangeText={(v) => setFilter('minAmount',v)} keyboardType="decimal-pad"/>
          <Field label="Maximum amount (USD)" value={filters.maxAmount} onChangeText={(v) => setFilter('maxAmount',v)} keyboardType="decimal-pad"/>
        </FilterRow>
      </Card>
      <Card title="Transactions" subtitle={data?.pagination ? `${data.pagination.total} records · tap to inspect` : ''} noPadding>
        {data?.rows?.length ? data.rows.map((t) => <ListRow key={t._id} title={`${money(t.amountCents)} · ${humanize(t.type)}`} subtitle={`${t.reference || '—'} · ${t.userId?.fullName || t.userId?.email || 'System transaction'}`} third={`${dateTime(t.createdAt)} · ${humanize(t.provider)} · ${humanize(t.direction)}`} badge={t.status} onPress={() => open(t._id)}/>) : <View style={{ padding: 18 }}><Empty title="No transactions match these filters"/></View>}
        <Pagination pagination={data?.pagination} onPageChange={setPage}/>
      </Card>
    </LoadState>
    <NoticeModal visible={!!selected} onClose={() => { if (!statusBusy) { setSelected(null); setModalError(''); } }} title="Transaction details">
      {modalLoading ? <Txt muted>Loading transaction details…</Txt> : null}
      <Banner text={modalError}/>
      {selected && !modalLoading ? <>
        <Detail label="Reference" value={selected.reference}/><Detail label="Status" value={humanize(selected.status)}/><Detail label="Amount" value={money(selected.amountCents)}/><Detail label="Direction" value={humanize(selected.direction)}/><Detail label="Purpose" value={humanize(selected.type)}/><Detail label="Provider" value={humanize(selected.provider)}/><Detail label="Payment method" value={humanize(selected.paymentMethod)}/><Detail label="Created" value={dateTime(selected.createdAt)}/><Detail label="User" value={selected.userId?.fullName || selected.userId?.email || 'System'}/><Detail label="League" value={selected.leagueId?.name}/><Detail label="Description" value={selected.description}/><Detail label="Last updated" value={dateTime(selected.updatedAt)} last/>
        {selected.type === 'withdrawal' ? <Card title="Withdrawal review" subtitle="Pay only the USD destination shown below. Status changes email the user." warning>
          <Detail label="Method" value={selected.metadata?.method}/><Detail label="Account name" value={selected.metadata?.accountName}/><Detail label="Bank" value={selected.metadata?.bankName}/><Detail label="Branch" value={selected.metadata?.branchNumber}/><Detail label="USD account" value={selected.metadata?.accountNumber} last/>
          <Field label="Optional internal note" value={note} onChangeText={setNote} multiline/>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {selected.status === 'pending' ? <Button small label="Mark processing" disabled={statusBusy} onPress={() => updateWithdrawal('processing')}/> : null}
            {['pending','processing'].includes(selected.status) ? <><Button small label="Mark paid" tone="success" disabled={statusBusy} onPress={() => updateWithdrawal('completed')}/><Button small label="Reject" tone="danger" disabled={statusBusy} onPress={() => updateWithdrawal('rejected')}/><Button small label="Cancel" variant="outline" disabled={statusBusy} onPress={() => updateWithdrawal('cancelled')}/></> : null}
          </View>
        </Card> : null}
        {selected.userId?._id ? <View style={{ alignSelf:'flex-start', marginVertical:12 }}><Button small label="View user" variant="outline" onPress={() => { setSelected(null); navigate('userDetail',selected.userId._id); }}/></View> : null}
      </> : null}
    </NoticeModal>
  </ScreenScroll>;
}
