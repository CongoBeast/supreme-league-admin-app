import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, Modal, Pressable, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, Check, X, ArrowLeft } from 'lucide-react-native';
import { humanize } from '../services/api';

/** Colours faithfully ported from src/admin/admin.css in the supplied web project. */
export const C = {
  bg: '#f4f6fa', surface: '#ffffff', border: '#e6eaf0', text: '#172033', muted: '#667085',
  sidebar: '#101828', sidebarSoft: '#1d2939', accent: '#0d6efd', accentPale: '#eaf2ff',
  success: '#198754', successPale: '#eaf8f0', warning: '#b7791f', warningPale: '#fff7df',
  danger: '#dc3545', dangerPale: '#fff0f2', info: '#087990', infoPale: '#e8f8fb',
};
export const S = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.9, color: C.text, lineHeight: 34 },
  body: { color: C.text, fontSize: 14, lineHeight: 22 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
  label: { color: '#475467', fontSize: 11, fontWeight: '800', letterSpacing: 0.3, marginBottom: 6, textTransform: 'uppercase' },
  card: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden', elevation: 1 },
  cardHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  cardBody: { padding: 18 },
  heading: { color: C.text, fontWeight: '700', fontSize: 16, lineHeight: 24 },
  fieldInput: { backgroundColor: C.surface, minHeight: 46, paddingHorizontal: 13, paddingVertical: 10, color: C.text, borderWidth: 1, borderColor: '#dfe4eb', borderRadius: 11, fontSize: 14 },
  separator: { height: 1, backgroundColor: '#eef1f5', marginVertical: 9 },
});
export function Txt({ children, style, muted = false, strong = false, size, ...props }) {
  return <Text {...props} style={[muted ? S.muted : S.body, strong && { fontWeight: '700' }, size && { fontSize: size }, style]}>{children}</Text>;
}
export function PageHeader({ title, description, eyebrow, back, actions }) {
  return <View style={{ marginBottom: 23 }}>
    {back ? <Pressable accessibilityRole="button" onPress={back} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}><ArrowLeft size={16} color={C.muted}/><Txt muted style={{ fontWeight: '700' }}>Back</Txt></Pressable> : null}
    {eyebrow ? <Txt style={{ fontSize: 11, color: C.accent, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6 }}>{eyebrow}</Txt> : null}
    <Text style={S.title}>{title}</Text>
    {description ? <Txt muted style={{ marginTop: 8, lineHeight: 22 }}>{description}</Txt> : null}
    {actions ? <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>{actions}</View> : null}
  </View>;
}
export function Card({ title, subtitle, children, footer, style, warning = false, noPadding = false, action }) {
  return <View style={[S.card, warning && { borderColor: '#ffc86b' }, style]}>
    {(title || subtitle || action) ? <View style={S.cardHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
        <View style={{ flex: 1 }}>{title ? <Text style={S.heading}>{title}</Text> : null}{subtitle ? <Txt muted style={{ marginTop: 3 }}>{subtitle}</Txt> : null}</View>
        {action}
      </View>
    </View> : null}
    <View style={!noPadding ? S.cardBody : undefined}>{children}</View>
    {footer}
  </View>;
}
const TONES = { primary: [C.accent, C.accentPale], success: [C.success, C.successPale], warning: [C.warning, C.warningPale], danger: [C.danger, C.dangerPale], info: [C.info, C.infoPale] };
export function StatCard({ label, value, detail, tone = 'primary', Icon }) {
  const [color, bg] = TONES[tone] || TONES.primary;
  return <View style={[S.card, { flex: 1, minWidth: 145, marginBottom: 0, padding: 17, minHeight: 144, justifyContent: 'space-between' }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
      <Text style={[S.label, { flex: 1, color: C.muted, lineHeight: 16 }]}>{label}</Text>
      {Icon ? <View style={{ width: 39, height: 39, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color}/></View> : null}
    </View>
    <Text selectable style={{ color: C.text, fontWeight: '800', fontSize: 24, letterSpacing: -0.6, marginTop: 8 }} numberOfLines={3}>{value ?? '—'}</Text>
    {detail ? <Txt muted style={{ fontSize: 11, marginTop: 6 }}>{detail}</Txt> : null}
  </View>;
}
export function Stats({ children }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>{children}</View>;
}
export function Button({ label, onPress, Icon, tone = 'primary', variant = 'solid', disabled = false, small = false, block = false, style }) {
  const solid = variant === 'solid';
  const color = tone === 'danger' ? C.danger : tone === 'success' ? C.success : tone === 'dark' ? C.sidebar : tone === 'warning' ? C.warning : C.accent;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} activeOpacity={0.78} disabled={disabled} onPress={onPress}
    style={[{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 11, gap: 8,
      paddingHorizontal: small ? 12 : 16, paddingVertical: small ? 9 : 12, minHeight: small ? 36 : 44,
      borderWidth: 1, borderColor: solid ? color : tone === 'dark' ? C.border : color, backgroundColor: solid ? color : 'transparent', opacity: disabled ? 0.48 : 1 },
      block && { alignSelf: 'stretch' }, style]}>
    {Icon ? <Icon size={16} color={solid ? '#fff' : color} /> : null}
    <Text style={{ fontSize: small ? 12 : 13, fontWeight: '700', textAlign: 'center', color: solid ? '#fff' : color }}>{label}</Text>
  </TouchableOpacity>;
}
export function Field({ label, value, onChangeText, placeholder, secret, multiline, keyboardType, autoCapitalize, maxLength, autoComplete, helper, editable = true }) {
  return <View style={{ marginBottom: 14, flex: 1, minWidth: 160 }}>
    {label ? <Text style={S.label}>{label}</Text> : null}
    <TextInput style={[S.fieldInput, multiline && { minHeight: 90, textAlignVertical: 'top' }, !editable && { backgroundColor: '#f7f8fc' }]}
      value={String(value ?? '')} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#98a2b3"
      secureTextEntry={!!secret} multiline={!!multiline} keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize || 'none'} autoComplete={autoComplete} maxLength={maxLength} editable={editable} />
    {helper ? <Txt muted style={{ fontSize: 11, marginTop: 6 }}>{helper}</Txt> : null}
  </View>;
}
export function SelectField({ label, value, onChange, options = [], disabled = false, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const normalized = options.map((option) => typeof option === 'string' ? ({ value: option, label: humanize(option) }) : option);
  const selected = normalized.find((option) => String(option.value) === String(value));
  return <View style={{ marginBottom: 14, flex: 1, minWidth: 143 }}>
    {label ? <Text style={S.label}>{label}</Text> : null}
    <TouchableOpacity accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setOpen(true); }} disabled={disabled}
      style={[S.fieldInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: disabled ? .6 : 1 }]}>
      <Text style={{ flex: 1, fontSize: 14, color: selected ? C.text : C.muted }} numberOfLines={2}>{selected?.label || placeholder}</Text><ChevronDown color={C.muted} size={17}/>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable onPress={() => setOpen(false)} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,24,40,.58)' }}>
        <Pressable onPress={() => {}} style={{ borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: C.surface, maxHeight: '74%', paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.border }}><Txt strong style={{ flex: 1 }}>{label || 'Choose option'}</Txt><Pressable onPress={() => setOpen(false)}><X size={22} color={C.muted}/></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled">{normalized.map((option, index) => <TouchableOpacity key={`${String(option.value)}-${index}`} onPress={() => { setOpen(false); onChange?.(option.value); }}
            style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f2f6', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt style={{ flex: 1 }}>{option.label}</Txt>{String(value) === String(option.value) ? <Check size={18} color={C.accent}/> : null}
            </TouchableOpacity>)}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}
export const options = (items, firstLabel = 'All') => [{ value: '', label: firstLabel }, ...items.map((item) => ({ value: item, label: humanize(item) }))];
export function FilterRow({ children }) { return <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}>{children}</View>; }
export function Badge({ value, customLabel }) {
  const v = String(value || '').toLowerCase();
  const colorPair = (['active','open','live','completed','eligible','yes','contacted','resolved','sent','linked'].includes(v)) ? TONES.success
    : ['pending','upcoming','in-progress','processing','waiting-user','high','urgent','draft','full'].includes(v) ? TONES.warning
    : ['failed','suspended','closed','cancelled','rejected','ineligible','no'].includes(v) ? TONES.danger : TONES.primary;
  return <View style={{ backgroundColor: colorPair[1], paddingHorizontal: 10, paddingVertical: 5, borderRadius: 22, alignSelf: 'flex-start' }}><Text style={{ color: colorPair[0], fontWeight: '700', fontSize: 11 }}>{customLabel || humanize(value)}</Text></View>;
}
export function Banner({ text, tone = 'error' }) {
  if (!text) return null;
  const pair = tone === 'success' ? TONES.success : tone === 'warning' ? TONES.warning : tone === 'info' ? TONES.info : TONES.danger;
  return <View style={{ padding: 14, borderRadius: 12, backgroundColor: pair[1], marginBottom: 14, borderWidth: 1, borderColor: pair[0] + '30' }}><Txt style={{ color: pair[0], fontSize: 13 }}>{text}</Txt></View>;
}
export function Loading({ message = 'Loading…', compact = false }) {
  return <View style={[S.card, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: compact ? 50 : 170, justifyContent: 'center' }]}>
    <ActivityIndicator color={C.accent} size="large"/><Txt strong>{message}</Txt>
  </View>;
}
export function Empty({ title = 'Nothing to show', message }) {
  return <View style={{ padding: 23, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d3dbe7' }}>
    <Txt strong style={{ textAlign: 'center' }}>{title}</Txt>{message ? <Txt muted style={{ textAlign: 'center', marginTop: 5 }}>{message}</Txt> : null}
  </View>;
}
export function LoadState({ data, loading, error, onRetry, children }) {
  if (loading && !data) return <Loading/>;
  if (error && !data) return <><Banner text={error}/><Button label="Try again" variant="outline" onPress={onRetry}/></>;
  return <>{error ? <Banner text={error}/> : null}{children}</>;
}
export function Detail({ label, value, last = false }) {
  return <View style={{ paddingVertical: 10, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderColor: C.border, gap: 3 }}>
    <Text style={S.label}>{label}</Text><Txt style={{ fontWeight: '600' }} selectable>{value === null || value === undefined || value === '' ? '—' : String(value)}</Txt>
  </View>;
}
export function ListRow({ title, subtitle, third, badge, onPress, right, children }) {
  const Body = <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#eef1f5', gap: 5 }}>
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><View style={{ flex: 1 }}><Txt strong>{title || '—'}</Txt>{subtitle ? <Txt muted style={{ marginTop: 4, fontSize: 12 }}>{subtitle}</Txt> : null}</View>{right}{onPress ? <ChevronRight color={C.muted} size={18}/> : null}</View>
    {third ? <Txt muted style={{ fontSize: 12 }}>{third}</Txt> : null}
    {badge ? <View style={{ marginTop: 5 }}><Badge value={badge}/></View> : null}
    {children}
  </View>;
  return onPress ? <TouchableOpacity activeOpacity={.72} onPress={onPress}>{Body}</TouchableOpacity> : Body;
}
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || Number(pagination.pages || 1) <= 1) return null;
  const page = Number(pagination.page || 1), pages = Number(pagination.pages || 1);
  return <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: C.border }}>
    <Button small variant="outline" tone="dark" label="Previous" Icon={ChevronLeft} onPress={() => onPageChange(page - 1)} disabled={page <= 1}/>
    <Txt muted style={{ fontSize: 12 }}>Page {page} of {pages} · {pagination.total || 0} total</Txt>
    <Button small variant="outline" tone="dark" label="Next" onPress={() => onPageChange(page + 1)} disabled={page >= pages}/>
  </View>;
}
export function ProgressBar({ label, value, count }) {
  return <View style={{ marginBottom: 16 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Txt strong>{label}</Txt><Txt muted>{count} · {value}%</Txt></View>
    <View style={{ height: 8, borderRadius: 8, backgroundColor: '#e9edf4', overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: 8, borderRadius: 8, backgroundColor: C.accent }}/></View>
  </View>;
}
export function NoticeModal({ visible, onClose, title, children }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: 'rgba(16,24,40,.7)', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 34 }}>
      <View style={{ backgroundColor: C.bg, borderRadius: 18, flexShrink: 1, maxHeight: '96%', overflow: 'hidden' }}>
        <View style={{ backgroundColor: C.surface, padding: 17, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: C.border }}><Txt strong style={{ flex: 1, fontSize: 17 }}>{title}</Txt><Pressable accessibilityRole="button" onPress={onClose}><X size={23} color={C.muted}/></Pressable></View>
        <ScrollView style={{ padding: 17 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}
export const confirm = (title, message, onYes, destructive = false) => Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', style: destructive ? 'destructive' : 'default', onPress: onYes }]);
export function SectionSpacer() { return <View style={{ height: 4 }}/>; }
export function ScreenScroll({ children, refreshing, onRefresh }) {
  const { width } = useWindowDimensions();
  const parentStyle = { flex: 1, backgroundColor: C.bg };
  return <ScrollView style={parentStyle} contentContainerStyle={{ paddingHorizontal: width < 550 ? 14 : 26, paddingTop: 24, paddingBottom: 50, flexGrow: 1 }}
    refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]}/> : undefined} keyboardShouldPersistTaps="handled">
    <View style={{ width: '100%', maxWidth: 1240, alignSelf: 'center' }}>{children}</View>
  </ScrollView>;
}
