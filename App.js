import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, Trophy, UsersRound, MessageCircle, Megaphone, WalletCards, LifeBuoy, LogOut, ShieldCheck, Menu, ChevronLeft, X } from 'lucide-react-native';
import { C, Txt, confirm } from './src/components/UI';
import { adminApi, logoutApi, setSessionExpiredHandler } from './src/services/api';
import Auth from './src/screens/Auth';
import Dashboard from './src/screens/Dashboard';
import Leagues from './src/screens/Leagues';
import LeagueDetail from './src/screens/LeagueDetail';
import Users from './src/screens/Users';
import UserDetail from './src/screens/UserDetail';
import Outreach from './src/screens/Outreach';
import Marketing from './src/screens/Marketing';
import Finances from './src/screens/Finances';
import Tickets from './src/screens/Tickets';
import TicketDetail from './src/screens/TicketDetail';

const NAV = [
  { name: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { name: 'leagues', label: 'Leagues', Icon: Trophy },
  { name: 'users', label: 'Users', Icon: UsersRound },
  { name: 'outreach', label: 'WhatsApp outreach', Icon: MessageCircle },
  { name: 'marketing', label: 'Marketing', Icon: Megaphone },
  { name: 'finances', label: 'Finances', Icon: WalletCards },
  { name: 'tickets', label: 'Support tickets', Icon: LifeBuoy },
];
const sectionName = (name) => ({ leagueDetail: 'leagues', userDetail: 'users', ticketDetail: 'tickets' })[name] || name;
function Root() {
  const [admin, setAdmin] = useState(undefined);
  const [routeStack, setRouteStack] = useState([{ name: 'dashboard' }]);
  const [drawer, setDrawer] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 940;
  useEffect(() => {
    let active = true;
    setSessionExpiredHandler(() => { if (active) { setAdmin(null); setRouteStack([{ name: 'dashboard' }]); } });
    adminApi('/session').then((result) => { if (active) setAdmin(result.admin || null); }).catch(() => { if (active) setAdmin(null); });
    return () => { active = false; setSessionExpiredHandler(null); };
  }, []);
  const route = routeStack[routeStack.length - 1];
  const navigate = (name, id) => { setRouteStack((s) => [...s, { name, id }]); setDrawer(false); };
  const switchSection = (name) => { setRouteStack([{ name }]); setDrawer(false); };
  const back = () => setRouteStack((s) => s.length > 1 ? s.slice(0, -1) : s);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawer) { setDrawer(false); return true; }
      if (routeStack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [drawer, routeStack.length]);
  const logout = () => confirm('Sign out?', 'End this administrator session on this device?', async () => {
    try { await logoutApi(); }
    catch { Alert.alert('Could not sign out', 'The server could not revoke this session. Check your connection and try again.'); return; }
    setAdmin(null); setRouteStack([{ name: 'dashboard' }]); setDrawer(false);
  });
  const initials = String(admin?.fullName || admin?.email || 'A').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  const renderNav = () => <View style={{ flex: 1, backgroundColor: C.sidebar, paddingTop: 25, paddingHorizontal: 17, paddingBottom: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 31, paddingHorizontal: 6 }}>
      <View style={{ width: 45, height: 45, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><ShieldCheck color="#fff" size={23}/></View>
      <View><Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Supreme Admin</Text><Text style={{ color: '#98a2b3', fontSize: 12, marginTop: 3 }}>Operations portal</Text></View>
    </View>
    <Text style={{ color: '#667085', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, paddingHorizontal: 12, marginBottom: 11 }}>MANAGEMENT</Text>
    <ScrollView>{NAV.map(({ name, label, Icon }) => {
      const active = sectionName(route?.name) === name;
      return <TouchableOpacity key={name} onPress={() => switchSection(name)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, borderRadius: 12, backgroundColor: active ? C.accent : 'transparent', marginBottom: 6 }}>
        <Icon size={19} color={active ? '#fff' : '#cbd5e1'}/><Text style={{ color: active ? '#fff' : '#cbd5e1', fontSize: 14, fontWeight: '700' }}>{label}</Text>
      </TouchableOpacity>;
    })}</ScrollView>
    <View style={{ borderTopWidth: 1, borderColor: '#354052', paddingTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.sidebarSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800' }}>{initials}</Text></View>
        <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{admin?.fullName || 'Administrator'}</Text><Text style={{ color: '#98a2b3', fontSize: 11 }} numberOfLines={1}>{admin?.email}</Text></View>
      </View>
      <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11 }}><LogOut size={19} color="#d0d5dd"/><Text style={{ color: '#d0d5dd', fontWeight: '700' }}>Sign out</Text></TouchableOpacity>
    </View>
  </View>;
  let Screen = useMemo(() => ({ dashboard: Dashboard, leagues: Leagues, leagueDetail: LeagueDetail, users: Users, userDetail: UserDetail, outreach: Outreach, marketing: Marketing, finances: Finances, tickets: Tickets, ticketDetail: TicketDetail })[route?.name] || Dashboard, [route?.name]);
  if (admin === undefined) return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.accent}/><Txt style={{ marginTop: 18 }}>Verifying administrator session…</Txt></SafeAreaView>;
  if (!admin) return <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}><Auth onAuthenticated={(user) => { setAdmin(user); setRouteStack([{ name: 'dashboard' }]); }}/></SafeAreaView>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {wide && <View style={{ width: 272 }}>{renderNav()}</View>}
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: C.surface, borderBottomColor: C.border, borderBottomWidth: 1, paddingHorizontal: 18, minHeight: 63, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!wide && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open administrator navigation" onPress={() => setDrawer(true)} style={{ padding: 9, borderRadius: 12, borderWidth: 1, borderColor: C.border }}><Menu size={21} color={C.text}/></TouchableOpacity>}
          {routeStack.length > 1 && <TouchableOpacity onPress={back} style={{ padding: 6 }}><ChevronLeft color={C.text} size={22}/></TouchableOpacity>}
          <View style={{ flex: 1 }}><Text style={{ fontWeight: '800', color: C.text, fontSize: 14 }}>{NAV.find((n) => n.name === sectionName(route?.name))?.label || 'Administration'}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Supreme Fantasy League</Text></View>
          {!wide && <View style={{ height: 36, width: 36, borderRadius: 18, backgroundColor: '#eaf0ff', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.text, fontWeight: '800' }}>{initials}</Text></View>}
        </View>
        <View style={{ flex: 1 }}><Screen key={`${route?.name}-${route?.id || ''}`} id={route?.id} navigate={navigate} back={back} admin={admin}/></View>
      </View>
    </View>
    {!wide && drawer && <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', zIndex: 10 }}>
      <View style={{ width: Math.min(300, width * .86) }}>{renderNav()}</View>
      <Pressable onPress={() => setDrawer(false)} style={{ flex: 1, backgroundColor: 'rgba(16,24,40,.64)', alignItems: 'flex-end', padding: 18 }}><X size={24} color="#fff"/></Pressable>
    </View>}
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><StatusBar style="dark" backgroundColor="#f4f6fa"/><Root/></SafeAreaProvider>; }
