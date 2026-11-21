// 截图公用件：起静态服务器 + 开无头浏览器 + 按剧本拍照。
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { launch } from './cdp.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const HERE = import.meta.dirname;

/**
 * 定位插件仓库根目录，同时兼容两种工作区布局：
 * 1. `UTOOLS_PLUGINS_DIR` 环境变量显式指定插件父目录；
 * 2. 聚合工作区：`utools-dev/tools/utools-shots` -> `utools-dev/plugins/<name>`；
 * 3. 平铺工作区：`.shots` / `utools-shots` 与 `<name>` 同级。
 */
export function resolvePluginRoot(name) {
  const candidates = [
    process.env.UTOOLS_PLUGINS_DIR && path.resolve(process.env.UTOOLS_PLUGINS_DIR, name),
    path.resolve(HERE, '../../plugins', name),
    path.resolve(HERE, '..', name),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'utools/plugin.json'))) return dir;
  }
  const found = candidates.find((dir) => fs.existsSync(dir));
  if (found) return found;

  throw new Error(
    `找不到插件仓库 ${name}（已检查：${candidates.join(', ')}）。可通过 UTOOLS_PLUGINS_DIR 指定插件父目录。`,
  );
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const HIDE_SCROLLBARS = `(() => {
  const style = document.createElement('style');
  style.textContent = '*::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important }';
  document.head.append(style);
  return true;
})()`;

/** 点一个选择器命中的元素。 */
export const click = (selector) => (session) =>
  session.evaluate(`document.querySelector(${JSON.stringify(selector)})?.click(), true`);

/** 按可见文字点按钮，用在没有稳定选择器的对话框按钮上。 */
export const clickText = (text, selector = 'button') => (session) =>
  session.evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})]
    .find((node) => node.textContent.trim() === ${JSON.stringify(text)})?.click(), true`);

/** 点第一个文字里含有 text 的元素，用在列表项这种没有稳定标识的地方。 */
export const clickContains = (selector, text) => (session) =>
  session.evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})]
    .find((node) => node.textContent.includes(${JSON.stringify(text)}))?.click(), true`);

/** 在元素中心按右键，用来调出右键菜单。 */
export const rightClick = (selector) => (session) =>
  session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return false;
    const box = node.getBoundingClientRect();
    node.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true,
      clientX: Math.round(box.left + box.width / 2),
      clientY: Math.round(box.top + box.height / 2),
    }));
    return true;
  })()`);

/** 往输入框里填值并派发 input 事件，让 v-model 跟上。 */
export const type = (selector, value) => (session) =>
  session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return false;
    node.focus();
    node.value = ${JSON.stringify(value)};
    node.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);

/** 把滚动容器拉到底，用在消息列表这种新内容在下面的地方。 */
export const scrollToBottom = (selector) => (session) =>
  session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return false;
    node.scrollTop = node.scrollHeight;
    return true;
  })()`);

/** 重新加载页面，让下一张图从干净的初始界面开始。 */
export const reload = async (session) => {
  await session.send('Page.reload');
  await session.waitForExpression('document.readyState === "complete"');
  await session.evaluate(HIDE_SCROLLBARS);
  await sleep(1200);
};

/** 依次执行若干个动作。 */
export const steps = (...actions) => async (session) => {
  for (const action of actions) {
    await action(session);
    await sleep(350);
  }
};

export async function serve(root) {
  const resolvedRoot = path.resolve(root);
  const rootPrefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(resolvedRoot, relative);
    if ((target !== resolvedRoot && !target.startsWith(rootPrefix)) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      response.writeHead(404).end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': MIME[path.extname(target)] ?? 'application/octet-stream' });
    fs.createReadStream(target).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { origin: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

/**
 * 跑一组截图。
 *
 * 落盘目录默认改到 .shots/preview/ 下，不再直接覆盖插件仓库的 docs/screenshots ——
 * README 里的图一律由 CI 重拍（本机和 runner 的字形栅格不一样），本地预览写进去就是
 * 一堆噪声 diff，而且很容易连人带图一起提交上去。真要覆盖的话显式设 SHOTS_OUT=repo。
 *
 * @param options.dist 要起服务的目录。
 * @param options.out 截图落盘目录（SHOTS_OUT 不是 repo 时会被改写到 preview/ 下）。
 * @param options.width/height 视口尺寸（对齐 plugin.json 的插件窗口）。
 * @param options.scale 像素密度，2 出高清图。
 * @param options.seed 页面加载后、reload 前执行的表达式，用来塞演示数据。
 * @param options.shots [{ name, before }]，before 收到 session，负责把界面点到位。
 */
export async function shoot({ dist, out, width = 800, height = 600, scale = 2, seed, shots }) {
  if (process.env.SHOTS_OUT !== 'repo') {
    // dist 是 <插件仓库>/utools/dist，往上两级就是仓库目录，拿它的名字做子目录，
    // 四个插件预览时互不覆盖。
    const repo = path.basename(path.resolve(dist, '../..'));
    out = path.join(import.meta.dirname, 'preview', repo);
  }
  const server = await serve(dist);
  const browser = await launch({ headless: true });
  const { session } = browser;
  const failures = [];
  session.on('Runtime.exceptionThrown', (p) => {
    failures.push(p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text);
  });
  try {
    await session.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: scale, mobile: false,
    });
    await browser.navigate(server.origin);
    await session.waitForExpression('document.readyState === "complete"');
    if (seed) {
      await session.evaluate(seed);
      await session.send('Page.reload');
      await session.waitForExpression('document.readyState === "complete"');
    }
    // 截图里不要出现滚动条：它只是浏览器预览的产物，uTools 窗口里长得不是这样。
    await session.evaluate(HIDE_SCROLLBARS);
    await sleep(900);

    fs.mkdirSync(out, { recursive: true });
    for (const shot of shots) {
      if (shot.before) await shot.before(session);
      await sleep(shot.wait ?? 500);
      if (shot.settle) await session.waitForExpression(shot.settle, { timeout: 40_000 });
      const { data } = await session.send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(out, `${shot.name}.png`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`  ✓ ${path.basename(out)}/${shot.name}.png`);
      if (shot.after) await shot.after(session);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (failures.length) console.warn('  页面抛错：', failures.slice(0, 5));
}
