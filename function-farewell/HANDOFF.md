# 函数式告别 — 项目交接文档

最后更新：2026-11-21

> 如果是第一次接手、或使用另一个 AI：先读同目录的 **`AI_HANDOFF.md`**（完整现状、工作流、Skill、部署与遗留事项），再回到本文件查细节与历史记录。

## 1. 当前状态

项目是一个无构建步骤的纯静态站点，本地源码目录：

`D:\Astroswarm\function-farewell-mono`

当前版本已经完成“结局先画图、后逐字显示”、线描场景题、开局墨滴显现，以及 23 节拍的长流程（6 段叙事间章 + 5 段手机聊天，每段两轮），并通过内容测试和完整浏览器动画验收。

部署状态：**结局版于 2026-11-20 14:35、开场形变版于 15:12、墨色视觉层次版于 15:40、顶部精简与签名行版于 16:21、阻尼与签名行稳定版于 16:38、慢速压缩成线版于 17:18、蓄力回弹版于 17:34、成线收尾版于 18:00、开局按钮精简版于 18:40、图标按钮版于 18:55、Lucide 图标版于 19:17、图标悬停形变版于 19:47、图标形状变换版于 20:20、方叉变换版于 21:57、切换常驻版于 22:22、墨滴文字版于 22:39、大幅墨滴版于 23:09、柔化墨滴版于 2026-11-21 10:21、墨滴外扩版于 2026-11-21 11:23、墨滴留白版于 2026-11-21 11:34、缓存破壁版于 2026-11-21 11:51、墨滴性能版于 2026-11-21 12:22、线描场景题版于 2026-11-21 14:36、线稿细化版于 2026-11-21 15:03、墨滴重构与人物精修版于 2026-11-21 15:24、肖像融入版于 2026-11-21 16:09、扁平墨渍与文字动效版于 2026-11-21 16:23、长流程插叙与手机聊天版于 2026-11-21 17:16、六景肖像版于 2026-11-21 18:27、胸像重裁与墨滴铺满版于 2026-11-21 22:49、题面重写版于 2026-11-21 23:17、题面收窄修正版于 2026-11-22 10:12、序章版于 2026-11-22 10:31、聊天与选项修正版于 2026-11-22 10:56（均为服务器时间）先后部署到生产环境。** 线上 `https://math.astroswarm.cn/` 当前与本地核心文件 SHA-256 完全一致。历次部署前版本均已完整备份，见第 6 节。

用户已明确授权：**此后本项目改动完成后直接部署上线，无需逐次征求确认**（2026-11-20）。仍须按第 6 节流程备份、比对与验收；删除备份、改 Nginx 等破坏性操作仍须单独确认。

项目不是 git 仓库，没有 `package.json`，没有打包流程。不要自行初始化仓库或引入框架，除非用户明确要求。

## 2. 快速开始

在项目根目录启动本地静态服务器：

```bash
node tests/serve.js 4173
```

如果 4173 已被占用，换端口即可：

```bash
node tests/serve.js 4174
```

本地打开：

`http://127.0.0.1:4173/`

测试命令：

```bash
node tests/content-test.js
node tests/animation-qa.js
```

使用非默认端口运行动画验收：

```bash
QA_BASE=http://127.0.0.1:4174/ node tests/animation-qa.js
```

动画测试使用本机 Chrome 和原生 CDP WebSocket，不依赖 Playwright/Puppeteer。默认 Chrome 路径：

`C:/Program Files/Google/Chrome/Application/chrome.exe`

如果路径不同，设置 `CHROME_PATH`。

## 3. 文件地图

### 核心源码

| 文件 | 职责 |
|---|---|
| `index.html` | 页面骨架；背景 Canvas；KaTeX、math.js 与业务脚本引用 |
| `styles.css` | 黑白视觉、响应式、转场、结局打字机与光标样式 |
| `js/data.js` | 15 个函数、10 个开局、8 道题与选项、6 个结局、坐标轴说明；6 段间章、3 段手机聊天、17 个节拍 |
| `js/engine.js` | F(x) 求和与六结局判定；属于锁定逻辑 |
| `js/app.js` | 开场、开局与游戏流程、节拍构建、间章与手机聊天、单场景转场、结局挂载、逐字动画、分享卡入口 |
| `js/atmosphere.js` | 背景 F(x) 单曲线淡出、重建和长出 |
| `js/plot.js` | 结局函数图、拖动缩放、收束、绘图完成回调、分享卡绘制 |
| `js/scene-art.js` | 八道题的背景线稿与三个选项物件（SVG 线描数据，`window.FAREWELL_ART`） |

### 本地依赖

- `vendor/katex/`：KaTeX 本体、CSS 与字体。
- `vendor/mathjs/`：本地 math.js。
- `assets/portrait-1.jpg`、`assets/portrait-2.jpg`：s1 / s2 使用的两张铅笔肖像（1200×574）。
- `assets/portrait-s3.jpg` … `portrait-s8.jpg`：s3–s8 各自的场景肖像（1000×1500，铅笔素描，已烘焙顶部溶解与接缝留白）。

不要改成 CDN，当前设计要求本地可用。

### 测试与截图

- `tests/content-test.js`：函数、开局、题目、结局文案、长流程 17 节拍结构，以及全部 `3^8 = 6561` 条路径。
- `tests/animation-qa.js`：Chrome CDP 全流程动画/渲染验收，包含间章与手机聊天推进、桌面与手机截图。
- `tests/visual-qa.js`：兼容入口，依次运行内容测试和动画测试。
- `tests/serve.js`：本地静态服务器。
- `tests/shots/`：早期桌面、手机、结局截图。
- `tests/shots-anim/`：最近一次验收截图；结局主截图在正文和原理打完后生成。

## 4. 本次已完成改动

### 4.1 结局解释重写

`js/data.js` 中六种结局的 `text` 和 `principle` 已重写。

统一阅读方式：

- x 轴：主动、靠近与付出。
- y 轴：回应、结果与感受。
- 曲线是理解关系的隐喻，不是“付出必然换来回报”的公式。

`DATA.axisReading` 保存图下说明：

```js
axisReading: {
  x: '主动、靠近与付出',
  y: '回应、结果与感受',
  note: '把曲线当作理解关系的一种隐喻，不是付出必然换来回应的公式。'
}
```

写作要求：保留因果感，但避免绝对化。少用“必然、永远、注定、所有”，多用“有些、可能、未必、不总是”；不要把函数性质说成现实定律。

六种结局标题、数学分类、代表函数与判定优先级均未改。

### 4.2 结局页面顺序

当前 DOM 顺序：

1. 结局标题与数学形态。
2. F(x) 图像、缩放/复位工具、x/y 坐标说明。
3. 结局正文。
4. 完整 F(x) 表达式。
5. 八次选择列表。
6. “一句原理”。
7. 分享卡片。

正文和“一句原理”使用“隐藏度量层 + 绝对定位打字层”，因此逐字出现时页面高度不会跳动。屏幕阅读器拿到完整正文，不朗读逐字增量。

### 4.3 先绘图、后打字

`js/plot.js` 在曲线完整画完后调用 `onDrawComplete`。完成点包括：

- 正常左侧到右侧生长结束。
- reduced-motion 直接完成。
- 用户在动画结束前拖动、滚轮缩放、复位，曲线提前完整显示。

`js/app.js` 的 `handlePlotDrawn()` 是唯一正文启动入口：

- 设置 `state.plotDrawnAt`。
- 给结局页加 `is-plot-drawn`。
- 启动正文逐字显示。
- 正文完成后，再显示并逐字打出“一句原理”。
- 原理完成后才启动曲线收束计时器。

打字节奏：

- 普通字符 28ms。
- 逗号、顿号、分号、冒号 62ms。
- 句号、问号、感叹号 132ms。
- 正文后停顿 360ms 再显示原理。
- 原理全部打完后至少保留 2.8 秒完整曲线，再收束成点。

快速重开会执行 `clearAllTimers()`，旧打字任务不会继续写入新页面。

### 4.4 测试覆盖

`tests/animation-qa.js` 已增加以下检查：

- 图像节点位于正文之前。
- 图下 x/y 说明正确且排除绝对因果。
- 曲线绘制完成前正文为空。
- 正文按字符增加，180ms 后字符数继续增长。
- 正文开始时间不早于曲线绘制完成时间。
- 正文和原理最终完整，并与屏幕阅读器全文一致。
- 原理在正文后显示。
- 桌面六结局、手机、reduced-motion 均覆盖。
- 原有 124 项渲染、转场、背景、坐标、分享卡和锁检查全部保留。

最近一次完整结果：

```text
内容/引擎测试：PASS
动画验收：241 项检查，0 失败
```

（202 项为结局版基线；开场改造 +13 项为 215 项；墨色层次 +4 项为 219 项；签名行 +7 项为 226 项；阻尼与行高稳定 +2 项为 228 项；点击压缩成线 +3 项为 231 项；成线末帧 +1 项为 232 项；开局按钮 +2 项为 234 项；Lucide 规范 +1 项为 235 项；图标悬停形状变换/恢复 +2 项为 237 项；切换时按钮常驻 +1 项为 238 项；墨滴大面积覆盖/消退 +2 项为 240 项；线描场景题 +5 项为 245 项；肖像融入 +1 项为 246 项；长流程间章/聊天 +12 项为 258 项；序章 +1 项为 259 项。）

线上部署后对 `https://math.astroswarm.cn/` 运行同一套验收：**241 项检查全部通过**。更早一次线上验收曾出现 6 项“无运行时异常”失败，定位为本机网络无法访问 Google Fonts（`fonts.googleapis.com` 连接重置，curl 同环境失败），属环境问题；网络恢复后复跑为 0 失败。

六结局路径分布仍为：

```json
{"jump":2187,"asymptote":1458,"log":1798,"sine":32,"decay":271,"parabola":815}
```

### 4.5 开场黑点形变与轮换提示语

黑点不再只随鼠标整体平移，改为**局部形变凸起**：

- `js/app.js` 的 `updateIntroMotion` 计算平滑指针位置、与圆心的间隙 `gap`，邻近度 `prox = (1 - gap/320)^1.35`，凸起幅度上限 `BULGE_MAX = 26px`。
- `idleRadii(entry)` 对 240 个边界点按与指针方向夹角做高斯衰减（`BULGE_SIGMA = 0.85` 弧度），只鼓起朝向鼠标的一侧，背侧保持正圆。
- 形变采用**二阶临界阻尼弹簧**（`omega = 6.5`）：凸起的幅度与方向都带惯性，快速绕圈/划过时滞后回落，不会瞬变；触屏冲量同样经弹簧收敛。
- 仍保留 ≤4px 的轻微整体漂移作为次要动感；鼠标移开后凸起松弛回正圆。
- 手机（coarse）保留 1±0.02 呼吸缩放，另加触摸临时凸起：`pointerdown(touch)` 后 900ms 内按触摸点凸起并线性消退。
- 点击变形时 `beginMorph` 用 `currentCirclePoints()` 抓取当前已形变的轮廓作为 morph 起点，避免跳变。
- reduced-motion 下完全无形变、无呼吸。

提示语替换旧版“点击黑点”：

- `HINT_PHRASES` 共 8 句文雅文案（首句“轻触这团未干的墨”），循环轮换：逐字打出 → 停留 2400ms → 逐字收回 → 下一句。
- 打字节奏 80ms/字，标点停顿 240ms，收回 40ms/字。
- **始终中心对称**：`.intro-hint` 用 `width: max-content` + `translateX(-50%)`，`.hint-line` 为 `inline-block`，字数增减时向两侧对称展开；`min-height` 保证空文案时不跳动。
- 每个字一个 `.hint-ch` span，带 260ms 墨迹浮现动画；reduced-motion 下整句直接完整显示并仅做内容轮换。
- 进入 morph（`beginMorph`）即 `stopHint()`；`initIntro` 重新 `startHint()`；计时器走统一 `timers.hint`，`clearAllTimers()` 可清理。
- 调试入口：`window.__farewell.hintDebug()` 与 `introDebug()` 新增 `bulge / bulgeMax / baseRadius / radii`。

`tests/animation-qa.js` 新增 13 项检查：提示语 ≥6 句、旧文案移除、逐字增加、打字中心对称、轮换换句；鼠标远离正圆、靠近凸起、越近越明显、背侧不变、移开恢复；手机提示语居中、触摸凸起与消退；reduced-motion 提示语直接完整。原“鼠标仅平移 ≤8px”断言已删除。

### 4.6 墨色视觉层次

在纯黑白基调上加入“墨在纸上”的层次感，不引入任何彩色：

- **黑点柔边 + 投影**：`drawIdle` 改为在小离屏画布（`intro.off`，尺寸 `2*(R+BULGE_MAX)+120`）上绘制三层——外层 `blur(7px)` 淡墨晕（alpha 0.14）、核心 `blur(2px)` 柔边、`shadowBlur 26 / offsetY 14 / rgba(0,0,0,.28)` 落影——再 `drawImage` 合成回主画布。离屏是为了避免整屏 blur 拖慢帧率。
- `CANVAS_FILTER` 探测 `ctx.filter` 支持；不支持时退化为硬边 + 落影，核心体验不坏。
- **缓动改为时间基准**：`updateIntroMotion` 用 `dt` 归一化插值系数（`1-(1-k)^(dt/16.7)`），低帧率下收敛速度仍按墙钟一致，形变松弛不会因掉帧变慢。
- **提示语墨影层**：新增 `#hint-ghost` 绝对定位镜像 span（`blur(3px)`、opacity .16、下移 4px、scale 1.03），与 `#hint-type` 同步文本（`syncHintGhost`），形成前景清晰 + 背景洇墨的双层字。前景 `.hint-type` 加 `text-shadow` 两层。
- 游戏顶栏 `.wordmark`、开局标题 `.opening-title`、开局正文 `.opening-copy` 均加低透明度黑色 `text-shadow` 制造纸面浮起感；开场签名行按用户要求明确不加阴影。
- 中心对称不受影响：墨影层绝对定位居中，不参与布局宽度。

`tests/animation-qa.js` 新增 4 项：桌面黑点半透明过渡像素（柔边+投影）、提示语模糊墨影层、前景阴影且墨影同步、手机黑点同样柔边投影。

### 4.7 顶部精简与签名行（溶解轮换）

开场只保留两层文字：打字机提示语（唯一焦点）+ 其下 16px 的签名行（等宽注脚）。

- 移除顶部左“函数式告别”、顶部右“恋爱 · 人生 · 感悟”，并删除旧副行“随机得到一种开始”（该行在窗口高度 ≤720px 时本就隐藏，容易被忽略）。
- 签名行 `#intro-sign`：mono 9.5px / 字距 .28em / `--ink-mute` / 无阴影，与打字机同为水平居中；两段文字共用一个位置：`SIGN_ITEMS = ['函数式告别', '恋爱 · 人生 · 感悟']`。
- 打字机行 `.hint-line` 为块级、固定高 1.7em；清空或逐字出现时签名行不会上下位移。
- 出现：整行 650ms 由透明 + `blur(2px)` + 下移 3px 淡入；停留 2400ms。
- 消失：逐字随机 0–360ms 错峰，每字 580ms 内 opacity→0、`blur(1.6px)`、上移 3px，呈腐蚀/蒸散感；间隔 240ms 后换下一段。一个完整循环约 9 秒。
- `stopSignature` 在 `beginMorph` 调用；`initIntro` 重启；reduced-motion 下不溶解，整句直接显示并定时换句。
- 调试：`window.__farewell.signatureDebug()`（items / idx / mode / text / opacities / delays）。
- 切换开局时两个图标按钮常驻（2026-11-20 22:22）：`beginMorph` 给已可见的 `.intro-copy` 加 `is-morphing`，只淡出 eyebrow/title/shape/copy/note（.35s），`.opening-actions` 保持可见并降至 55% 透明度、暂禁点击；morph 完成 `showOpeningCopy` 更新文案并移除 `is-morphing`，按钮恢复。首次点击（copy 尚未出现）仍保持隐藏。
- ~~开局结果文字改为墨滴显现~~ —— **已于 2026-11-22 17:17 整段移除**（用户反馈遮挡太丑）：`showOpeningCopy` 不再调用 `playCopyInk()`，开局文字直接淡入，以下为历史记录。
- 开局结果文字改为**墨滴显现**（2026-11-21 16:09）：`showOpeningCopy` 触发 `playCopyInk`，在 eyebrow 到正文之间的区域覆盖一层 `.copy-ink` 画布。每次把文字区切成 **2 行 × 2–4 列的网格**，每格落一团**大墨**（半径由格子对角线推出，抖动 ±10%，位置抖动 ±15%），团与团互相重叠连成一片，使正文区约 **99% 面积**被墨覆盖；落点、半径、先后顺序与飞溅角度仍逐次不同：
  - 每团先有一枚小墨滴从上方约 70px 落下，落下时带短拖尾；落点摊开时，5–7 颗小飞溅墨点从墨团外缘（1.25–1.85R）向外弹出；
  - 主墨团不再是圆滑气球：`bakeStainSprite` 用 9 个内部圆 + 20 个边缘圆 + 5 个外向小突触合并出破碎的毛细边缘；同时去掉投影与 3D 渐变（近均匀黑、仅留 0.09 透明度的外渗晕），看起来是纸面墨渍而不是立体珠子；飞溅点改为小墨滴形并沿径向旋转，飞行时带短拖尾；
  - 墨团保持约 0.7s 后，飞溅点向墨团中心汇聚，墨团同步收缩、轻微旋转、变浅，整体约 2.5–2.8s 消失；主墨团/飞溅点均为预烘焙贴图（渐变 + 柔边 + 落影），逐帧仅 `drawImage` 合成；
  - 文字显影延迟为 eyebrow .7 / 标题 .8 / 形态 .9 / 正文 1.0 / 注脚 1.1，与墨滴收敛重叠，形成“墨散、字显”；文字位于墨后分级淡入作“淡入托底”；
  - 切换/进入游戏 `stopCopyInk`；reduced-motion 跳过动画直接显示；
  - 验收在动画内记录峰值覆盖率（只统计文字区，alpha>128 即"真被墨盖住"，要求 ≥80%，实测约 99.9%）与峰值元素数（≥8）；覆盖率取 1000 / 1150 / 1300ms 三次采样的最大值，三次都落在墨团全部长开、开始收敛之前；`Log.entryAdded` 过滤外部字体网络噪声；压缩阴影检查改为固定采样墨点下方区域（`shadowCount`）。
- 开局结果区为**线性图标按钮**，图标遵循 [Lucide](https://github.com/lucide-icons/lucide) 规范（2026-11-20 20:20）：开始用 Lucide circle，切换用 Lucide triangle（`a2 2` 圆弧收角）；24×24 viewBox、描边 **2.5px**、圆头线帽与圆角连接；点击区 48px、间距 10px。默认只有线框，悬停时仅出现极淡底色（不反色、不填充），图形**整体变换为另一个形状**（不是轮廓扭动）：开始 circle → 圆角正方形 `M5 3 H19 A2 2 … Z`，切换 triangle → 叉 `M18 6 L6 18 M6 6 L18 18`。`initIconDeform` 用多子路径点阵插值：圆/方为闭合 96 点环（`normalizeLoop` 统一绕向与起点）；三角拆成两条开放子路径（各 48 点）展开为叉的两笔。临界阻尼弹簧插值进度（ω=14），接近目标即吸附回 crisp 原始路径；移开反向变换回原形状；reduced-motion 下直接切换不做动画。`aria-label` 为“开始第一题 / 切换开局”，title 提供桌面提示。路径内联在页面中，不引入外部依赖。`#btn-enter`、`#btn-reroll` 的 ID 与点击逻辑不变。

### 4.8 点击后的慢速压缩与曲线生长

点击黑点不再直接把圆插值成曲线，改为有蓄力与回弹的节奏：

1. **压缩阶段** `COMPRESS_DUR = 700ms`，`compressProfile` 分三段：
   - 0–14% 蓄力：纵向微胀 +5%、横向微收 −5%，落影短暂增强；
   - 14–62% 急压：`easeInCubic` 加速压扁，横向拉伸至 1.19 倍（挤压拉伸），墨晕与落影快速淡出；
   - 62–100% 弹性回弹：`easeOutBack` 把横向从 1.19 收回 1.0。
   注意：填充形状只压到约 15px 厚的窄条，**不再压成极薄椭圆**；从 58% 起用 smoothstep 把填充交叉淡化掉，同时在中心淡入一条真正的 3px 圆头描边直线（同一宽度），到 75% 时画面已完全是线。末帧会读取画布像素把线的真实 `{w,h}` 记入 `state.compressFinal`，供验收断言“是线不是扁椭圆”。
2. **停顿** `MORPH_HOLD = 90ms`：刚压成的扁线短暂停留，制造下一段加速的预期。
3. **曲线阶段** `MORPH_DUR = 950ms`，`easeMorph = cubic-bezier(0.16, 1.2, 0.3, 1)`：先快速向两侧扫出（约 12% 时间完成 60% 生长），再长时间缓慢收尾，末端有约 1% 的轻微过冲回弹。source 扁线**按 x 升序重排**，与目标函数图像从左到右逐点对应，避免错位/分离笔画；可见半宽由 `lineStartHalf` 插值到 `targetHalf`。笔宽固定 3px，无阴影。

换开局（已展开 → 另一开局）仍是单段 950ms 曲线 morph，不做压缩与停顿；reduced-motion 直接显示目标曲线。`introDebug` 提供 `morphStage / compressDur / morphDur / lineStartHalf`。`tests/animation-qa.js` 有 3 项压缩检查：进入压缩阶段、压缩中高度收缩、阴影与柔边淡出。

### 4.9 题目线描场景与互动选项

八道题改为八个不同的线描场景，问题与情景全部不重复：

1. 公园 · 第七张长椅；2. 咖啡馆 · 窗边的第二杯；3. 地铁站 · 末班车之前；4. 海边 · 退潮以后；5. 房间 · 台灯亮到很晚；6. 雨街 · 岔路口的红灯；7. 车站 · 站台之外；8. 天台 · 天台的月亮。

- **线稿资源**：新增 `js/scene-art.js`，`window.FAREWELL_ART[sceneId]` 提供 `bg`（背景线稿）与 3 个 `options[{art, spot}]`。所有几何元素 `pathLength="1"`，CSS 以 `stroke-dasharray:1; stroke-dashoffset:1 → 0` 做 1.5–1.7s 的描线入场；统一黑线、圆头线帽/圆角连接、无填充。背景层不透明度 .68、线宽 1.45，选项物件 .92、线宽 1.9，形成前/后景层次。
- **线稿细化（15:03）**：长椅改为弧形靠背、多根曲面板条、扶手卷脚；树冠改为多瓣开放式轮廓与内部分枝；咖啡杯、灯塔、站台、天台等物件同步修形。背景中与选项热点重叠的重复物件已移除，避免悬停时“物件消失但背景还在”的穿帮。
- **人物改为肖像（16:09）**：手绘小人全部移除（`figure`/`figureSeated` 已删除）。改用用户提供的两张铅笔肖像 `assets/portrait-1.jpg`、`portrait-2.jpg`（各 1200×574，约 92KB），八题交替使用：`.scene-portrait` 绝对定位在场景右侧，`object-fit: cover` + 可配置 `focus`，`opacity .9`、轻微 `grayscale/brightness/contrast/blur`，并以径向 `mask-image` 羽化边缘，与纯白纸面自然衔接；肖像层级在背景线稿之上、文字与选项之下，手机端不透明度降至 .38。`FAREWELL_ART[sceneId].portrait = { src, spot, focus }`。
- **问题打字**：`DATA.scenes[].question` 新增一行问题；`typeSceneQuestion(sec, text)` 在场景挂载后 700ms 起逐字打出（48ms/字，标点 150ms），每个字为 `.scene-ch`，带 260ms 的淡入+去模糊+上浮；光标闪烁，结束后隐藏；reduced-motion 直接显示全文。屏幕阅读器读 `#scene-question-full`。场景标题另加 0.9s 的模糊上浮入场；选项文字浮现时从 4px 模糊过渡到清晰。
- **互动选项**：每个选项是舞台上的绝对定位热点 `.art-option`，内含 `.option-art`（线描物件）与 `.option-reveal`（A/B/C、短标签、完整选项文案）。桌面端悬停/键盘聚焦时物件淡出+模糊缩小，选项文字淡入；移开后复原；`:has` 让背景与其他物件在悬停时轻微退让。点击逻辑与函数映射保持不变。
- **移动端**：`(hover:none)/(pointer:coarse)` 或 `max-width:720px` 时，选项退化为静态列表（小线描图标 + 始终可见的选项文字），背景线稿降为 13% 淡纹，保证触屏可读可点。
- **约束保持不变**：8 题、每题 3 个选项，选项顺序与 `fn` 映射逐项未改（s1 [f8,f3,f1] … s8 [f10,f3,f7]），因此 6561 条路径与结局分布不变。原有引擎、结局判定、结局文案未动。
- **验收**：新增 5 项——场景线稿/三物件存在、八题标题与问题唯一、问题逐字增长、悬停物件淡出并显示选项、移开复原；截图 `desktop-scene-park.png`、`desktop-scene-hover.png`。
- **题面文案重写（2026-11-21 23:17 / 22 日 10:12 修正版面）**：八道题的背景从原来的一句话改成**两段**——第一段交代场景与关系背景（谁、在哪、什么时候、彼此处在什么位置），第二段给出当下的触发点与内心冲突；`question` 全部具体化为可操作的一问（如"车门打开之前，你会走过去吗？""这二十秒里，你问不问？"），三个选项的 `label` / `text` 逐条改成对这个问题的明确答法，题干的"问"与选项的"答"必须咬合（原先有题干问"要不要先开口"、选项却是"收起杯子"这类错位）。每题 61–86 字，两段。选项 `id` 与 `fn` 映射一个都没动，6561 条路径与结局分布不变。
- **阅读栏与题干收窄**：`.scene-copy .scene-text` 的 `max-width` 由 460px 收至 **340px**，同时 `.scene-question` 加 `max-width: 340px`、字号上限由 26px 降到 **22px**。原因：原一段短句不会越过肖像，改成两段后文字右边界会压进肖像框；题干 26px 时最长的一句（15 字）也会跨到她头发上。文字层级在肖像之上，不是被遮住而是直接压在人脸上。现在两段背景与题干都停在肖像左侧（1440 下题干右边界约 x=720，肖像可见内容从约 x=745 起）。
- **选项热点落在安全区（2026-11-22）**：题面变两段后，原来散在中上部的热点会被正文/题干压住，悬停时选项文字正好盖在正文上；右侧高位的物件还会挡住人物脸部。现在统一为三个安全位：左下一个（`x≈4%, y≈78%, h≈16–20`）+ 右侧两个（`x≈58%` 与 `x≈74%`，`y≈50%` 与 `y≈66–68%`）。这样热点与悬停文字都在正文右侧或正文下方，且全部在脸部区域（`y<48%`）之下。

### 4.10 长流程：叙事间章与手机聊天（17 节拍）

八道计分题保留为函数骨架，幕间插入不计分的叙事间章与手机聊天，形成 17 个节拍：

```text
s1 → n1 → s2 → c1 → s3 → n2 → s4 → n3 → s5 → c2 → n4 → s6 → n5 → s7 → c3 → n6 → s8
```

- **数据**（`js/data.js`）：
  - `interludes` 6 段：n1 走回家的路（公园）、n2 车厢的最后一排（地铁）、n3 风从海上来（海边）、n4 天亮之前（房间）、n5 没有发出去的那句（雨街）、n6 回来的路（车站）。每段两段正文，复用对应场景的线稿背景；文案与具体选项无关，任何分支下都成立。
  - `chats` 3 段：c1 夜里十一点四十七（23:47 / 十一月 · 夜）、c2 正在输入（01:12 / 两周后 · 凌晨）、c3 已到达（21:05 / 她走的那天 · 夜里）。联系人固定为“见微”，每段两条来信 + 三个回复，**每条回复各带两条自己的后续**（`replies[].after`）；回复只改变对话，不写入 `state.funcs`。
  - `beats` 17 项，`type` 为 `scene` / `interlude` / `chat`；八道计分题的出现顺序与选项映射不变。
- **流程**：`startGame` 从 `buildBeat(0)` 开始；`choose` 记录函数后 180ms 调 `goNextBeat(true)` 自动推进（自动推进允许跨过背景锁，`transitionTo` 自身防重入）；间章/聊天的“继续”调用 `goNextBeat()`，受 `isLocked()` 保护。
- **间章页**：`buildInterludeScene` 复用 `FAREWELL_ART[sceneId].bg` 作低透明度底图，显示幕标签、间章标题、两段正文与继续按钮；移动端线稿降为 18%，卡片至少 58vh，页脚贴底。
- **手机聊天**：`buildChatScene` + `playChat`。等宽手机框、顶部时间/联系人/日期、逐字打出的左侧气泡、三点“正在输入”、三个回复按钮；选择后回复区折叠收起，右侧出现自己的气泡，随后打出**这条回复对应的两条后续**，最后显示“继续”。`reduced-motion` 下消息与后续直接完整显示。
- **布局**：`.chat-log` 底部对齐并自动滚动；`.chat-phone` 用 `--phone-h: min(660px, calc(100vh - 200px))` 定高、宽度取机身比例 `0.47`，所以是手机形状而不是方卡片（2026-11-22 修正，之前 400×500 的方形被指出“形状不对”）；`.screen-chat` / `.screen-interlude` 为纵向 flex，页脚由 `margin-top:auto` 贴底；聚焦时依次落到场景标题、间章标题或手机框。
- **验收**：新增 12 项（桌面 6 + 手机 6）——间章标题与两段、间章线稿、聊天手机框/联系人/两条消息/三个回复、正在输入提示、我的气泡与两条后续、继续按钮推进；手机端同时生成 `mobile-scene-*`、`mobile-chat*.png`、`mobile-interlude.png` 截图。

### 4.11 六景肖像补齐（每景一张）

用户的六张场景肖像（生图 AI 产出）已接入 s3–s8，八景不再由两张图交替：

- 素材：`assets/portrait-s3.jpg` … `portrait-s8.jpg`，4:5 竖图，1000×1500，JPEG q84（184–255KB）。s1 / s2 仍用原来的 `portrait-1.jpg` / `portrait-2.jpg`。
- **为什么是胸像裁切**：页面竖框只是约 0.59 宽的窄条（`object-fit: cover`，等比缩放，几何上不会拉伸）。若把整张"头顶到腰"的 4:5 原图直接塞进去，人物会显得又长又窄、脸也偏小、还压到题面文字。素材因此统一按 **0.62 倍取景**重裁：以脸部为中心（s3 0.52 / s4 0.55 / s5 0.52 / s6 0.60 / s7 0.57 / s8 0.64）取原图上方 62% 的 4:5 区域，约 873×1091，再缩放成 1000×1250。人物比例保持原样，只是取景更近，观感与 s1 / s2 的胸像一致。
- 为什么不再用长条图：2.09:1 的旧图只有约 29% 宽度可见；4:5 图可见约 88%，分辨率利用率高得多。
- **素材必须烘焙溶解**：这六张生图头顶在画面里就被切掉了。直接放会露出 `mask-image` 在框顶约 41% 不透明度处切出的一条硬边；内容与留白之间还会出现约 250 对 255 的纸面灰度台阶（底部接缝在遮罩仍有约 0.8 不透明度处，最明显）。处理方式：把 1000×1250 内容贴到 1000×1500 画布 y=170，顶部 y 170→460 做 smoothstep 溶解到纯白，底部内容末行前 130px 淡出到纯白；左右两侧因遮罩本就接近 0 不透明度，无需额外处理。
- `js/scene-art.js` 只改了 s3–s8 的 `portrait.src` 与 `focus`（`focus` 第 2 个分量对 4:5 素材无实际作用：素材宽高比大于竖框，只发生左右裁切，纵向全高可见）。`spot` 未改。
- `index.html` 资源版本号 `?v=20261121j` → `?v=20261121k`（22:49 的胸像重裁版再递增到 `?v=20261121l`）。
- 验收仍为 258 项 0 失败（未新增检查项）；另用截图对照表逐景复核了桌面与手机端的肖像位置、遮挡与溶解边缘。`PORTRAIT-BRIEF.md` 里保留着当时的生图清单与提示词，后续补图可直接复用。

### 4.12 序章（前提背景）

点掉开局结果区的圆形按钮之后，先出现一页**序章**，再进入第一题——否则玩家不知道"她"是谁、你们怎么认识的。

- 数据：`js/data.js` 的 `prologue`（`id: 'p0'`、`actLabel: '序章'`、`kicker: 'PROLOGUE'`、`title: '那年初秋'`、`text` 三段、`art: 's1'` 复用公园线稿作低透明度底图）。
- 文案：第一段讲认识（公园第七张长椅，与 s1 的"公园的第七张长椅"前后呼应）；第二段讲相熟（借一支笔、同一家便利店、同一条回宿舍的路、把天聊到很晚）；第三段讲现在（毕业、换城市、联系变少），并把"八次选择会加起来成为那条曲线"点出来。
- 实现：`js/app.js` 的 `buildPrologueScene()` 复用间章卡片结构（`screen-interlude` + `screen-prologue`），继续按钮调 `beginFirstBeat()`；`startGame()` 由直接 `buildBeat(0)` 改为先进序章。**不能用 `goNextBeat()`**——那会从 beat 0 直接跳到 beat 1，跳过第一题。
- 不计分：序章不是节拍，DATA.beats 是 21 项，不写 state.funcs。
- 文案锁定：三段都在，不得删减成一段；`title` 与八题标题不得重复。
- 开局结果区圆形按钮的 `aria-label` 由"开始第一题"改为"进入序章"。
- 验收：内容测试新增 4 项（标题/眉标、≥3 段、每段有实际内容、不计入节拍）；动画验收新增 1 项（`desktop-prologue.png`，断言序章出现在第一题之前且有继续按钮），基线由 258 变为 259。

### 4.13 十二题与形状系统（2026-11-22）

这一版把"结局是一条函数曲线"换成了"结局是一个图形"：

- **12 道题、5 幕时间线**：第一幕·初秋 → 第二幕·隆冬 → 第三幕·第二年春 → 第四幕·那年夏天 → 尾声·两年后。每题带 when 时间标签，显示为 SCENE 03 · 十月末 · 末班车。新增 4 题 s9/s10/s11/s12，复用同地点线稿。
- **每个选项 = 一个谐波项**（h: { axis, amp, freq, phase }），错误选项额外带破坏类型 d。12 个真诚选项相加**精确等于心形参数方程**：x(t)=12sin t−4sin3t、y(t)=13cos t−5cos2t−2cos3t−cos4t（实测误差 3.55e-15，内容测试守着）。
- **合成**：X(t)=Σx项、Y(t)=Σy项，	∈[0,2π]。8 种破坏：break / open / drift / shrink / wobble / sink / flatten / void。
- **判定**：先过好结局门槛（≥10 次真诚 + 3 个关键节点全中，163/531441 ≈ 1/3260），否则按破坏类型优先级落到 8 个坏结局。
- **绘图**：参数曲线 + 固定视野（以完整心形包围盒为准，残形才会真的缩下去；不能按 ±6 裁剪、也不能自动扩轴）。旧的 1D API（evalFn/sumAt/sample/classify1D）保留，背景曲线与开场形变仍在用。
- **结局页**：图形 → x(t)/y(t) 表达式（宽屏一条、窄屏一项一行）→ 数学注解 → 人话解释 → 分享卡。
- **已知问题**：验收截图里 #ending-name 显示成竖条（DOM 文本正确、字体也正常），疑为截图时刻渲染状态，待查。

### 4.14 分支剧情与记忆（2026-11-22 21:13）

这一版把"12 道题一条直线"改成了**场景图**：每一题决定下一题落到哪个场景。

- **12 个槽位 / 18 个场景**：`DATA.slots` 是 12 个槽位，每个槽位有 1–3 个候选场景；`DATA.beats` 仍是 23 个节拍，场景节拍带 `slot` 与 `default`（该槽位的兜底场景）。
- **选项带分支**：每个选项有 `next`（下一槽位的目标场景）与 `bridge`（过渡句）。过渡句会显示在下一场景正文之前，所以"上一场喝咖啡、下一场仍带着那杯咖啡"是写死的数据关系，不靠模型自由发挥。
- **记忆条目**：每个场景有 `echoes: [{ if, text }]`，条件支持 `choice`（选过某个具体选项）/ `visited`（去过某场景）/ `flag`（聊天里说过某句话）。渲染时按当前 `visited`/`picked`/`flags` 过滤，所以不同分支看到的前情不同。
- **聊天影响剧情**：聊天回复可以带 `next`（把下一场导向该槽位的另一个候选场景，共 6 处）、`flags`（29 个，全部被后续记忆条目消费）、`bridge`（回复后的过渡句）。
- **好结局与心形不变**：同一槽位所有候选场景的真诚项谐波完全一致，所以无论走哪条分支，12 个真诚项仍然精确相加等于心形；好结局仍是 **163 / 531441 ≈ 1/3260**。
- **测试**：`content-test.js` 按图模型重写（槽位/分支/记忆/flag 全覆盖，54 个选项、29 个 flag、54 条记忆），`animation-qa.js` 的五条点击路径按图重新生成，验收 **241 项 0 失败**（本地与线上）。

### 4.15 聊天记忆 / 窄屏排版 / 页面滚动（2026-11-22 22:25）

- **聊天接住上一场**：每段聊天加 `echoes: [{ if, text }]`，按上一场选过的具体选项插入一条她的消息，插在第一条脚本消息之后。例如上一场选「在便签上写一句话，压在她的杯底」，聊天里她会说「便签我看到了，压在杯底那张」。五段聊天共 25 条记忆消息，覆盖各自上一槽位的全部候选场景。
- **窄屏选项排版**：原来列表布局只在 `(hover: none)` 下生效，窄窗口里三个选项仍用绝对定位叠在一起、还带着 `filter: blur(4px)`。现在媒体查询加上 `(max-width: 820px)`，并把 `filter` 一起清掉。
- **页面可滚动**：`.screen-intro` 原来是 `overflow: hidden`，短屏下内容被裁掉且无法滚动（390×640 实测被裁 20px）。改成 `overflow-x: hidden; overflow-y: auto`，开场页与游戏页在内容超出时都能滚动。
- **测试**：内容测试新增 [9] 聊天记忆段（每条记忆必须引用合法的上槽位选项、且覆盖每个候选场景）；动画验收仍是 241 项 0 失败。

**尚未完成（明确记录）**：
1. **不同分支的场景数仍然一样**（都是 12 题）。要做成"选 A 只有 6 场、选 B 有 12 场"，需要把 `beats` 从固定序列改成可按选项跳转的图，并接受"短路径积累的谐波项不足 12 项 → 不可能拼出完整心形"这一后果（好结局只能走完整长线）。
2. **结局标题 `#ending-name` 在验收截图里显示成竖条**，DOM 文本与字体都正常，尚未定位。

### 4.16 30 幕长流程 + 30 个结局（2026-11-23 15:04）

用户要求：一局约 30 分钟、30 个场景、结局图形更多（30 个），并且"每幕选择累积出不同结局"。

- **30 幕剧情**（`js/story30.js`）：一条完整的线，从九月公园初遇走到第二年秋天回到同一张长椅。每幕两段连续叙事（平均 150 字，125–202 字），90 个选项各带标签、说明与三个信号 `t 温度 / h 坦诚 / a 主动`（−1/0/+1）。
- **30 个结局**（`js/endings30.js`）：累计三信号 → 温度 5 档 × 坦诚 3 档 × 主动 2 档 = 30 个结局，每个有独立标题、英文名、正文与一句道理；信号做了均值居中，避免某一档被随机玩法垄断。好结局「同行 / 完整的心」固定在最优档 e30（全暖全坦诚全主动才拿得到）。
- **30 个形状模板**（`js/data30.js`）：每个结局一个专属形状（心、断心、渐近线、纸飞机、钥匙、雪花、伞、月、烟花、日历、光圈……），统一居中并按包围盒缩放；主图与卡片同源。
- **装配**（`js/data30.js`）：把 30 幕装成 30 槽位 / 41 节拍（30 幕 + 6 间章 + 5 聊天），覆盖 `FAREWELL_DATA` 与 `Engine.classify`。
- **物体选项**：全端统一为「物件图标 + 文字标签 + 说明」的列表，首屏三个全部可见（1920×1000 实测底部 955 < 1000），不再需要悬停。
- **拉近转场**：点选项后以该物件为原点放大填满画面、其余内容淡出，约 470ms 后切换到下一幕，下一幕从中心浮出；转场期间锁点击。
- **进场提速**：标题/正文/逐字动画从 0.9s+blur 改到 0.32s 无模糊；新场景前 520ms 选项不可点。
- **结局页**：按钮文案与形状中文名、公式改为「这一局累积的函数之和」（按出现次数合并、自动换行不横向滚动），主图不再自动收起。

自测与验收：内容测试 **PASS**（30 幕 / 90 选项 / 30 结局 / 回响只引用更早选择 / 形状点位可生成）；动画验收本地 **195 项 0 失败**、线上 **195 项 0 失败**（全 A / 全 B / 全 C 三条 30 幕路线 + 手机 + 减少动效）。

### 4.17 结局小说 API（后端转发，密钥不出服务端）（2026-11-23 16:39）

- **模型**：`stepfun-ai/step-5-preview`（NVIDIA API，实测中文长文质量好），备用 `z-ai/glm-5.3-flash`；两者都在服务端固定，前端不可见。
- **后端**：`/opt/shuxing-lab/novel-api/novel-api.py`（Python 标准库，无第三方依赖），只监听 `127.0.0.1:8891`，systemd 服务 `novel-api.service`。
- **密钥**：只放在 `/etc/shuxing-lab/novel.env`（权限 600），由 systemd `EnvironmentFile` 注入；前端静态资源、仓库、日志里都不出现（已用 grep 逐文件核查 `nvapi-` 为 0 处）。
- **Nginx**：`location = /api/novel` 反代到 `127.0.0.1:8891`，`proxy_buffering off` + `proxy_read_timeout 900s`；后端用 **chunked** 响应，否则 nginx 会等到连接关闭才转发。
- **协议**：POST `/api/novel`，body `{run:{ending,steps[]}}`，SSE 流：`{"type":"thinking","chars":n}`（模型思考进度）、`{"type":"delta","text","chars"}`（正文增长）、`{"type":"done"}` / `{"type":"error"}`。
- **前端**：结局页「这一局的小说」区块 + 按钮；流式把正文写进页面，显示"构思中 / 生成中 n 字"；失败或超时自动回落到预写结局正文；同一局生成一次后按选择签名缓存到 localStorage，刷新仍是同一篇。
- **实测**：浏览器同源 fetch 收到 `: connected` 并继续接收 thinking/delta（420 秒内收到 155 条 thinking、656 条 delta，41KB 正文流）；约 5000 字一次生成需要数分钟，属预期。

**已知限制**：stepfun 是推理型模型，开头有 1–3 分钟思考期（期间只有"构思中"进度）；NVIDIA 该 key 下 kimi/glm 非流式基本超时，故固定用 stepfun。

## 5. 不可随意改动的约定

- 恰好 8 道题，每题恰好 3 个预设选项。
- 恰好 15 个函数，每个选项映射一个固定函数。
- F(x) 固定为 8 次选择对应函数的直接相加，不加权重。
- 结局判定采样 101 点，`x ∈ [0, 10]`，步长 0.1。
- 优先级固定：间断 > 渐近 > 指数衰减 > 正弦 > 抛物线 > 对数。
- 结局图固定视野：`x [0,10]`、`y [-6,6]`、y 刻度 `-6,-4,-2,0,2,4,6`。
- 结局图采样 401 点、步长 0.025；含 `1/x` 时从 `x = 0.1` 开始。
- 纯白背景、纯黑前景；标题/正文使用 Noto Serif SC，交互文字使用 Noto Sans SC。
- 不使用紫粉渐变、大面积毛玻璃卡片或悬浮 toast。
- 顶部加入提示必须在 F(x) 同一行右侧，不能覆盖选项。
- 开场黑点固定 240 采样点、半径 90px；形变只允许朝向指针一侧局部凸起（上限 26px），不得整体拉伸或改变背侧。
- 开场提示语必须中心对称逐字展开并循环轮换；不得改回左对齐打字或单句静态文案。
- 开场只允许“打字机 + 签名”两层文字；不得在顶部再加字标/副题，或加第三行小字。
- 签名行必须等宽、浅灰、无阴影，两段文字共用一个位置，消失必须是逐字错峰溶解。
- 黑点形变必须经过二阶阻尼弹簧，不得改回逐帧直跟指针；打字机行必须固定高度，清空时不得让签名行位移。
- 首击必须“蓄力+急压+回弹 700ms（阴影/柔边淡出）→ 停顿 90ms → 曲线 950ms（快出慢收）”；扁线点序必须按 x 升序，不得改回圆的绕圈点序。
- 压缩末段必须交叉淡化到 3px 圆头直线（约 58%–75%），不得把填充直接压成极扁椭圆；验收读取 `compressFinal` 断言末帧高度 ≤12px。
- 开局结果区按钮固定为 Lucide 线性图标（开始=circle、切换=triangle 圆角）：24×24 viewBox、描边 2.5px、圆头线帽/圆角连接、48px 点击区；悬停必须是“整体形状变换”（circle↔圆角正方形、triangle↔叉）并带弹簧插值与吸附，不得做成轮廓扭动、反色填充或静态图标；必须保留 aria-label。
- **12 个槽位 / 18 个场景**：每题恰好 3 个选项，槽位候选与分支目标必须一一对应（`next` 只能落到下一槽位）。选项必须带 `bridge`，除最后一场外必须带 `next`；场景标题与问题在全库唯一。
- 选项热点只能落在安全区：左下一个（`x≈4%, y≈78%`）+ 右侧两个（`x≈58%` / `x≈74%`，`y≈50%` / `y≈66–68%`），且不得进入脸部区域（`y<48%`）或压在正文栏（`x<55%` 且 `y<75%`）上；否则悬停文字会盖住正文、线稿会挡住人物脸。
- 每道题的背景固定为两段：第一段场景与关系，第二段当下的触发与冲突；题干必须是一句针对当下、可作答的追问，三个选项必须分别是对同一个问题的三种答法，不得出现"问一件事、答另一件事"。`option.id` 与 `fn` 映射锁定。阅读栏固定 340px、题干字号上限 22px，不得改回 460px / 26px，否则两段文字与题干会压到人物脸上。
- 长流程固定 **23** 个节拍，顺序为 `s1 n1 s2 c1 s9 n2 s4 n3 c2 s15 c4 s6 n5 s10 n4 s11 s7 n6 c3 s12 c5 s18 s8`（场景节拍按槽位 1→12，`default` 为兜底场景）；增删节拍必须同步 `DATA.beats`、内容测试与动画验收。
- 第一题之前必须有**序章**页（`DATA.prologue`，三段背景，交代"她是谁、怎么认识"），且序章不计入 17 节拍、不写 `state.funcs`；从序章进入第一题必须走 `beginFirstBeat()`，不得用 `goNextBeat()`。
- 间章与聊天只承载叙事，不得写入 `state.funcs`，不得改变 F(x) 与结局判定；聊天的三个回复只影响对话内容。
- 每段间章必须有标题与两段正文，背景复用对应场景线稿；不得再手绘人物。
- 每段聊天固定 **两轮**：每轮两条来信 + 三个回复，每个回复各带两条自己的后续；回复可带 `next`（落到下一槽位的候选场景）、`flags`（供后续记忆条目使用）、`bridge`（过渡句）。聊天设置的 flag 必须全部被记忆条目消费。
- 间章页与聊天页的页脚必须贴底（纵向 flex + `margin-top:auto`），不得悬在页面中部。
- 场景肖像固定“每景一张”：s1 用 `portrait-1.jpg`、s2 用 `portrait-2.jpg`、s3–s8 用 `portrait-s3.jpg`–`portrait-s8.jpg`；`scene-art.js` 中每个 `portrait.src` 不得再跨场景复用。肖像必须羽化边缘、柔化叠放；不得再手绘人物，不得让背景线条穿脸。
- 新增肖像素材必须按 4:5 竖图制作（内容区 1000×1250），并烘焙“顶部溶解 + 接缝留白”。页面竖框宽高比约 0.59，若素材头顶贴边，`mask-image` 会在框顶约 41% 不透明度处切出一条硬边；内容与留白之间还会出现约 250 对 255 的纸面台阶。本版参数可直接沿用：内容贴到 1000×1500 画布 y=170，顶部 y 170→460 做 smoothstep 淡入，底部内容末行前 130px 淡出到纯白。
- 开局**不得**再有墨滴遮挡；`playCopyInk()` 不得在 `showOpeningCopy` 里被调用（2026-11-22 用户要求移除）。
- 题目问题必须逐字打出；选项必须是“线描物件 + 悬停换字”，手机端退化为静态可读列表；不得改回纯文字题目+按钮列表。
- 切换开局（已展开 → 另一开局）时两个图标按钮不得随文字一起消失；只允许文字淡出、按钮保持可见（可短暂降透明度并禁用点击）。
- 视觉层次只允许黑/白/灰阶（墨晕、落影、文字阴影、墨影层），不得引入彩色渐变或毛玻璃。
- 改动后必须跑 `node tests/content-test.js` 和 `node tests/animation-qa.js`，并检查桌面与手机截图。

## 6. 线上环境与回滚

生产地址：

`https://math.astroswarm.cn/`

服务器：

`root@112.124.11.144`

Nginx 站点目录：

`/opt/shuxing-lab/web`

当前线上版本（30 幕 + 结局小说版）部署于 2026-11-23 16:39（服务器时间），资源版本号 `?v=20261124f`。切换方式：旧目录改名备份，暂存目录改名 `web`；后端另装 systemd 服务 novel-api，Nginx 增加 /api/novel 反代（均未重启 Nginx 之外的进程）。

当前线上版本的部署前备份（物体选项版）：

- 目录：`/opt/shuxing-lab/web.pre-novelfront-20261123_*`
- 压缩包：`/root/backups/shuxing-lab-web-before-novelfront-*.tgz`

再上一版（序章版，2026-11-22 10:31）：

- 目录：`/opt/shuxing-lab/web.pre-prologue-20261122_103149`
- 压缩包：`/root/backups/shuxing-lab-web-before-prologue-20261122_103149.tgz`

再上一版（题面收窄修正版，2026-11-22 10:12）：

- 目录：`/opt/shuxing-lab/web.pre-textfit-20261122_101235`
- 压缩包：`/root/backups/shuxing-lab-web-before-textfit-20261122_101235.tgz`

再上一版（题面重写版，2026-11-21 23:17）：

- 目录：`/opt/shuxing-lab/web.pre-storytext-20261121_231737`
- 压缩包：`/root/backups/shuxing-lab-web-before-storytext-20261121_231737.tgz`

再上一版（胸像重裁与墨滴铺满版，22:49）：

- 目录：`/opt/shuxing-lab/web.pre-inkbust-20261121_224850`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkbust-20261121_224850.tgz`

再上一版（六景肖像版，18:27）：

- 目录：`/opt/shuxing-lab/web.pre-portraits-20261121_182718`
- 压缩包：`/root/backups/shuxing-lab-web-before-portraits-20261121_182718.tgz`

再上一版（长流程插叙与手机聊天版，17:16）：

- 目录：`/opt/shuxing-lab/web.pre-longform-20261121_171527`
- 压缩包：`/root/backups/shuxing-lab-web-before-longform-20261121_171527.tgz`

再上一版（扁平墨渍与文字动效版，16:23）：

- 目录：`/opt/shuxing-lab/web.pre-inkflat-20261121_162354`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkflat-20261121_162354.tgz`

再上一版（肖像融入版，16:09）：

- 目录：`/opt/shuxing-lab/web.pre-portrait-20261121_160929`
- 压缩包：`/root/backups/shuxing-lab-web-before-portrait-20261121_160929.tgz`

更早（墨滴重构与人物精修版，15:24）：

- 目录：`/opt/shuxing-lab/web.pre-inkrework-20261121_152457`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkrework-20261121_152457.tgz`

更早（线稿细化版，15:03）：

- 目录：`/opt/shuxing-lab/web.pre-lineart-20261121_150355`
- 压缩包：`/root/backups/shuxing-lab-web-before-lineart-20261121_150355.tgz`

更早（线描场景题版，14:36）：

- 目录：`/opt/shuxing-lab/web.pre-scenegame-20261121_143638`
- 压缩包：`/root/backups/shuxing-lab-web-before-scenegame-20261121_143638.tgz`

更早（墨滴性能版，12:22）：

- 目录：`/opt/shuxing-lab/web.pre-inkperf-20261121_122233`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkperf-20261121_122233.tgz`

更早（缓存破壁版，11:51）：

- 目录：`/opt/shuxing-lab/web.pre-cachebust-20261121_115122`
- 压缩包：`/root/backups/shuxing-lab-web-before-cachebust-20261121_115122.tgz`

更早（墨滴外扩版，11:23）：

- 目录：`/opt/shuxing-lab/web.pre-inkmargin-20261121_113454`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkmargin-20261121_113454.tgz`

更早（柔化墨滴版，10:21）：

- 目录：`/opt/shuxing-lab/web.pre-inkpad-20261121_112327`
- 压缩包：`/root/backups/shuxing-lab-web-before-inkpad-20261121_112327.tgz`

更早（大幅墨滴版，23:09）：

- 目录：`/opt/shuxing-lab/web.pre-inksoft-20261121_102154`
- 压缩包：`/root/backups/shuxing-lab-web-before-inksoft-20261121_102154.tgz`

更早（墨滴文字版，22:39）：

- 目录：`/opt/shuxing-lab/web.pre-bigink-20261120_230922`
- 压缩包：`/root/backups/shuxing-lab-web-before-bigink-20261120_230922.tgz`

更早（切换常驻版，22:22）：

- 目录：`/opt/shuxing-lab/web.pre-inktext-20261120_223944`
- 压缩包：`/root/backups/shuxing-lab-web-before-inktext-20261120_223944.tgz`

更早（方叉变换版，21:57）：

- 目录：`/opt/shuxing-lab/web.pre-keepcta-20261120_222251`
- 压缩包：`/root/backups/shuxing-lab-web-before-keepcta-20261120_222251.tgz`

更早（图标形状变换版，20:20）：

- 目录：`/opt/shuxing-lab/web.pre-squarex-20261120_215757`
- 压缩包：`/root/backups/shuxing-lab-web-before-squarex-20261120_215757.tgz`

更早（图标悬停形变版，19:47）：

- 目录：`/opt/shuxing-lab/web.pre-iconmorph-20261120_202007`
- 压缩包：`/root/backups/shuxing-lab-web-before-iconmorph-20261120_202007.tgz`

更早（Lucide 图标版，19:17）：

- 目录：`/opt/shuxing-lab/web.pre-iconwarp-20261120_194710`
- 压缩包：`/root/backups/shuxing-lab-web-before-iconwarp-20261120_194710.tgz`

更早（图标按钮版，18:55）：

- 目录：`/opt/shuxing-lab/web.pre-lucide-20261120_191735`
- 压缩包：`/root/backups/shuxing-lab-web-before-lucide-20261120_191735.tgz`

更早（开局按钮精简版）：

- 目录：`/opt/shuxing-lab/web.pre-iconcta-20261120_185534`
- 压缩包：`/root/backups/shuxing-lab-web-before-iconcta-20261120_185534.tgz`

更早（成线收尾版）：

- 目录：`/opt/shuxing-lab/web.pre-cta-20261120_184055`
- 压缩包：`/root/backups/shuxing-lab-web-before-cta-20261120_184055.tgz`

更早（成线过渡初版，17:51）：

- 目录：`/opt/shuxing-lab/web.pre-linefix2-20261120_180006`
- 压缩包：`/root/backups/shuxing-lab-web-before-linefix2-20261120_180006.tgz`

更早（蓄力回弹版）：

- 目录：`/opt/shuxing-lab/web.pre-linefix-20261120_175101`
- 压缩包：`/root/backups/shuxing-lab-web-before-linefix-20261120_175101.tgz`

更早（慢速压缩成线版）：

- 目录：`/opt/shuxing-lab/web.pre-impact-20261120_173451`
- 压缩包：`/root/backups/shuxing-lab-web-before-impact-20261120_173451.tgz`

更早（阻尼与签名行稳定版）：

- 目录：`/opt/shuxing-lab/web.pre-slowmorph-20261120_171851`
- 压缩包：`/root/backups/shuxing-lab-web-before-slowmorph-20261120_171851.tgz`

更早（顶部精简 + 签名行版）：

- 目录：`/opt/shuxing-lab/web.pre-damp-20261120_163831`
- 压缩包：`/root/backups/shuxing-lab-web-before-damp-20261120_163831.tgz`

更早（墨色视觉层次版）：

- 目录：`/opt/shuxing-lab/web.pre-sign-20261120_162115`
- 压缩包：`/root/backups/shuxing-lab-web-before-sign-20261120_162115.tgz`

更早（开场形变版）：

- 目录：`/opt/shuxing-lab/web.pre-ink-20261120_154021`
- 压缩包：`/root/backups/shuxing-lab-web-before-ink-20261120_154021.tgz`

更早（开场形变 + 轮换提示语版）：

- 目录：`/opt/shuxing-lab/web.pre-intro-20261120_151222`
- 压缩包：`/root/backups/shuxing-lab-web-before-intro-20261120_151222.tgz`

更早（结局重写版）的部署前备份：

- 目录：`/opt/shuxing-lab/web.pre-typewriter-20261120_143451`
- 压缩包：`/root/backups/shuxing-lab-web-before-typewriter-20261120_143451.tgz`

上一版（动画修复版）备份：

- 目录：`/opt/shuxing-lab/web.animfix-20261120_103020`
- 压缩包：`/root/backups/shuxing-lab-web-before-animfix-20261120_103020.tgz`

更早的深色版备份：

- `/opt/shuxing-lab/web.dark-20261120_093507`

回滚示例（未获授权不要执行）：

```bash
cd /opt/shuxing-lab
mv web web.failed-$(date +%Y%m%d_%H%M%S)
mv web.pre-longform-20261121_171527 web
```

静态目录切换后无需 reload Nginx。

部署注意：

- 只发布静态文件：`index.html`、`styles.css`、`js/`、`vendor/`、`assets/`（肖像）。
- 每次发布递增 `index.html` 中 `styles.css` 与 `js/*.js` 的 `?v=` 版本号，避免用户浏览器缓存旧脚本导致“改了没生效”。
- 部署前先创建新的目录备份和 tar 备份。
- 上传后先比对本地、暂存区、线上文件的 SHA-256，再切换。
- 只同步静态站点目录，不改 Nginx 配置、不改 `/api/ai/ask` 代理、不动 `shuxing-ai` 服务。
- 不要把 SSH 私钥、API 密钥或服务端环境变量写进前端、仓库或交接文档。
- 不要修改或清理 `D:\Astroswarm\shuxing-lab`。
- 用户已授权后续改动直接部署（2026-11-20）；仍须完成备份、SHA-256 比对和线上验收。不重启服务、不删除备份，除非用户明确要求。

## 7. 当前文件哈希

本地 SHA-256：

```text
index.html          b488bfb4bf1a2f7ed603e992bfb84d7550cb46d01953e3fbed2df0cd9c3875e7
styles.css          f1f5c4f85717d0b349ffe1d1f1bb3034dd507e138a579a7a612664ed28f61267
js/data.js          ef4bf0fb0eb4d7fd6d6a8fcd140bae729e0cdb3391b23811dc7e044dc863d83a
js/app.js           6ec659da4b8917b464e5acab20a3a5efbec173fed3b6ebba7b4241e6242f61ec
js/scene-art.js     ba03c2a85ffa15e779d639d2967d372aa19b80977bcbfb19a76be07cc7d7799b
js/engine.js        451d360c0bc22f8a9aa050ba83bccfad6c0ce3918a5ac34a7711afed87a89abd
js/atmosphere.js c1875db0de9be8ac835bb4e4a1294eed4e1e640690ff05801b0deddfde2a0c0f
js/plot.js          66c6e4388c38e2c398c9c5313c45c3bb7f49213c9896134b0f308a21beed53f1
assets/portrait-1.jpg  57c189023b160c02f526a2a29daeee2ee0da0d163d23e9500d44e942f721ceba
assets/portrait-2.jpg  52ad05a4ffcc766d860a0ebbedfa2160d528a0610db20210a5cd04bc1b7c85e2
assets/portrait-s3.jpg cd74d88b62652a0e9cb873165615f7638ee76f57be2e4a526f6dbe8c2eb90734
assets/portrait-s4.jpg 24a8649b52553df118bfce92b741dee89455344b1a3ea31da80f024738ffbcaa
assets/portrait-s5.jpg dcafd0436884d988dd18a7da6a967925ffb47795f29e0c4a8f2ec3e5bdacafb2
assets/portrait-s6.jpg 16ccfe70947fb01cd133b71507083e216af7bbbdb5a6a9972ef2b3ed9d57324a
assets/portrait-s7.jpg 9dcecd10c33f34d11f74a9a2fc07f6ba030da87256aea4ed024755ad3fe7b140
assets/portrait-s8.jpg aba165893fc25d9879c84c25d395a6a9051eddaec9b5250d385e601a9762b9c1
```

以上哈希与线上 `/opt/shuxing-lab/web` 完全一致（2026-11-23 15:04 部署，资源版本号 `?v=20261124b`）。本版：30 幕剧情、30 个累积结局与 30 个形状模板、物体选项列表、拉近转场、进场提速、结局公式重写。

## 8. 建议的下一位 AI 阅读顺序

1. 本文件。
2. `js/data.js` 的 `endings`、`axisReading`，以及 `interludes`、`chats`、`beats`。
3. `js/app.js` 的 `buildEndingScene`、`fillEndingScene`、`setupEnding`、`typeCharacters`、`handlePlotDrawn`；开场部分看 `updateIntroMotion`、`idleRadii`、`currentCirclePoints`、`drawCompress`、`drawMorph`、`startHint`、`hintStep`、`startSignature`、`signStep`、`signatureDebug`；长流程看 `buildBeat`、`goNextBeat`、`buildChatScene`、`playChat`、`buildInterludeScene`。
4. `js/plot.js` 的 `notifyDrawComplete`、`start`、`loop`、`debug`。
5. `js/scene-art.js` 的 `FAREWELL_ART`（八题场景线稿）；`js/app.js` 的 `buildGameScene`、`typeSceneQuestion`。
6. `styles.css` 中 `.ending-text`、`.ending-type-layer`、`.axis-reading`、`.principle-*`，以及 `.chat-*`、`.interlude-*`。
7. `tests/animation-qa.js` 的 `playPath` 与 `advanceBeats`。

本次部署已完成。用户已授权此后改动直接部署，但第 6 节的备份、哈希比对与线上验收流程保持不变。如果用户还要继续改文案，先遵守第 4.1 节的克制语气，不要改动引擎和结局判定。八景肖像已补齐（第 4.11 节）；`PORTRAIT-BRIEF.md` 里保留了生图清单与提示词，若要重做某一张可直接复用，替换时同样需要烘焙顶部溶解与接缝留白。
