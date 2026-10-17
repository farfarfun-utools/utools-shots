
// ───────────────────────────── 演示数据 ─────────────────────────────
// 全是编的收藏，只用来撑满版式。
//
// 刻意不放 cat@default：那是「收集箱」这个内置视图的分类 id，顶部导航自己会画，
// 再当成一级分类塞进来会多出一个重名的标签页。

const CATEGORIES = [
  { id: 'cat-dev', name: '开发', parentId: '' },
  { id: 'cat-fe', name: '前端', parentId: 'cat-dev' },
  { id: 'cat-be', name: '服务端', parentId: 'cat-dev' },
  { id: 'cat-ai', name: 'AI', parentId: 'cat-dev' },
  { id: 'cat-design', name: '设计', parentId: '' },
  { id: 'cat-doc', name: '文档', parentId: '' },
  { id: 'cat-tool', name: '工具', parentId: '' },
];

const card = (id, title, url, description, categoryId, icon, color, extra = {}) => ({
  id, title, url, description,
  categoryIds: [categoryId],
  categoryId,
  iconType: 'text',
  icon,
  color,
  ...extra,
});

const BOOKMARKS = [
  card('b1', 'Vue 3', 'https://cn.vuejs.org', '渐进式 JavaScript 框架', 'cat-fe', 'V', '#42b883', { favorite: true }),
  card('b2', 'Vite', 'https://cn.vitejs.dev', '下一代前端构建工具', 'cat-fe', 'VT', '#646cff'),
  card('b3', 'MDN Web Docs', 'https://developer.mozilla.org', 'Web 标准的权威文档', 'cat-fe', 'M', '#000000', { favorite: true }),
  card('b4', 'TypeScript', 'https://www.typescriptlang.org', '带类型的 JavaScript', 'cat-fe', 'TS', '#3178c6'),
  card('b5', 'Can I use', 'https://caniuse.com', '浏览器兼容性速查', 'cat-fe', 'CI', '#e8664a'),
  card('b6', 'Tailwind CSS', 'https://tailwindcss.com', '原子化 CSS 框架', 'cat-fe', 'TW', '#38bdf8'),
  card('b7', 'npm', 'https://www.npmjs.com/search?q={q}', '包搜索（支持 {q} 站内搜索）', 'cat-fe', 'NP', '#cb3837', { quick: true }),
  card('b8', 'CodePen', 'https://codepen.io', '在线写点 Demo', 'cat-fe', 'CP', '#1e1f26'),
  card('b9', 'Vite 插件市场', 'https://vite.dev/plugins', '官方插件清单', 'cat-fe', 'VP', '#9333ea'),
  card('b10', 'Pinia', 'https://pinia.vuejs.org/zh', 'Vue 状态管理', 'cat-fe', 'PN', '#ffd859'),
  card('b11', 'Iconify', 'https://icon-sets.iconify.design', '找图标就来这', 'cat-fe', 'IF', '#1769aa'),
  card('b12', 'Vitest', 'https://cn.vitest.dev', '跑单测的那个', 'cat-fe', 'VI', '#fcc72b'),
  card('b13', 'Bundlephobia', 'https://bundlephobia.com', '装之前先看体积', 'cat-fe', 'BP', '#ff6b6b'),
  card('b14', 'Regex101', 'https://regex101.com', '正则在线调试', 'cat-fe', 'RE', '#0f9f6e'),
  card('b15', 'GitHub', 'https://github.com', '代码托管与协作', 'cat-be', 'GH', '#24292f', { favorite: true, note: '常用仓库都在这里' }),
  card('b16', 'Docker Hub', 'https://hub.docker.com', '容器镜像仓库', 'cat-be', 'DK', '#2496ed'),
  card('b17', 'uTools 文档', 'https://www.u.tools/docs', '插件开发手册', 'cat-doc', 'UT', '#0ca47f'),
  card('b18', 'Figma', 'https://www.figma.com', '协同设计工具', 'cat-design', 'FG', '#f24e1e'),
];

const seedFor = (theme) => `localStorage.setItem('funlink-state-v1', ${JSON.stringify(JSON.stringify({
  version: 1,
  theme,
  currentView: 'category:cat-fe',
  lastCategoryId: 'cat-fe',
  categories: CATEGORIES,
  bookmarks: BOOKMARKS,
}))})`;

// 视口对齐 utools/plugin.json 的 pluginSetting.height。
const VIEWPORT = { width: 800, height: 558 };

await shoot({
  ...VIEWPORT,
  seed: seedFor('light'),
  shots: [
    { name: 'home', wait: 1200 },
    // 编辑已有卡片而不是新建：新建面板是空的，填满的表单才看得出能调哪些东西。
    { name: 'edit', before: steps(rightClick('.bookmark-card'), clickText('编辑')), wait: 900 },
    // 停在「数据管理」页：备份还原和书签导入都在这一页，比基础设置更有信息量。
    { name: 'settings', before: steps(reload, click('[aria-label="设置"]'), clickText('数据管理')), wait: 800 },
  ],
});

await shoot({
  ...VIEWPORT,
  seed: seedFor('dark'),
  shots: [{ name: 'dark', wait: 1200 }],
});
