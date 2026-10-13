/** Optional backend reachability smoke test: npm run smoke */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.readFileSync(path.join(root, 'src/config/env.js'), 'utf8');
const match = env.match(/API_BASE_URL:\s*['"]([^'"]+)['"]/);
const base = match?.[1]?.replace(/\/+$/, '');
if (!base || !/^https?:\/\//.test(base) || base.includes('YOUR-BACKEND-DOMAIN')) {
  console.error('Set a real API_BASE_URL in src/config/env.js first.'); process.exit(1);
}
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 10000);
try {
  const response = await fetch(`${base}/api/admin/session`, { headers: { Accept: 'application/json' }, signal: controller.signal });
  const json = await response.json();
  console.log('Backend:', base);
  console.log('Admin session endpoint HTTP status:', response.status);
  if (![200, 401, 403].includes(response.status) || typeof json.success !== 'boolean') {
    throw new Error('Expected /api/admin/session and the {success,data} backend JSON contract.');
  }
  console.log('PASS: Admin API reached. 401/403 without an admin cookie is expected.');
} catch (error) { console.error('Backend smoke test failed:', error.message); process.exitCode = 1; }
finally { clearTimeout(timer); }
