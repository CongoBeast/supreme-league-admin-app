import React, { useState } from 'react';
import { View } from 'react-native';
import { CircleDollarSign, LifeBuoy, RefreshCw, Trophy, UserPlus, UsersRound } from 'lucide-react-native';
import { adminApi, dateTime, humanize, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Analytics, MetaAds } from '../components/Analytics';
import { Banner, Button, Card, C, Detail, Empty, ListRow, LoadState, PageHeader, ProgressBar, ScreenScroll, StatCard, Stats, Txt } from '../components/UI';
export default function Dashboard({ navigate }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, loading, error, refreshing, refresh } = useApiData(() => adminApi('/dashboard'), []);
  const { data: health } = useApiData(() => adminApi('/notifications/health'), [refreshToken]);
  const forceRefresh = () => { refresh(); setRefreshToken((v) => v + 1); };
  const cash = data?.cashAccounting || {};
  return <ScreenScroll refreshing={refreshing} onRefresh={forceRefresh}>
    <PageHeader title="Administration dashboard" description="A live operational view of users, leagues, cash inflows, revenue, payouts and support workload." actions={<Button label="Refresh database" variant="outline" tone="dark" Icon={RefreshCw} onPress={forceRefresh}/>}/>
    <LoadState data={data} loading={loading} error={error} onRetry={forceRefresh}>
      {health && (!health.enabled || !health.senderConfigured || !health.adminInboxConfigured) ? <Banner tone="warning" text="Operations email alerts need configuration. Check backend EMAILS_ENABLED, RESENDER_API_KEY, SENDING_EMAIL and ADMIN_NOTIFICATION_EMAIL."/> : null}
      {health?.failedCount > 0 ? <Banner tone="warning" text={`The email-delivery log contains ${health.failedCount} failed message(s). Review the provider and notification records.`}/> : null}
      {data ? <>
        <Stats>
          <StatCard label="Total users" value={data.users} detail={`${data.newUsers} new this month`} Icon={UsersRound}/>
          <StatCard label="Active subscriptions" value={data.activeSubscriptions} detail={`${data.usersInLeagues} users in leagues`} tone="success" Icon={UserPlus}/>
          <StatCard label="Active leagues" value={data.leagues?.active} detail={`${data.leagues?.total} leagues in total`} tone="warning" Icon={Trophy}/>
          <StatCard label="Cash received — since launch" value={money(cash.lifetime?.collectedCents)} detail="Completed live Paynow receipts" tone="success" Icon={CircleDollarSign}/>
        </Stats>
        <Card title="Cash collected versus paid out" subtitle="Recorded Paynow collections and completed withdrawals (USD) · UTC calendar months">
          {[['Since launch',cash.lifetime],['This month',cash.thisMonth],['Last month',cash.lastMonth]].map(([label, v]) => <View key={label} style={{ borderWidth: 1, borderColor: C.border, padding: 13, borderRadius: 14, marginBottom: 10 }}>
            <Txt strong style={{ marginBottom: 9 }}>{label}</Txt><Detail label="Collected" value={money(v?.collectedCents)}/><Detail label="Paid out" value={money(v?.paidOutCents)}/><Detail label="Net cash movement" value={money(v?.netCashMovementCents)} last/><Txt muted style={{ fontSize: 11 }}>{v?.collectionsCount || 0} receipts · {v?.withdrawalsCount || 0} completed withdrawals</Txt>
          </View>)}
          <Txt muted style={{ fontSize: 11, marginTop: 6 }}>These are ledger figures, not verified bank balances. Reconcile with provider statements; wallet prize credits are not cash withdrawals.</Txt>
        </Card>
        {data.missingWalletCount > 0 ? <Banner tone="warning" text={`${data.missingWalletCount} user(s) have missing wallet records. Investigate before making adjustments.`}/> : null}
        <Card title="Recent financial transactions" subtitle="Latest 15, including pending and failed transactions" action={<Button small label="All finances" onPress={() => navigate('finances')} variant="outline"/>} noPadding>
          {data.recentTransactions?.length ? data.recentTransactions.map((t) => <ListRow key={t._id} title={`${t.direction === 'debit' ? '−' : '+'}${money(t.amountCents)} · ${humanize(t.type)}`} subtitle={`${t.userId?.fullName || t.userId?.email || 'Unknown'} · ${dateTime(t.createdAt)}`} third={`${t.reference || ''} · ${humanize(t.provider)}`} badge={t.status}/>) : <View style={{ padding: 18 }}><Empty title="No transactions recorded yet"/></View>}
        </Card>
        <Card title="League portfolio" subtitle="Competition type distribution">
          {(data.leagues?.byType || []).map((item) => <ProgressBar key={item._id} label={humanize(item._id)} count={item.count} value={data.leagues?.total ? Math.round(item.count * 100 / data.leagues.total) : 0}/>)}
        </Card>
        <Card title="Operations snapshot" subtitle="Items that need administrator attention">
          <ListRow title="League participants" subtitle="Distinct users with league entries" right={<Txt strong>{data.usersInLeagues}</Txt>} onPress={() => navigate('users')}/>
          <ListRow title="Open support tickets" subtitle="Unresolved customer requests" right={<Txt strong>{data.openTickets}</Txt>} onPress={() => navigate('tickets')}/>
          <ListRow title="Payouts due" subtitle="Pending prizes and withdrawals" right={<Txt strong>{money(data.finances?.payoutsDueCents)}</Txt>} onPress={() => navigate('finances')}/>
          <ListRow title="Revenue · 30 months" subtitle="Subscriptions, league fees and platform fees" right={<Txt strong>{money(data.finances?.revenueCents)}</Txt>} onPress={() => navigate('finances')}/>
        </Card>
        <MetaAds refreshToken={refreshToken}/>
        <Analytics refreshToken={refreshToken}/>
      </> : null}
    </LoadState>
  </ScreenScroll>;
}
