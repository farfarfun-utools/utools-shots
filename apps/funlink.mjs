import path from 'node:path';
import { click, clickText, reload, resolvePluginRoot, rightClick, shoot, sleep, steps } from '../shared.mjs';

const ROOT = resolvePluginRoot('utools-funlink');

// cat@default 是「收集箱」那个内置视图的分类 id，顶部导航自己会画，别再当成一级分类塞进来。
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
  card('b13', 'Vite 插件市场', 'https://vite.dev/plugins', '官方插件清单', 'cat-fe', 'VP', '#9333ea'),
  card('b14', 'Pinia', 'https://pinia.vuejs.org/zh', 'Vue 状态管理', 'cat-fe', 'PN', '#ffd859'),
  card('b15', 'Iconify', 'https://icon-sets.iconify.design', '找图标就来这', 'cat-fe', 'IF', '#1769aa'),
  card('b16', 'Vitest', 'https://cn.vitest.dev', '跑单测的那个', 'cat-fe', 'VI', '#fcc72b'),
  card('b17', 'Bundlephobia', 'https://bundlephobia.com', '装之前先看体积', 'cat-fe', 'BP', '#ff6b6b'),
  card('b18', 'Regex101', 'https://regex101.com', '正则在线调试', 'cat-fe', 'RE', '#0f9f6e'),
  card('b9', 'GitHub', 'https://github.com', '代码托管与协作', 'cat-be', 'GH', '#24292f', { favorite: true, note: '常用仓库都在这里' }),
  card('b10', 'Docker Hub', 'https://hub.docker.com', '容器镜像仓库', 'cat-be', 'DK', '#2496ed'),
  card('b11', 'uTools 文档', 'https://www.u.tools/docs', '插件开发手册', 'cat-doc', 'UT', '#0ca47f'),
  card('b12', 'Figma', 'https://www.figma.com', '协同设计工具', 'cat-design', 'FG', '#f24e1e'),
];

const seed = (theme, currentView = 'category:cat-fe') => `localStorage.setItem('funlink-state-v1', ${JSON.stringify(JSON.stringify({
  version: 1,
  theme,
  currentView,
  lastCategoryId: 'cat-fe',
  categories: CATEGORIES,
  bookmarks: BOOKMARKS,
}))})`;

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
      { name: 'home', wait: 1200 },
      { name: 'edit', before: steps(rightClick('.bookmark-card'), clickText('编辑')), wait: 900 },
      {
        name: 'settings',
        // 停在「数据管理」页：备份、书签导入、失效链接检查都在这一页，比基础设置更有信息量。
        before: steps(reload, click('[aria-label="设置"]'), clickText('数据管理')),
        wait: 800,
      },
    ],
  });
  await sleep(200);
  await shoot({
    ...base,
    seed: seed('dark'),
    shots: [{ name: 'dark', wait: 1200 }],
  });
}
