
// ───────────────────────────── 演示数据 ─────────────────────────────
// 全是编的：密钥是随手拼的合法 Base32，不对应任何真实账号。

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

const seedFor = (theme) => `localStorage.setItem('funotp-state-v1', ${JSON.stringify(JSON.stringify({
  version: 1,
  theme,
  currentView: 'all',
  groups: GROUPS,
  accounts: ACCOUNTS,
}))})`;

// 倒计时圆环是一条 30 秒的 CSS 动画，跟的是文档时间轴而不是被冻住的 Date.now()，
// 不钉住的话每跑一遍都停在不同角度，CI 会天天提交一张「只有圆环转了一点」的图。
// 冻结时刻落在周期的第 7 秒，所以把进度钉在 7/30 —— 和卡片上显示的「还剩 23 秒」对得上。
const PIN_RING = `
  .otp-ring-value {
    animation: none !important;
    stroke-dashoffset: calc(var(--ring-circumference, 81.68) * 7 / 30) !important;
  }
`;

// 视口对齐 utools/plugin.json 的 pluginSetting.height。
const VIEWPORT = { width: 800, height: 558, extraCss: PIN_RING };

await shoot({
  ...VIEWPORT,
  seed: seedFor('light'),
  shots: [
    { name: 'home', wait: 1200 },
    { name: 'add', before: click('[aria-label="添加账号"]'), wait: 700 },
    // 对话框是 <dialog>，关不干净就会叠在下一张图上，所以直接刷新页面从头来。
    { name: 'settings', before: steps(reload, click('[aria-label="设置"]')), wait: 700 },
  ],
});

await shoot({
  ...VIEWPORT,
  seed: seedFor('dark'),
  shots: [{ name: 'dark', wait: 1200 }],
});
