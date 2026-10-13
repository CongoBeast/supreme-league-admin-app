import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { BarChart3, RefreshCw, TrendingUp, UsersRound, BadgeDollarSign, MousePointerClick, UserPlus } from 'lucide-react-native';
import { adminApi, buildQuery, count, defaultDateRange, money } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import { Banner, Button, Card, C, Detail, Field, FilterRow, LoadState, SelectField, StatCard, Stats, Txt, Empty } from './UI';

function chartPath(data, key, w, h, pad, max) {
  return (data || []).map((d, i) => {
    const x = pad + ((w - 2 * pad) * (data.length === 1 ? .5 : i / (data.length - 1)));
    const y = h - pad - Math.max(0, Number(d[key] || 0) / max) * (h - 2 * pad);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
function Graph({ series = [], keys = [], colors = [], title, subtitle }) {
  const w = 330, h = 172, pad = 20;
  const max = Math.max(1, ...series.flatMap((s) => keys.map((k) => Number(s[k] || 0))));
  return <Card title={title} subtitle={subtitle}>
    {series.length ? <>
      <Svg width="100%" viewBox={`0 0 ${w} ${h}`} height={190} accessible accessibilityLabel={title}>
        {[0, .25, .5, .75, 1].map((v) => <Line key={v} x1={pad} x2={w - pad} y1={h - pad - v * (h - pad * 2)} y2={h - pad - v * (h - pad * 2)} stroke="#e5eaf1" strokeWidth={1}/>)}
        {keys.map((key, i) => <Path key={key} d={chartPath(series, key, w, h, pad, max)} stroke={colors[i]} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round"/>)}
        {series.length && <><SvgText x={pad} y={h-3} fontSize="9" fill={C.muted}>{String(series[0]?.label || '')}</SvgText><SvgText x={w-pad} y={h-3} fontSize="9" fill={C.muted} textAnchor="end">{String(series[series.length-1]?.label || '')}</SvgText></>}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>{keys.map((k, i) => <View key={k} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors[i] }}/><Txt muted style={{ fontSize: 11 }}>{k === 'userSignups' ? 'Sign-ups' : k === 'cashInCents' ? 'Cash inflow' : 'Platform revenue'}</Txt></View>)}</View>
    </> : <Empty title="No analytics data" message="This period has no chart results."/>}
  </Card>;
}
export function MetaAds({ refreshToken }) {
  const { data, loading, error, refresh } = useApiData(() => adminApi('/marketing/meta?days=30'), [refreshToken]);
  const t = data?.totals || {};
  return <Card title="Acquisition performance" subtitle="Meta Ads · latest 30 days · attributed platform conversions">
    {error ? <Banner tone="warning" text={error}/> : null}
    {loading && !data ? <Txt muted>Loading Meta Ads metrics…</Txt> : data?.configured === false ? <Banner tone="info" text={data?.message || 'Meta Ads reporting has not been configured on the backend.'}/> : data ? <>
      <Stats>
        <StatCard label="Ad spend" value={money(t.spendCents, data.currency || 'USD')} detail={`${count(t.impressions)} impressions · ${Number(t.ctr || 0).toFixed(2)}% CTR`} Icon={BadgeDollarSign} tone="warning"/>
        <StatCard label="Platform sign-ups" value={count(t.signups)} detail={`${money(t.costPerSignupCents, data.currency)} / signup`} Icon={UserPlus}/>
        <StatCard label="Paid customers" value={count(t.paidCustomers)} detail={`${money(t.costPerPaidCustomerCents, data.currency)} acquisition cost`} Icon={UsersRound} tone="success"/>
        <StatCard label="Ad clicks" value={count(t.clicks)} detail={`${Number(t.signupRateFromClicksPct || 0).toFixed(2)}% click → signup`} Icon={MousePointerClick}/>
        <StatCard label="Attributed revenue" value={money(t.attributedRevenueCents, data.currency)} detail={`${Number(t.roas || 0).toFixed(2)}× platform ROAS`} Icon={TrendingUp} tone="success"/>
        <StatCard label="Meta registrations" value={count(t.metaRegistrations)} detail="Meta-reported registrations" Icon={BarChart3}/>
      </Stats>
      {data.campaigns?.length ? <Card title="Campaign attribution" noPadding>{data.campaigns.map((c, i) => <View key={`${c.campaignId || c.id || c.name || i}`} style={{ paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border }}><Txt strong>{c.campaignName || c.name || c.campaignId || 'Campaign'}</Txt><Detail label="Spend" value={money(c.spendCents, data.currency)}/><Detail label="Sign-ups" value={count(c.signups)}/><Detail label="Attributed revenue" value={money(c.attributedRevenueCents, data.currency)} last/></View>)}</Card> : null}
      {data.attributionNote ? <Txt muted>{data.attributionNote}</Txt> : null}
    </> : null}
    <View style={{ alignSelf: 'flex-start', marginTop: 10 }}><Button small variant="outline" label="Refresh Meta Ads" onPress={refresh} Icon={RefreshCw}/></View>
  </Card>;
}
export function Analytics({ refreshToken }) {
  const [range, setRange] = useState(defaultDateRange);
  const [groupBy, setGroupBy] = useState('month');
  const { data, loading, error, refresh } = useApiData(() => adminApi(`/dashboard/analytics?${buildQuery({ ...range, groupBy })}`), [range.from, range.to, groupBy, refreshToken]);
  const t = data?.totals || {};
  const series = data?.series || [];
  return <Card title="Sign-ups, cash inflows & revenue" subtitle="Business analytics · the last 30 months by default">
    <FilterRow><Field label="From · YYYY-MM-DD" value={range.from} onChangeText={(v) => setRange((s) => ({ ...s, from: v }))} placeholder="YYYY-MM-DD"/><Field label="To · YYYY-MM-DD" value={range.to} onChangeText={(v) => setRange((s) => ({ ...s, to: v }))}/><SelectField label="Group by" value={groupBy} onChange={setGroupBy} options={['day','week','month']}/></FilterRow>
    {error ? <Banner text={error}/> : null}
    {loading && !data ? <Txt muted>Loading analytics…</Txt> : data ? <>
      <Stats><StatCard label="Sign-ups · period" value={count(t.userSignups)} Icon={UsersRound}/><StatCard label="Cash inflow · period" value={money(t.cashInCents)} detail={`${count(t.cashInCount)} transactions`} tone="success"/><StatCard label="Revenue · period" value={money(t.revenueCents)} tone="warning"/><StatCard label="All-time cash inflow" value={money(t.lifetimeCashInCents)} detail={`${count(t.lifetimeCashInCount)} transactions`} tone="info"/></Stats>
      <Graph series={series} keys={['userSignups']} colors={[C.sidebar]} title="User sign-ups" subtitle="Registered customer accounts in the selected period."/>
      <Graph series={series} keys={series.some((r) => r.revenueCents !== undefined) ? ['cashInCents','revenueCents'] : ['cashInCents']} colors={[C.accent, C.success]} title="Cash inflow & platform revenue" subtitle="External cash receipts; platform revenue is shown as a separate total if the server does not supply a revenue timeseries."/>
    </> : null}
    <View style={{ alignSelf: 'flex-start' }}><Button small label="Refresh analytics" Icon={RefreshCw} onPress={refresh} variant="outline"/></View>
  </Card>;
}
