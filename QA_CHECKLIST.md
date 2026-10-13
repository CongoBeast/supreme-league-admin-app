# Mobile admin acceptance checklist

Use a **staging backend** with test accounts, test withdrawals and test marketing recipients for the first pass. Some backend endpoints move real money or send real emails; they are not simulated by the app.

- [ ] Environment URL points to an HTTPS API and `npm run smoke` returns HTTP 401/403 before login.
- [ ] Administrator sign-in reaches the dashboard and remains signed in across app restarts on a built APK.
- [ ] Non-admin account cannot open admin screens. Expired backend session returns to sign-in.
- [ ] Sign-out revokes cookie. If network unavailable, session-revocation error is shown.
- [ ] Phone hamburger menu and tablet persistent sidebar show only seven admin sections.
- [ ] Dashboard shows user, league, subscription, cash KPIs, cash periods, and recent transactions.
- [ ] Dashboard Meta Ads shows metrics when configured, or a correct error/disabled state.
- [ ] Analytics date filters, grouping and graph load from backend.
- [ ] Leagues search/status/type filters and pagination work.
- [ ] League detail shows members and FPL diagnostics; status changes, add/remove actions refresh.
- [ ] With test data: retry FPL scores, automatic settlement and manual override each honor backend safeguards. Do **not** settle a real league as a first test.
- [ ] Users search/status filters, missing-wallet notices and navigation to user detail work.
- [ ] User detail FPL team loads; profile, subscriptions, transactions and league links populate correctly.
- [ ] With staging wallet: credit, debit, performance bonus, subscription cancellation/refund and end-subscription actions honor confirmation and audit reasons.
- [ ] WhatsApp outreach lists users, filters contact flags, toggles contacted status and opens WhatsApp.
- [ ] With test recipients: marketing draft/activate/pause/send batch and admin test-email work.
- [ ] Financial date/status/purpose filters and transaction detail load; withdrawal destination fields are accurate.
- [ ] With staging withdrawal: processing, paid, rejected and cancelled actions update backend and balances as expected.
- [ ] Tickets search/filter/detail, customer response, status and priority updates work.
- [ ] Test at narrow phone widths, larger Android phones, tablets, screen rotation and both platforms (if applicable).
- [ ] Inspect backend audit logs, email and transaction records after each *write* operation.
- [ ] Build a standalone `.apk` using `npm run build:android` and install it on a physical Android phone.

*Static source verification is included (`npm run check`), but this acceptance checklist cannot be completed without backend access, signing/build infrastructure and device tests.*
