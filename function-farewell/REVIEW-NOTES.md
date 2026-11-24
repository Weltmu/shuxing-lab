# 源码复核说明 · 《函数式告别》

> 这份压缩包用于外部代码复核（MuseAI）。下面说明结构、运行方式、已知问题，以及哪些内容不在包里。

## 1. 这是什么

一个**纯静态**的中文叙事网页游戏：30 幕选择题 → 累积计算函数信号 → 30 种结局之一 → 可调用后端生成一篇只属于这一局的小说。

- 线上地址：`https://math.astroswarm.cn/`
- 无构建工具：浏览器直接加载 `index.html` + `js/*.js`，全部是 `<script>` 全局脚本
- 后端只有一个很小的 Python 代理（`server/novel-api.py`），把小说生成请求转发给模型 API，密钥只存在服务器环境变量里

## 2. 目录与文件职责

```
index.html          页面骨架，按顺序加载 js
styles.css          全部样式（约 2.4k 行）：排版、线稿场景层、转场、移动端
js/
  data.js           基础数据：函数、开场、间章、聊天、旧版 18 幕、旧结局
  data30.js         30 幕版本装配：把 story30/endings30 组装成 DATA，覆盖 Engine.classify
  story30.js        30 幕正文与 90 个选项（每题 3 选，每题带 signal {t,h,a}）
  endings30.js      30 个结局文本 + 图形模板（5 形态 × 3 诚实度 × 2 主动性）
  engine.js         判定引擎、累积函数、状态机
  plot.js           Canvas 绘图（函数曲线、形状、开场动画）
  atmosphere.js     背景笔触/纸张氛围层
  scene-art.js      早期线稿素材（本版主要被 scene30 覆盖）
  sketch.js         手绘笔触生成器：双频噪声抖动 + 两遍描边，输出 SVG 路径
  scene30.js        30 幕各自的场景构图 + 37 个手绘物件图标 + 落地投影
  fg-layer.js       前景"浅色透视线条层"（桌面/地面 + 花、手机等装饰）
  stage-art.js      上一版 6 套舞台（被 scene30 覆盖，保留兼容）
  sfx.js            Web Audio 合成音效（干声短音，无外部音频文件）
  app.js            交互总控：场景构建、选项、转场、聊天、结局、小说流式渲染
server/
  novel-api.py      小说生成代理（Python 标准库，SSE 流式转发，systemd 常驻）
  novel-api.js      早期 Node 版本（服务器无 Node，未使用）
vendor/             KaTeX + math.js（本地化，避免外链）
docs/
  portraits-30.md   30 幕人物图生成规格与提示词
tests/
  content-test.js   30 幕内容与判定检查（结构、伏笔引用、结局唯一性、图形生成）
  animation-qa.js   无头浏览器全流程验收（30 幕选择、转场、手机、结局）
  serve.js          本地静态服务器
HANDOFF.md          开发交接文档（部署、改动历史、已知问题）
AI_HANDOFF.md       同上，AI 协作用的技术版
PORTRAIT-BRIEF.md   人物/场景美术要求
```

## 3. 本地运行

```bash
# 任选其一
node tests/serve.js 4173      # http://127.0.0.1:4173/
python -m http.server 4173    # 同上
```

不需要 npm install，没有构建步骤。

注意：本地没有 `/api/novel`，点击「生成属于我的小说」会走**失败兜底**（直接显示预写结局正文），这是预期行为。

## 4. 核心机制（复核重点）

### 4.1 判定：累积函数
- 30 幕里每幕 3 个选项，每个选项带 `signal: {t, h, a}`（各为 -1/0/+1）
- 一局结束把 30 个信号求和，再**去均值**（减去该维度均值 × 30）
- 分别分桶：`T` 5 桶（阈值 ±2、±6）、`H` 3 桶（阈值 1）、`A` 2 桶（≥0）
- 5 × 3 × 2 = **30 个结局**，每个结局对应一个固定图形模板
- 好结局 `e30 同行 / 完整的心` 固定在最优桶；冷淡玩法会落到 `e01 两不相欠`
- 相关代码：`js/data30.js`（`Engine.classify` 覆盖）、`js/endings30.js`（`shapes`）

### 4.2 场景线稿：纯代码生成
- `js/sketch.js`：`ink()` 对点列做双频噪声抖动、二次贝塞尔平滑、两遍描边（第二遍更细更淡），得到"手绘"质感
- `js/scene30.js`：30 幕各有一套环境构图（公园/咖啡馆/站台/天台/房间/街道等）和 3 个物件图标；每个图标底部带排线投影
- `js/fg-layer.js`：叠在人物像前面的**浅色**透视线条层（桌面/地面 + 花、手机、杯垫等装饰），与深色可点物件形成层次
- 层次：背景线稿 z=0 → 人物像 z=1 → 前景浅线 z=2 → 可点物件 z=3

### 4.3 转场（`js/app.js` 的 `playZoom`）
1. 其它内容（正文、其它选项、背景、人物）按"从屏幕中心向外"的方向飞出并淡出（0.66s）
2. 选中的物件留在原地，约 0.7s 后自己淡出（0.44s）
3. 下一幕以 `zoomFloatIn` 动画淡入飞入（1.15s）

关键点：选项自带 `animation: optionIn ... both`，必须先 `animation:none` 才能让内联 opacity/transform 生效；同帧写 transition+transform 会被浏览器合批，需要 `void el.offsetWidth` 强制落盘。

### 4.4 音效（`js/sfx.js`）
- Web Audio 加法合成，无外部音频文件；干声、短音（0.01–0.3s），无混响、无背景乐
- 事件：`seed`（开场黑圈）/`circle`/`triangle`（两个形状按钮）/`hover`/`select`/`tick`（函数累积按音阶上行）/`whoosh`（飞出）/`enter`（入画）/`page`/`notify`（手机来消息）/`send`（发出消息）/`phone`（进入对话）/`chime`（结局）
- 右下角 ♪ 开关，状态存 localStorage

### 4.5 小说生成（`server/novel-api.py` + `js/app.js` 尾部）
- 前端 POST `/api/novel`，body 是这一局的结局与 30 次选择
- 后端以 SSE 转发模型流：`{"type":"thinking"}` / `{"type":"delta","text"}` / `{"type":"done"}`
- 模型：`nvidia/nemotron-3.5-lightning-30b-a3b`，带 `reasoning_effort: "none"`（避免长思考），目标 2200 字；失败自动回退 `stepfun-ai/step-5-preview`
- 实测：完整一篇约 25 秒（1927 段流式增量）
- 密钥只在服务器 `/etc/shuxing-lab/novel.env`（600），仓库与前端均无

## 5. 已知问题 / 可复核项

1. **场景美术是代码绘制的**：构图与透视仍偏简单，个别场景物件比例可以更好；这是持续迭代项
2. **`stage-art.js` 与 `scene-art.js` 是历史遗留**：`scene30.js` 在最后覆盖 30 幕，前两者只在极少数旧路径用到，可考虑清理
3. **验收脚本未完全同步**：`tests/animation-qa.js` 有 2 项断言（顶栏状态文案、减少动态效果叠层）与最新交互不完全一致，其余 190+ 项通过
4. **手机对话的 `notify`/`send` 音效**：代码已挂接，但自动化脚本通过聊天场景过快，未在自动化里观察到，需人工确认
5. **`data.js` 里保留旧版 18 幕数据**，30 幕版本通过 `data30.js` 覆盖；两套并存，可考虑清理

## 6. 不在压缩包里的内容

- `assets/`：人物肖像与图片素材（约 10 MB），属于素材而非代码；如需可单独提供
- `tests/shots*/`：验收截图（约 20 MB）
- `tests/*.log`：历史验收日志
- 服务器私钥、API 密钥、systemd 单元文件、nginx 配置（属于部署环境，不随源码分发）

部署侧信息（供参考，不含密钥）：阿里云 ECS + Nginx 静态站点，目录 `/opt/shuxing-lab/web`；小说代理为 systemd 服务 `novel-api`，只监听 `127.0.0.1:8891`，由 Nginx `location = /api/novel` 反代。
