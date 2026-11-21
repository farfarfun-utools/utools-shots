import path from 'node:path';
import { click, reload, resolvePluginRoot, shoot, sleep, steps } from '../shared.mjs';

const ROOT = resolvePluginRoot('utools-funotp');

const GROUPS = [
  { id: 'g-dev', name: '开发' },
  { id: 'g-cloud', name: '云服务' },
  { id: 'g-life', name: '生活' },
];

const ACCOUNTS = [
  { id: 'a1', issuer: 'GitHub', name: 'farfarfun', secret: 'JBSWY3DPEHPK3PXP', groupIds: ['g-dev'], favorite: true },
  { id: 'a2', issuer: 'GitLab', name: 'ops@team.io', secret: 'KRSXG5CTMVRXEZLU', groupIds: ['g-dev'] },
  { id: 'a3', issuer: 'npm', name: 'publisher', secret: 'MZXW6YTBOI======', groupIds: ['g-dev'], favorite: true },
  { id: 'a4', issuer: 'AWS', name: 'root@aws', secret: 'NB2W45DFOIZA====', groupIds: ['g-cloud'], algorithm: 'SHA256' },
  { id: 'a5', issuer: 'Cloudflare', name: 'dns@farfar.fun', secret: 'ONXW2ZJAMRXWG5A=', groupIds: ['g-cloud'] },
  { id: 'a6', issuer: 'Microsoft', name: 'work@outlook.com', secret: 'PFSXG33UOJUW4ZY=', groupIds: ['g-cloud'], favorite: true },
  { id: 'a7', issuer: 'Steam', name: 'farfar', secret: 'QRSXG43BM5SQ====', encoding: 'steam', groupIds: ['g-life'] },
  { id: 'a8', issuer: '支付宝', name: '138****8888', secret: 'RFSXG5DBOJSSA===', groupIds: ['g-life'] },
];

const seed = (theme) => `localStorage.setItem('funotp-state-v1', ${JSON.stringify(JSON.stringify({
  version: 1,
  theme,
  currentView: 'all',
  groups: GROUPS,
  accounts: ACCOUNTS,
}))})`;

// 周期末尾 5 秒卡片会多出「下一个」那行，高度跟着变。避开它，几张图的版式才一致。
const STEADY = '30 - (Math.floor(Date.now() / 1000) % 30) > 9';

const base = {
  dist: path.join(ROOT, 'utools/dist'),
  out: path.join(ROOT, 'docs/screenshots'),
  width: 800,
  height: 558,
};

export default async function run() {
  await shoot({
    ...base,
    seed: seed('light'),
    shots: [
      { name: 'home', wait: 1200, settle: STEADY },
      { name: 'add', before: click('[aria-label="添加账号"]'), wait: 700 },
      { name: 'settings', before: steps(reload, click('[aria-label="设置"]')), wait: 700 },
    ],
  });
  await sleep(200);
  await shoot({
    ...base,
    seed: seed('dark'),
    shots: [{ name: 'dark', wait: 1200, settle: STEADY }],
  });
}
