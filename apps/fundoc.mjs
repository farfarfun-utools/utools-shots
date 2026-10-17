import path from 'node:path';
import { click, shoot, sleep, steps, type } from '../shared.mjs';

const ROOT = '/home/bingtao/workspace/github/farfarfun-utools/utools-fundoc';

const LINALG = `# 特征值与特征向量

## 定义

设 $A$ 是 $n \\times n$ 实矩阵。若存在非零向量 $v$ 和标量 $\\lambda$ 使得

$$A v = \\lambda v$$

就称 $\\lambda$ 是 $A$ 的**特征值**，$v$ 是它对应的**特征向量**。

## 怎么求

1. 解特征方程 $\\det(A - \\lambda I) = 0$，得到全部 $\\lambda$；
2. 对每个 $\\lambda$ 解齐次方程组 $(A - \\lambda I)\\,v = 0$，解空间就是特征子空间。

## 一个例子

$$A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}
\\quad\\Longrightarrow\\quad
\\lambda_1 = 3,\\; v_1 = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix},\\quad
\\lambda_2 = 1,\\; v_2 = \\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$$

## 用 NumPy 验证一下

\`\`\`python
import numpy as np

A = np.array([[2, 1], [1, 2]])
values, vectors = np.linalg.eig(A)
print(values)    # [3. 1.]
print(vectors)   # 每一列是一个特征向量
\`\`\`

> 对称矩阵的特征值一定是实数，不同特征值的特征向量还互相正交 —— 谱定理保证的。
`;

const QUICKSORT = `# 快速排序的三种分区写法

Lomuto 好写，Hoare 快一点，三路分区在大量重复元素时明显更稳。

\`\`\`python
def lomuto(a, lo, hi):
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i
\`\`\`

平均 $O(n \\log n)$，最坏 $O(n^2)$。
`;

const WEEKLY = `# 2026-W42 周报

## 本周完成

- [x] FunDoc 分屏滚动按标题对齐，修掉长文滚到后面差一整节的问题
- [x] KaTeX 字体打进插件，断网也能渲染
- [ ] 导出 zip 时保持目录层级

## 下周计划

把大纲的标题自动编号补到打印的 PDF 里。
`;

const RELEASE = `# 插件发布清单

| 步骤 | 命令 | 说明 |
| --- | --- | --- |
| 校验 | \`sh build.sh\` | lint、类型检查、单测、清单校验一条龙 |
| 产物 | \`utools/dist\` | 确认 KaTeX 字体和搜索内核都在 |
| 上架 | uTools 开发者工具 | 导入 \`utools/plugin.json\` |
`;

const SCRATCH = `# 随手记

- 周三下午两点和设计对一下图标
- \`Ctrl/⌘ + Shift + P\` 可以连正文一起搜
`;

const NODES = [
  { id: 'n-study', type: 'dir', name: '学习笔记', parent: null, order: 100 },
  { id: 'n-linalg', type: 'doc', name: '线性代数 · 特征值', parent: 'n-study', order: 100, body: LINALG, keyword: true },
  { id: 'n-quick', type: 'doc', name: '快速排序', parent: 'n-study', order: 200, body: QUICKSORT },
  { id: 'n-work', type: 'dir', name: '工作', parent: null, order: 200 },
  { id: 'n-weekly', type: 'doc', name: '2026-W42 周报', parent: 'n-work', order: 100, body: WEEKLY },
  { id: 'n-release', type: 'doc', name: '插件发布清单', parent: 'n-work', order: 200, body: RELEASE },
  { id: 'n-scratch', type: 'doc', name: '随手记', parent: null, order: 300, body: SCRATCH },
];

function database() {
  const now = Date.parse('2026-10-15T10:00:00+08:00');
  const docs = {};
  for (const node of NODES) {
    docs[`meta@${node.id}`] = {
      _id: `meta@${node.id}`,
      _rev: '1-shim',
      nodeId: node.id,
      type: node.type,
      name: node.name,
      parentId: node.parent,
      order: node.order,
      createdAt: now,
      updatedAt: now,
      keywordEnabled: Boolean(node.keyword),
      keywords: [],
      bodySize: node.body ? new TextEncoder().encode(node.body).length : 0,
    };
    if (node.body) {
      docs[`body@${node.id}`] = {
        _id: `body@${node.id}`,
        _rev: '1-shim',
        nodeId: node.id,
        markdown: node.body,
        updatedAt: now,
      };
    }
  }
  return docs;
}

const seedFor = ({ theme = 'light', mode = 'ir' } = {}) => `
  localStorage.setItem('fundoc.shim.db', ${JSON.stringify(JSON.stringify(database()))});
  localStorage.setItem('fundoc.shim.kv', JSON.stringify({
    'fundoc.settings': {
      mode: ${JSON.stringify(mode)},
      theme: ${JSON.stringify(theme)},
      codeTheme: 'follow',
      syncTitleFromHeading: true,
      headingNumber: true,
      autoSaveDelay: 800,
      outlineVisible: true,
      treeVisible: true,
    },
    'fundoc.ui.expanded': ['n-study', 'n-work'],
  }));
  true;
`;

const base = {
  dist: path.join(ROOT, 'utools/dist'),
  out: path.join(ROOT, 'docs/screenshots'),
  width: 800,
  height: 600,
};

export default async function run() {
  await shoot({
    ...base,
    seed: seedFor(),
    shots: [
      { name: 'editor', wait: 2200 },
      {
        name: 'search',
        // 「插件」同时命中一篇标题和一篇正文，正好把标题匹配、正文片段两种结果都拍进去。
        before: steps(click('[title="搜索文档（Ctrl+Shift+P）"]'), type('.sp-input', '插件')),
        wait: 900,
      },
      { name: 'settings', before: steps(click('.sp-mask'), click('[title="设置"]')), wait: 900 },
    ],
  });
  await sleep(200);
  await shoot({
    ...base,
    seed: seedFor({ mode: 'sv' }),
    shots: [{ name: 'split', wait: 2200 }],
  });
  await sleep(200);
  await shoot({
    ...base,
    seed: seedFor({ theme: 'dark' }),
    shots: [{ name: 'dark', wait: 2200 }],
  });
}
