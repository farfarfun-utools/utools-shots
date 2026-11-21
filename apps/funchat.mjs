import path from 'node:path';
import { click, clickContains, clickText, reload, resolvePluginRoot, rightClick, scrollToBottom, shoot, sleep, steps } from '../shared.mjs';

const ROOT = resolvePluginRoot('utools-funchat');

// 内置好友里的 GPT-5.4（utools/dist/data/agents.json 自带，首次运行会自动入库）。
const AGENT = 'ai@0000000000002';

const ANSWER = `快排的核心是「选一个基准，把比它小的扔左边、大的扔右边，再分别递归」。

\`\`\`python
def quicksort(items: list[int]) -> list[int]:
    if len(items) <= 1:
        return items
    pivot = items[len(items) // 2]
    left = [x for x in items if x < pivot]
    middle = [x for x in items if x == pivot]
    right = [x for x in items if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

平均时间复杂度是 $O(n \\log n)$，推导来自这条递归式：

$$T(n) = 2T\\!\\left(\\frac{n}{2}\\right) + O(n) = O(n \\log n)$$

最坏情况是 $O(n^2)$：数据已经有序、又每次都拿端点当基准。`;

const CONVERSATIONS = [
  {
    at: Date.parse('2026-10-15T21:12:00+08:00'),
    title: '用 Python 写一个快速排序',
    messages: [
      { role: 'user', content: '用 Python 写一个快速排序，顺便说说它的复杂度。' },
      { role: 'assistant', content: ANSWER },
    ],
  },
  {
    at: Date.parse('2026-10-15T16:40:00+08:00'),
    title: '把这段周报改得通顺一点',
    messages: [
      { role: 'user', content: '帮我把这段周报改得通顺一点。' },
      { role: 'assistant', content: '改好了，主要是把三处被动句换成了主动句，并把结论提到了开头。' },
    ],
  },
  {
    at: Date.parse('2026-10-14T10:05:00+08:00'),
    title: 'Vite 的 HMR 是怎么工作的',
    favorite: true,
    messages: [
      { role: 'user', content: 'Vite 的 HMR 到底是怎么工作的？' },
      { role: 'assistant', content: 'Vite 的开发服务器用原生 ESM 直接喂给浏览器，改动哪个模块就只推哪个模块的更新。' },
    ],
  },
  {
    at: Date.parse('2026-10-13T09:30:00+08:00'),
    title: '这段正则匹配不到中文',
    messages: [
      { role: 'user', content: '这段正则为什么匹配不到中文？' },
      { role: 'assistant', content: '因为 \\w 只覆盖 ASCII。加上 u 标志再用 \\p{Script=Han} 就能匹配汉字了。' },
    ],
  },
];

function documents() {
  const docs = {};
  for (const item of CONVERSATIONS) {
    const id = `chat@${AGENT}#${item.at}`;
    const date = new Date(item.at).toLocaleString('zh-CN', { hour12: false });
    docs[id] = {
      _id: id,
      title: item.title,
      isFavorite: Boolean(item.favorite),
      createdDate: date,
      updatedDate: date,
      updatedAt: item.at,
      tokens: item.messages.reduce((sum, message) => sum + message.content.length, 0),
      searchText: item.messages.map((message) => message.content).join(' '),
    };
    docs[`chatbody@${AGENT}#${item.at}`] = { _id: `chatbody@${AGENT}#${item.at}`, messages: item.messages };
  }
  return docs;
}

export const seedFor = (theme) => `
  localStorage.setItem('funchat.db.documents', ${JSON.stringify(JSON.stringify(documents()))});
  localStorage.setItem('funchat.funchat.settings', ${JSON.stringify(JSON.stringify({
    // provider 为 utools 表示走客户端内置 AI，否则没填 key 时整屏被「绑定 API」引导页占住。
    theme, dark: theme === 'dark', provider: 'utools', model: 'deepseek-v3.2', sendMode: 'ctrl-enter',
  }))});
  true;
`;

/** 选中 GPT-5.4，打开话题记录，点进最近那条话题，再把消息区拉到底。 */
const openTopConversation = steps(
  clickContains('.agent-item', 'GPT-5.4'),
  click('[aria-label="话题记录"]'),
  click('.history-list article'),
  scrollToBottom('.messages'),
);

const base = {
  dist: path.join(ROOT, 'utools/dist'),
  out: path.join(ROOT, 'docs/screenshots'),
  width: 800,
  height: 660,
};

export default async function run() {
  await shoot({
    ...base,
    seed: seedFor('light'),
    shots: [
      { name: 'chat', before: openTopConversation, wait: 1500 },
      { name: 'history', before: steps(reload, clickContains('.agent-item', 'GPT-5.4'), click('[aria-label="话题记录"]')), wait: 900 },
      { name: 'market', before: steps(reload, click('[aria-label="AI 市场"]')), wait: 1000 },
      {
        name: 'agent',
        before: steps(
          reload,
          rightClick('.agent-item'),
          clickText('编辑', '.agent-context-menu button'),
        ),
        wait: 900,
      },
    ],
  });
  await sleep(200);
  await shoot({
    ...base,
    seed: seedFor('dark'),
    shots: [{ name: 'dark', before: openTopConversation, wait: 1500 }],
  });
}
