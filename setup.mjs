// 生成本机专用的两个文件：`chromium`（带环境变量的浏览器启动壳）和 `fonts.conf`。
//
// 这两样都含绝对路径，所以不进版本库 —— 换台机器跑一次 `node setup.mjs` 重新生成，
// 而不是把别人机器上的路径抄进仓库再一个个改。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = import.meta.dirname;

/**
 * 找一个 Chromium。优先顺序：显式指定 → Playwright 下载的那份 → 系统装的。
 *
 * 本地这套只用来预览：README 里那些图一律由 CI 重拍（组织共用的
 * .github/workflows/screenshots.yml 用 runner 上的 /usr/bin/google-chrome 加
 * apt 装的 Noto 字体），本地和 CI 的字形栅格对不上，两边互相覆盖只会制造噪声 diff。
 * 所以这里不追求和 CI 同一个版本，能起得来就行。
 */
function findChromium() {
  if (process.env.CHROME_BINARY) return process.env.CHROME_BINARY;

  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  if (fs.existsSync(cache)) {
    const builds = fs
      .readdirSync(cache)
      .filter((name) => name.startsWith('chromium-'))
      // 目录名是 chromium-<revision>，按数字倒序取最新的一份。
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const build of builds) {
      const binary = path.join(cache, build, 'chrome-linux64/chrome');
      if (fs.existsSync(binary)) return binary;
    }
  }

  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try {
      return execFileSync('command', ['-v', name], { shell: true, encoding: 'utf8' }).trim();
    } catch {
      // 没装这个，继续试下一个。
    }
  }
  return '';
}

/**
 * 有些环境（容器、精简版发行版）缺 Chromium 要的系统库，得另外解一份运行时出来，
 * 用 LD_LIBRARY_PATH 指过去。目录不存在就不写这一行 —— 系统库齐全的机器不需要它。
 */
function findRuntimeLib() {
  const candidates = [
    process.env.CHROMIUM_RUNTIME_LIB,
    path.join(os.homedir(), '.local/share/chromium-runtime/usr/lib/x86_64-linux-gnu'),
  ].filter(Boolean);
  return candidates.find((dir) => fs.existsSync(dir)) || '';
}

const chromium = findChromium();
if (!chromium) {
  console.error('error: 找不到 Chromium。装一个，或用 CHROME_BINARY=<路径> 指定。');
  console.error('       Playwright 那份：npx playwright install chromium');
  process.exit(1);
}

const runtimeLib = findRuntimeLib();
const fontsDir = path.join(HERE, 'fonts');

// fontconfig 的 <dir> 只认绝对路径，所以这个文件必须按本机路径生成。
fs.writeFileSync(
  path.join(HERE, 'fonts.conf'),
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<!-- 由 setup.mjs 生成，不要手改。
     截图浏览器专用：系统上没装 emoji 字体时，带 emoji 的界面会全是豆腐块。
     只在截图时通过 FONTCONFIG_FILE 生效，不动用户自己的 fontconfig。 -->
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${fontsDir}</dir>
</fontconfig>
`,
);

const wrapper = path.join(HERE, 'chromium');
fs.writeFileSync(
  wrapper,
  `#!/bin/sh
# 由 setup.mjs 生成，不要手改。
${runtimeLib ? `export LD_LIBRARY_PATH="${runtimeLib}\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}"\n` : ''}export FONTCONFIG_FILE="${path.join(HERE, 'fonts.conf')}"
exec ${chromium} "$@"
`,
);
fs.chmodSync(wrapper, 0o755);

console.log(`chromium   ${chromium}`);
console.log(`运行时库   ${runtimeLib || '（系统库齐全，不需要）'}`);
console.log(`字体目录   ${fontsDir}`);

// emoji 字体是另一件事：没有它截图不会失败，只会把 emoji 画成豆腐块 —— 这种问题
// 在图提交上去之后才会被人发现，所以在这里提醒一句。
const hasEmojiFont = fs.existsSync(fontsDir) && fs.readdirSync(fontsDir).some((name) => /emoji/i.test(name));
if (!hasEmojiFont) {
  console.log('');
  console.log('注意：fonts/ 下没有 emoji 字体，带 emoji 的界面会拍成豆腐块。');
  console.log('      放一份 NotoColorEmoji.ttf 进 fonts/（Google Fonts，OFL 许可），');
  console.log('      或者装系统包 fonts-noto-color-emoji 后把它拷过来。');
}
