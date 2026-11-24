# 函数式告别 · 给下一位 AI 的完整交接

最后更新：2026-11-21（服务器时间 18:27 部署完成）

这份文档面向“完全没有参与过本项目”的 AI。它包含：项目现状、已完成工作、锁定规则、开发/测试/部署工作流、本次会话用过的 Skill、常见坑，以及剩余待办。更细的历史变更记录见同目录的 `HANDOFF.md`；两份都读最好，时间紧时先读本文件。

---

## 0. 一句话现状

《函数式告别》是一个无构建步骤的黑白静态叙事网站。当前线上版本是 **30 幕长流程版**：30 个场景（每幕两段约 150 字叙事）、90 个带信号的选择、30 个由累计信号决定的结局（温度 5 档 × 坦诚 3 档 × 主动 2 档），每个结局配一个专属形状模板；选项全端为「物件 + 文字标签」列表，点选后有约 0.5 秒的拉近转场。内容测试 PASS，动画验收本地与线上均 **195 项 0 失败**。

- 线上：https://math.astroswarm.cn/
- 当前资源版本：`?v=20261124f`
- 本地源码：`D:\Astroswarm\function-farewell-mono`
- 线上目录：`/opt/shuxing-lab/web`
- 服务器：`root@112.124.11.144`（SSH 私钥由用户保管，不写入本文件）
- 部署前备份：`/opt/shuxing-lab/web.pre-final30-20261123_150450`
- 备份压缩包：`/root/backups/shuxing-lab-web-before-final30-20261123_150450.tgz`

---

## 1. 当前已完成的功能

### 1.1 开场

- 240 点采样的黑点，半径 90px；鼠标靠近时只朝指针一侧局部凸起（上限 26px），背侧保持正圆。
- 凸起经过二阶临界阻尼弹簧（ω=6.5），快速划过会滞后回落；手机触摸有临时凸起。
- 黑点有柔边、墨晕、落影；在离屏小画布合成，避免整屏 blur 掉帧。
- 提示语 8 句轮换，逐字打出/收回，始终中心对称；下面是等宽签名行，逐字错峰溶解轮换。
- 点击后：蓄力/急压/回弹 700ms → 90ms 停顿 → 950ms 曲线生长；压缩末段交叉淡化为真正的 3px 圆头直线。
- 开局结果区两个 Lucide 线性图标按钮：circle 悬停变圆角正方形，triangle 悬停变叉；切换开局时按钮常驻。
- 开局文字由墨团铺满后显影：文字区切 2 行网格、每格一团大墨并抖动重叠，正文区覆盖率约 99%（验收按 alpha>128 要求 ≥80%）；破碎毛细边缘、飞溅拖尾、向中心汇聚消失；文字在墨后分级淡入。
- 点圆形按钮后先进**序章**页再进第一题：`DATA.prologue` 三段背景（公园相识 → 借笔相熟 → 毕业走远），复用间章卡片样式，继续按钮走 `beginFirstBeat()`。序章不计入 17 节拍、不写 `state.funcs`。

### 1.2 八道计分题

- 8 个互不重复的线描场景：公园长椅、咖啡馆、地铁站、海边、深夜房间、雨街、车站、天台。
- 每题题面为**两段背景 + 一句具体追问**：第一段交代场景与关系，第二段给出当下的触发与冲突；三个选项分别是同一问题的三种答法。阅读栏 340px、题干字号上限 22px（460px / 26px 会让文字和题干压到人物脸上）。改文案见 `HANDOFF.md` 4.9。
- 每题 3 个线描物件作为选项热点；桌面悬停时物件淡出、选项文字浮现；手机退化为静态列表。
- 题目逐字打出（每个字带淡入+去模糊+上浮），选项文字柔和浮现。
- 场景人物为铅笔肖像，已做到“每景一张”：s1 `portrait-1.jpg`、s2 `portrait-2.jpg`、s3–s8 `portrait-s3.jpg`–`portrait-s8.jpg`，统一按 0.62 倍取景裁成胸像，羽化边缘融入白底。
- 8 题的选项顺序、`fn` 映射和结局算法全部锁定，未改动。

### 1.3 长流程（本次新增）

17 个节拍，顺序固定：

```text
s1 → n1 → s2 → c1 → s3 → n2 → s4 → n3 → s5 → c2 → n4 → s6 → n5 → s7 → c3 → n6 → s8
```

- 6 段叙事间章（不计分）：走回家的路、车厢的最后一排、风从海上来、天亮之前、没有发出去的那句、回来的路。
- 3 段手机聊天（不计分）：联系人「见微」，分别发生在深夜 23:47、两周后凌晨 01:12、她离开的那天 21:05。
- 聊天交互：手机框（真机比例，高度 `min(660px, 100vh-200px)`、宽 = 高 × 0.47）、日期行、逐字气泡、三点“正在输入”、3 个回复按钮；选择后回复区折叠，自己的黑色气泡出现，随后打出**这条回复自己的两条后续**（`replies[].after`），最后显示“继续”。
- 间章与聊天页脚贴底；手机端间章线稿降为 18%、卡片至少 58vh；聊天日志底部对齐；reduced-motion 下聊天内容直接完整显示。
- 数据位置：
  - `js/data.js` 的 `interludes`（6 段）
  - `js/data.js` 的 `chats`（3 段）
  - `js/data.js` 的 `beats`（17 项）
- 流程实现：
  - `js/app.js` 的 `buildBeat`、`goNextBeat`、`buildInterludeScene`、`buildChatScene`、`playChat`
  - `choose` 之后 180ms 调 `goNextBeat(true)` 自动推进；`transitionTo` 自身防重入。
  - “继续”按钮调 `goNextBeat()`，受 `isLocked()` 保护。

### 1.4 结局

- 六种结局、判定优先级和采样参数全部锁定。
- 结局顺序：标题 → F(x) 图 → 图下 x/y 说明 → 正文 → 完整公式 → 八次选择 → 一句原理 → 分享卡。
- 曲线画完后正文逐字显示；正文完成后原理逐字显示；原理完成后至少保留 2.8s 再收束成点。
- 文案语气克制，避免“必然/永远/注定”等绝对因果。

---

## 2. 文件地图

| 文件 | 职责 | 是否可改 |
|---|---|---|
| `index.html` | 页面骨架、资源引用、`?v=` 版本号 | 谨慎，改版本号即可 |
| `styles.css` | 全部视觉、响应式、动效、聊天/间章样式 | 可改 |
| `js/data.js` | 函数、开局、8 题、6 结局、6 间章、3 聊天、17 节拍 | 可改内容，顺序锁定 |
| `js/engine.js` | F(x) 求和、六结局判定 | **锁定逻辑，不要改** |
| `js/app.js` | 开场、流程、节拍、聊天、间章、结局挂载、逐字动画 | 可改，改动需跑全量验收 |
| `js/scene-art.js` | 8 个场景的 SVG 线稿、肖像配置、24 个选项物件 | 可改 |
| `js/atmosphere.js` | 背景 F(x) 单曲线 | 不改 |
| `js/plot.js` | 结局函数图、缩放、收束、分享卡 | 不改 |
| `vendor/katex/`、`vendor/mathjs/` | 本地依赖 | 不改，不要改 CDN |
| `assets/portrait-1/2.jpg`、`portrait-s3..s8.jpg` | 八张场景肖像（每景一张） | 待替换时须重做溶解 |
| `tests/content-test.js` | 内容、结构与 6561 条路径 | 改动数据后同步 |
| `tests/animation-qa.js` | Chrome CDP 全流程验收、截图 | 改 UI/流程后同步 |
| `tests/serve.js` | 本地静态服务器 | 不改 |
| `tests/shots-anim/` | 最近一次验收截图 | 可重生成 |
| `HANDOFF.md` | 历史交接与部署记录 | 每次部署后更新 |
| `AI_HANDOFF.md` | 本文件 | 交接时更新 |

项目**不是 git 仓库**，没有 `package.json`，没有打包流程。不要自行初始化仓库或引入框架，除非用户明确要求。

---

## 3. 锁定规则（最重要）

违反这些规则会破坏已有的 6561 条路径验证或既定的设计语言：

1. 恰好 8 道计分题，每题恰好 3 个选项。
2. 恰好 15 个函数；每个选项的 `fn` 映射固定（s1 `[f8,f3,f1]` … s8 `[f10,f3,f7]`）。
3. F(x) = 8 次选择对应函数的直接相加，不加权重。
4. 结局判定：采样 101 点，`x ∈ [0,10]`，步长 0.1；优先级为 间断 > 渐近 > 指数衰减 > 正弦 > 抛物线 > 对数。
5. 结局图：视野 `x [0,10]`、`y [-6,6]`；y 刻度 `-6,-4,-2,0,2,4,6`；采样 401 点、步长 0.025；含 `1/x` 时从 `x=0.1` 开始。
6. 长流程固定 17 节拍，顺序见上；间章与聊天不得写入 `state.funcs`，不得影响结局。第一题之前固定有**序章**（`DATA.prologue`，三段背景），序章不是节拍、不写 `state.funcs`；从序章进第一题必须用 `beginFirstBeat()`，不能用 `goNextBeat()`（会从 beat 0 跳到 beat 1，跳过 s1）。
7. 每段间章必须有标题与两段正文，复用对应场景线稿；不得再手绘人物。
8. 每段聊天必须有 2 条来信、3 个回复，且每条回复各带自己的 2 条后续（`replies[].after`，不得共用固定后续）；回复后回复区折叠；气泡逐字打出（reduced-motion 除外）。
9. 纯白背景、纯黑前景；标题/正文 Noto Serif SC，交互 Noto Sans SC；禁止彩色渐变、大面积毛玻璃、悬浮 toast。
10. 开场、墨滴、图标、题面交互的既定细节见 `HANDOFF.md` 第 5 节，不得回退成旧实现。
11. 改动后必须跑内容测试与动画验收，并检查桌面/手机截图。

---

## 4. 日常工作流

### 4.1 启动本地服务

```bash
cd /d/Astroswarm/function-farewell-mono
node tests/serve.js 4173
```

打开 `http://127.0.0.1:4173/`。如果端口占用，换 4174 并设置 `QA_BASE`。

### 4.2 修改前先读

1. `AI_HANDOFF.md`（本文件）
2. `HANDOFF.md`
3. 需要改数据：`js/data.js`
4. 需要改流程/交互：`js/app.js`
5. 需要改视觉：`styles.css` + `js/scene-art.js`
6. 需要改验收：`tests/animation-qa.js`

### 4.3 跑测试

```bash
node tests/content-test.js
node tests/animation-qa.js
```

- 内容测试：函数、开局、8 题、结局文案、17 节拍结构、6561 条路径。
- 动画验收：Chrome headless + 原生 CDP（端口 9334），覆盖桌面六结局、手机、reduced-motion、开场、墨滴、图标、线描场景、聊天/间章。
- 默认 Chrome：`C:/Program Files/Google/Chrome/Application/chrome.exe`；不同则设 `CHROME_PATH`。
- 线上验收：`QA_BASE=https://math.astroswarm.cn/ node tests/animation-qa.js`
- 截图输出：`tests/shots-anim/`。重点看 `desktop-scene-*`、`desktop-interlude.png`、`desktop-chat*.png`、`mobile-chat*.png`、`mobile-interlude.png`、`desktop-ending-*`。

当前基线：**259 项检查，0 失败**。任何新增检查都会改变这个数字，更新 `HANDOFF.md` 第 4.4 节。

### 4.4 测试常见坑

- **残留 Chrome**：验收脚本占用 9334。若上一次异常退出，先结束带 `remote-debugging-port=9334` 或 `farewell-anim-qa` 的 Chrome，再跑。
- **本地服务掉线**：每轮开始前 `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4173/`，不是 200 就重启。
- **缓存**：同一 Chrome 会话内重复加载同一 URL 会命中缓存。改动资源后，正式验收要新开浏览器；线上发布要递增 `?v=`。
- **字体网络噪声**：`fonts.googleapis.com` / `gstatic.com` 的连接失败属环境噪声，验收已过滤；不要把它算成应用异常。
- **reduced-motion**：聊天的 `showReplies` 在节点尚未挂载时也会被调用，不要加 `isConnected` 提前返回，否则回复按钮永远不出现。
- **自动推进**：选择后的自动推进必须绕过点击锁（`goNextBeat(true)`）；按钮触发的推进仍然受锁保护。
- **文案与分支无关**：间章是固定节拍，不能写“你坐在最后一排”这类与玩家选项冲突的句子。

---

## 5. 部署工作流

> 用户已授权：改动完成后直接部署，无需逐次确认（2026-11-20）。但以下备份、比对、验收步骤不能省。删除备份、修改 Nginx、重启服务等破坏性操作仍需单独确认。

### 5.1 发布前

1. 跑 `node tests/content-test.js` 和 `node tests/animation-qa.js`，0 失败。
2. 检查桌面/手机截图。
3. 递增 `index.html` 中 `styles.css`、`js/*.js` 的 `?v=`（例如 `20261121k` → `20261121l`）。肖像图片的 `?v=` 若有更新也要递增。
4. 计算核心文件 SHA-256。

### 5.2 打包上传

只发布以下内容：`index.html`、`styles.css`、`js/`、`vendor/`、`assets/`。不要把 `tests/`、`HANDOFF.md`、`AI_HANDOFF.md` 发布上去。

```bash
TS=$(date +%Y%m%d_%H%M%S)
tar czf /tmp/farewell-$TS.tgz index.html styles.css js vendor assets
scp -i <用户提供的密钥> /tmp/farewell-$TS.tgz root@112.124.11.144:/tmp/
```

服务器上：

```bash
mkdir -p /opt/shuxing-lab/web.next-$TS
tar xzf /tmp/farewell-$TS.tgz -C /opt/shuxing-lab/web.next-$TS
```

### 5.3 哈希比对（有格式坑）

Windows Git Bash 的 `sha256sum` 输出是 `hash *path`，服务器是 `hash  path`，且本地清单可能带 CRLF。必须先规范化再 diff：

```bash
# 本地
{ find index.html styles.css js vendor assets -type f | sort | while read f; do sha256sum "$f"; done; } | tr -d '\r' > /tmp/local-manifest-$TS.txt
# 服务器暂存区
cd /opt/shuxing-lab/web.next-$TS
find index.html styles.css js vendor assets -type f | sort | while read f; do sha256sum "$f"; done > /tmp/staging-manifest-$TS.txt
# 规范化后比较
sed 's/ \*/  /' /tmp/local-manifest-$TS.txt | LC_ALL=C sort -k2 > /tmp/lm.norm
sed 's/ \*/  /' /tmp/staging-manifest-$TS.txt | LC_ALL=C sort -k2 > /tmp/sm.norm
diff /tmp/lm.norm /tmp/sm.norm && echo MANIFEST_MATCH
```

### 5.4 备份与切换

```bash
cd /opt/shuxing-lab
tar czf /root/backups/shuxing-lab-web-before-<name>-$TS.tgz web
mv web web.pre-<name>-$TS
mv web.next-$TS web
```

本次发布示例（已完成，聊天与选项修正版）：

- 目录：`/opt/shuxing-lab/web.pre-chatfix-20261122_105655`
- 压缩包：`/root/backups/shuxing-lab-web-before-chatfix-20261122_105655.tgz`
- 切换时间：2026-11-22 10:56（服务器时间）
- 未改 Nginx、未重启服务。

### 5.5 线上确认

```bash
for f in index.html styles.css js/data.js js/app.js js/scene-art.js; do
  printf '%s  ' "$f"
  curl -s "https://math.astroswarm.cn/$f" | sha256sum | cut -d' ' -f1
done
```

与本地哈希一致后，跑线上验收：

```bash
QA_BASE=https://math.astroswarm.cn/ node tests/animation-qa.js
```

最后更新 `HANDOFF.md` 的：部署时间、备份路径、文件哈希、验收数字。

### 5.6 回滚示例（未授权不要执行）

```bash
cd /opt/shuxing-lab
mv web web.failed-$(date +%Y%m%d_%H%M%S)
mv web.pre-longform-20261121_171527 web
```

静态目录切换后不需要 reload Nginx。

### 5.7 安全约束

- 不修改 Nginx 配置、不改 `/api/ai/ask` 代理、不动 `shuxing-ai` 服务。
- 不把 SSH 私钥、API 密钥、服务端环境变量写进前端、文档或任何交付物。
- 不修改或清理 `D:\Astroswarm\shuxing-lab`。
- 不删除历史备份，除非用户明确要求。

---

## 6. 本次会话实际调用过的 Skill

### 6.1 `super-design-studio:graphic`（实际调用）

- 名称：`super-design-studio:graphic`
- 本地路径：
  `C:\Users\li\.qoder-cn\plugins\cache\qoder-marketplace\super-design-studio\1.0.0\skills\graphic\SKILL.md`
- 调用时的任务：为《函数式告别》设计八组极简黑白线描场景与 24 个选项物件（纯白底、纯黑线条、无填充、优雅留白）。
- 该 Skill 的作用：
  - 区分 SVG 路径（图标、线稿、几何图形）与 AI 生图路径（写实、复杂插画、纹理）。
  - 要求 SVG 路径干净、语义化、控制在合理行数，避免手绘抖动风。
  - 要求使用设计系统色板或 `currentColor`；本项目固定黑/白。
  - 使用前通常需要读取 `~/.qoderwork/plugins/config/super-design-studio/QODERWORK.md`；若该配置不存在或仍是占位符，Skill 会要求先做 onboarding。本项目不依赖该配置，实际交付也不依赖该 Skill 运行时。
- 实际产出方式：
  - 八组场景线稿没有走 AI 生图，而是由内置文件编辑工具直接写成内联 SVG，放在 `js/scene-art.js` 的 `window.FAREWELL_ART` 中。
  - 所有元素 `pathLength="1"`，CSS 用 `stroke-dasharray/stroke-dashoffset` 做描线入场。
  - 人物没有手绘，改用用户提供的铅笔肖像（栅格图），所以没有调用图像生成。
- 如果下一位 AI 继续画线稿：优先沿用 `js/scene-art.js` 的内联 SVG 结构和命名，不要再引入外部依赖或 AI 生图。

### 6.2 其他 Skill 的结论

- `imagegen`：未调用。项目需要的是“用户本人的铅笔肖像”和可代码控制的线稿，不适合生成陌生人脸或写实图。
- `qoder-canvas`、`office-*`、`presentations` 等：未调用，与本项目无关。
- 其余工作全部用内置工具完成：Read / Edit / Write / Bash / Grep / Glob、Node 脚本、Chrome CDP 验收。

---

## 7. 我的工作方式（下一位 AI 可复用）

1. **先读现状，再动代码**：读 `HANDOFF.md`、`js/data.js`、相关 `js/app.js` 函数，不凭印象修改。
2. **保持引擎锁定**：只改叙事/UI/数据，不改 `js/engine.js` 与结局判定参数。
3. **改完必跑两套测试**：内容测试 + 动画验收；桌面和手机截图都要看，不能只看断言。
4. **先本地、后线上**：本地 0 失败后才部署；部署后跑同一套线上验收。
5. **每次发布递增 `?v=`**：这是用户多次遇到“改了没生效”的根因。
6. **保留可回滚路径**：目录备份 + tar 备份 + 哈希清单，切换前比对。
7. **文案克制**：避免绝对因果；用“有些、可能、未必、不总是”。
8. **动效自然**：墨色、阻尼、留白；不要 3D 气泡、彩色渐变、模板化卡片。
9. **不要问用户已经确认过的事**：用户已确认“每景一张肖像”“插叙 + 手机聊天”“直接部署”。
10. **遇到流程卡住先找状态**：用页面内的 `window.__farewell.beatDebug()` / `introDebug()` / `endingDebug()` / `copyInkDebug()`，不要盲改。

---

## 8. 当前遗留工作

### 8.1 六景肖像（已完成，2026-11-21 18:27 上线）

s3–s8 的六张肖像已由用户用生图 AI 产出并接入，八景现在是“每景一张”：s1 `portrait-1.jpg`、s2 `portrait-2.jpg`、s3–s8 `portrait-s3.jpg`–`portrait-s8.jpg`。素材处理与参数见 `HANDOFF.md` 第 4.11 节，生图清单与提示词保留在 `PORTRAIT-BRIEF.md`。

要重做某一张时注意：新图必须与现有的是**同一位女生**（拿 `portrait-2.jpg` 或已上线的新图当参考图），且必须按 4.11 节的参数烘焙顶部溶解与接缝留白，否则头顶会出现硬边。以下原始要求保留作参考：

目前只有两张：`assets/portrait-1.jpg`、`assets/portrait-2.jpg`（1200×574），在 8 个场景里交替使用。其它 6 张需要用户提供，**不要用 AI 生成其他人脸替代**，否则会破坏“同一位女生”的身份连续性。

统一要求：

- 同一位女生、同一铅笔/素描质感、纯白背景、无文字水印。
- 3:2 或 4:5，长边 1200–1600px，半身/腰上构图，四周留白方便羽化。
- 文件名建议：`portrait-s3.jpg` … `portrait-s8.jpg`（或按场景命名）。

六个分镜：

1. 地铁站台：站台灯下，单边耳机，大衣与围巾（对应 s3）
2. 海边：赤脚提着鞋，回眸，头发被风吹乱（对应 s4）
3. 深夜书桌：台灯与手机微光，针织开衫，带倦意（对应 s5）
4. 雨街：伞下等红灯，侧影，雨丝（对应 s6）
5. 车站：行李箱旁回头，站台广播灯（对应 s7）
6. 天台：多年后，靠在栏杆边看城市夜色，平静而疲惫（对应 s8）

优先补：深夜书桌、车站、天台。收到图片后的接入步骤：

1. 把图片放进 `assets/`，必要时裁切/压缩到目标尺寸。
2. 打开 `js/scene-art.js` 的 `FAREWELL_ART`，把 s3–s8 的 `portrait.src` 换成新文件；按人脸位置微调 `spot` 与 `focus`。
3. 给新图片加 `?v=` 查询串，并递增 `index.html` 中所有资源的版本号。
4. 跑内容测试 + 动画验收，重点看 `desktop-scene-*` 与手机端肖像透明度。
5. 按第 5 节流程部署，并更新 `HANDOFF.md` / `AI_HANDOFF.md`。

### 8.2 可选后续

- 继续扩写聊天内容（每条仍保持 2 来信 + 3 回复 + 2 后续）。
- 增加更多间章，但必须同步更新 17 节拍结构与内容测试。
- 给聊天加入更细的“对方正在输入”文案或时间分隔，但不要引入彩色/毛玻璃。
- 若用户明确要求增加计分题，必须重写结局算法与 6561 条路径验证，风险很高，先与用户确认。

---

## 9. 当前文件哈希（与线上一致）

```text
index.html          c66ad8ac46a7ff5cfb9fff6dd224ffb638b7f52fa10a4f9d95d96eaa1a81db89
styles.css          c34a9ce7bad092f8d62cd9cb4547a799b87f45015cdd5836d7412269d4c44d78
js/data.js          ef4bf0fb0eb4d7fd6d6a8fcd140bae729e0cdb3391b23811dc7e044dc863d83a
js/app.js           cb3ea006194fb0ffbcba4ff575c6b5e7e0ec06e0b67e33fbfee5517a3902d58a
js/scene-art.js     ba03c2a85ffa15e779d639d2967d372aa19b80977bcbfb19a76be07cc7d7799b
js/scene-art.js 1b05e5e084961863e203bcb7e63e2d94b7eab7e96a8e38261d30d7c9c53e6ef9
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

线上 `/opt/shuxing-lab/web` 与此一致（2026-11-23 16:39 部署，`?v=20261124f`）。后端：systemd `novel-api`（/opt/shuxing-lab/novel-api/novel-api.py，127.0.0.1:8891），密钥在 /etc/shuxing-lab/novel.env（600），Nginx `location = /api/novel` 反代，NVIDIA 模型 stepfun-ai/step-5-preview。。

---

## 10. 给下一位 AI 的起始提示词（可直接粘贴）

```text
你在接手《函数式告别》静态站点，源码在 D:\Astroswarm\function-farewell-mono，
线上是 https://math.astroswarm.cn/。

请先完整阅读：
1. D:\Astroswarm\function-farewell-mono\AI_HANDOFF.md
2. D:\Astroswarm\function-farewell-mono\HANDOFF.md

然后阅读 js/data.js 的 interludes / chats / beats / endings，
以及 js/app.js 的 buildBeat、goNextBeat、buildChatScene、playChat、
buildInterludeScene、buildGameScene。

当前状态：序章 + 12 题 + 9 个形状结局已上线，v=20261122a，242 项验收 0 失败。
不要改 js/engine.js、8 题选项映射、结局判定和 F(x) 算法。
肖像已做到“每景一张”，并统一裁成胸像（0.62 倍取景）；替换素材时必须先按同样取景重裁，再烘焙顶部溶解与接缝留白（HANDOFF 第 4.11 节）。

修改后必须：
node tests/content-test.js
node tests/animation-qa.js
桌面和手机截图都要看。0 失败后再按 AI_HANDOFF.md 第 5 节部署。
每次发布递增 index.html 的 ?v=。
```