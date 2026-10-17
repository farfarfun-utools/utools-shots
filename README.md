# shots —— 四个 uTools 插件的截图工具链

这里是 `utools-funchat` / `utools-fundoc` / `utools-funlink` / `utools-funotp` 四个仓库里
`scripts/screenshots.mjs` 和 `scripts/cdp.mjs` 的**生成端**。那四份是产物，不要手改 ——
改了下次生成就被覆盖。

## 为什么不各仓库存一份

截图脚本里真正因插件而异的只有「演示数据 + 分镜」，骨架（起静态服务、开无头浏览器、
冻时钟、按剧本拍照、裁滚动条）四个仓库一字不差。抄四份的下场有现成的例子：
`scripts/cdp.mjs` 上线第一天就因为一个临时目录前缀分叉成了两种内容，而组织共用的
`.github/workflows/screenshots.yml` 的注释里也把它当反面教材写着。

所以这边只维护一份骨架，分发到四个仓库。

## 文件

| 文件 | 作用 |
| --- | --- |
| `_prelude.mjs` | 公用骨架。用 `// @helper 名字` … `// @end` 标出可裁剪的小动作 |
| `_tail-<app>.mjs` | 各插件的演示数据与分镜 |
| `cdp.mjs` | 极简 CDP 客户端（起浏览器、求值、截图、下载），四个仓库共用 |
| `shared.mjs` | 本地预览用的静态服务器 + 拍照流程 |
| `apps/<app>.mjs` | 本地预览的入口，`node run.mjs <app>` 调它 |
| `build-scripts.mjs` | 生成器：把骨架 + 分镜拼成各仓的 `scripts/screenshots.mjs`，并分发 `cdp.mjs` |
| `setup.mjs` | 生成本机专用的 `chromium` 壳和 `fonts.conf`（含绝对路径，不进版本库） |

生成时会按实际调用裁掉没用到的小动作 —— 整份骨架照抄过去会让 eslint 在每个仓库里报一串
`no-unused-vars`。

## 用法

```sh
node setup.mjs          # 换台机器先跑这个：找 Chromium、写 chromium 壳和 fonts.conf
node build-scripts.mjs  # 生成四个仓库的 scripts/screenshots.mjs 和 scripts/cdp.mjs
node run.mjs funotp     # 本地预览某个插件的截图（需要先在该仓库里 pnpm build）
```

`run.mjs` 的图落在 `preview/<仓库名>/`（已 gitignore），**不会**动插件仓库里的
`docs/screenshots` —— 那些图归 CI 管，见最后一节。真要就地覆盖（比如想看 README 渲染
出来什么样）：`SHOTS_OUT=repo node run.mjs funotp`，看完记得 `git restore docs/screenshots`。

改完骨架或分镜，**跑一遍 `build-scripts.mjs` 再去各仓库提交**。反过来，如果直接改了某个
仓库的 `scripts/screenshots.mjs`，记得把改动搬回这里的 `_prelude.mjs` / `_tail-<app>.mjs`，
否则下次生成就没了。

## 不进版本库的东西

- `chromium`、`fonts.conf` —— 含本机绝对路径，由 `setup.mjs` 生成；
- `fonts/*.ttf` —— emoji 字体有 11MB，不适合塞进仓库。本机缺它时 `setup.mjs` 会提醒：
  放一份 `NotoColorEmoji.ttf` 进 `fonts/`（Google Fonts，OFL 许可），或者装系统包
  `fonts-noto-color-emoji` 后拷过来。没有它不会报错，只会把 emoji 拍成豆腐块。

## 和 CI 的分工

README 里那些图**一律由 CI 重拍**：组织共用的
[`.github/workflows/screenshots.yml`](https://github.com/farfarfun-utools/.github/blob/master/.github/workflows/screenshots.yml)
在打版本标签时跑一遍，图真的变了才提交回 master。本地这套只用来预览 —— 本机和 runner
的字形栅格对不上，两边互相覆盖只会制造一堆噪声 diff。
