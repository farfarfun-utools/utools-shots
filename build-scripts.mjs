// 把 _prelude.mjs（公用骨架）和 _tail-<app>.mjs（各插件的演示数据与分镜）拼成
// 各仓库的 scripts/screenshots.mjs。
//
// 拼的时候按实际用到的裁掉没用上的小动作：四个插件点界面的方式不一样，
// 整份骨架照抄过去会让 eslint 在每个仓库里报一串 no-unused-vars。
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const WORKSPACE = path.dirname(HERE);
const APPS = ['funchat', 'fundoc', 'funlink', 'funotp'];

const prelude = fs.readFileSync(path.join(HERE, '_prelude.mjs'), 'utf8');

/** 按 `// @helper 名字` … `// @end` 切出小动作，剩下的是永远要保留的骨架。 */
function split(source) {
  const helpers = new Map();
  const skeleton = [];
  let current = null;
  for (const line of source.split('\n')) {
    const start = line.match(/^\/\/ @helper (\w+)$/);
    if (start) {
      current = { name: start[1], lines: [] };
      skeleton.push({ slot: current.name });
      continue;
    }
    if (line === '// @end') {
      helpers.set(current.name, current.lines.join('\n'));
      current = null;
      continue;
    }
    (current ? current.lines : skeleton).push(line);
  }
  return { helpers, skeleton };
}

const { helpers, skeleton } = split(prelude);

for (const app of APPS) {
  const tail = fs.readFileSync(path.join(HERE, `_tail-${app}.mjs`), 'utf8');
  // 只看调用处：小动作一律写成 `名字(` 的形式。
  const used = new Set([...helpers.keys()].filter((name) => new RegExp(`\\b${name}\\(`).test(tail)));

  const body = skeleton
    .map((line) => (typeof line === 'string' ? line : used.has(line.slot) ? helpers.get(line.slot) : null))
    .filter((line) => line !== null)
    .join('\n')
    // 裁掉整块之后会留下连续空行，收一收。
    .replace(/\n{3,}/g, '\n\n');

  const target = path.join(WORKSPACE, `utools-${app}`, 'scripts/screenshots.mjs');
  fs.writeFileSync(target, `${body}${tail}`);

  // cdp.mjs 也一起分发。它原来是靠手工拷的，结果已经漂了：funchat / funlink / funotp
  // 那三份一致，fundoc 那份差一行（临时目录前缀还写着插件名）。分发比对账便宜。
  fs.copyFileSync(path.join(HERE, 'cdp.mjs'), path.join(WORKSPACE, `utools-${app}`, 'scripts/cdp.mjs'));

  console.log(`${app.padEnd(8)} 保留小动作：${[...used].join(', ') || '（无）'}`);
}
