/** Offline project-source verification. Run after `npm install`: npm run check */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import babelParser from '@babel/parser';
const { parse } = babelParser;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inspect = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');
const exists = (filename) => fs.existsSync(path.join(root, filename));
const required = [
  'App.js', 'index.js', 'src/config/env.js', 'src/services/api.js', 'src/components/UI.js',
  'src/components/Analytics.js', 'src/hooks/useApiData.js',
  'src/screens/Auth.js', 'src/screens/Dashboard.js', 'src/screens/Leagues.js',
  'src/screens/LeagueDetail.js', 'src/screens/Users.js', 'src/screens/UserDetail.js',
  'src/screens/Outreach.js', 'src/screens/Marketing.js', 'src/screens/Finances.js',
  'src/screens/Tickets.js', 'src/screens/TicketDetail.js',
  'assets/icon.png', 'assets/adaptive-icon.png', 'eas.json', 'app.json',
];
const problems = [];
required.forEach((f) => { if (!exists(f)) problems.push(`Missing required file: ${f}`); });
const pkg = JSON.parse(inspect('package.json'));
const app = JSON.parse(inspect('app.json'));
const eas = JSON.parse(inspect('eas.json'));
if (pkg.main !== 'index.js') problems.push('package.json entry must be index.js');
if (!pkg.dependencies?.expo?.startsWith('~57')) problems.push('Expected Expo SDK 57');
if (eas.build?.preview?.android?.buildType !== 'apk') problems.push('EAS preview must produce an installable APK');
if (!app.expo?.ios?.bundleIdentifier || !app.expo?.android?.package) problems.push('Missing iOS/Android app identifiers');
if (!inspect('src/services/api.js').includes("credentials: 'include'")) problems.push('All admin requests must include credentials for session cookies');
const env = inspect('src/config/env.js');
if (!env.includes('API_BASE_URL')) problems.push('Missing central API_BASE_URL');
if (env.includes('YOUR-BACKEND-DOMAIN')) console.warn('WARNING: Replace API_BASE_URL placeholder in src/config/env.js before running.');

const jsFiles = [];
const traverse = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) traverse(rel);
    else if (rel.endsWith('.js') || rel.endsWith('.mjs')) jsFiles.push(rel);
  }
};
traverse('src');
jsFiles.push('App.js', 'index.js', 'babel.config.js');
let importsChecked = 0;
for (const filename of jsFiles) {
  const content = inspect(filename);
  let ast;
  try { ast = parse(content, { sourceType: 'unambiguous', plugins: ['jsx'] }); }
  catch (e) { problems.push(`JS syntax: ${filename}: ${e.message}`); continue; }
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const target = node.source.value;
    if (!target.startsWith('.')) continue;
    const targetFile = path.resolve(root, path.dirname(filename), target);
    importsChecked++;
    if (![targetFile, `${targetFile}.js`, `${targetFile}.mjs`, path.join(targetFile, 'index.js')].some(fs.existsSync)) {
      problems.push(`Broken import: ${filename} -> ${target}`);
    }
  }
}
const screens = ['Dashboard','Leagues','LeagueDetail','Users','UserDetail','Outreach','Marketing','Finances','Tickets','TicketDetail'];
const appSource = inspect('App.js');
for (const name of screens) if (!appSource.includes(`from './src/screens/${name}'`)) problems.push(`Missing navigation to ${name}`);
const api = inspect('src/services/api.js');
for (const keyword of ['/api/admin', '/api/auth/logout', '/session']) if (!api.includes(keyword)) problems.push(`Missing expected API wiring: ${keyword}`);
if (problems.length) {
  console.error(`\nFAILED: ${problems.length} problem(s) found:`);
  for (const issue of problems) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(`PASS: ${required.length} files present; ${jsFiles.length} JavaScript modules parse; ${importsChecked} local imports resolve.`);
console.log('PASS: Expo/EAS config, API cookie strategy, admin screen wiring verified.');
console.log('NOTE: This is static verification, not a native build or device/API integration test.');
