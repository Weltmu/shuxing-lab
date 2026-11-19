# 数形实验室 · SHUXING LAB

输入一个函数，拖动探针，在同一张图上观察极限、导数、泰勒展开与积分。

纯静态前端项目：无后端、无构建步骤、无需登录。

## 功能

- **极限**：探针可拖动，左右逼近按钮逐次靠近 a（不会停在 a 上），显示 f(x)、极限值 L、探针距离与差值。
- **推导过程**：页面下方按当前模式展开步骤——极限双侧采样表、导数求导与切线、泰勒逐阶系数、积分中点法求和。
- **导数**：实时斜率、切线方程，探针沿曲线滑动。
- **泰勒**：0–6 阶多项式叠加，展示固定点误差与有符号误差。
- **积分**：中点黎曼和，矩形个数 1–50 可调，对比精确值与误差。
- **练题**：四个模块各 6 道内置题，提交后立即判分；答错给出提示、标准答案与解析，进度保存在 localStorage。
- **问 AI**：每个模块与主工作台都有入口，答案以流式文字显示并支持 KaTeX 公式；AI 不可用时只提示“AI 暂时没回应，稍后再试”，不影响作图与计算。
- **输入容错**：支持 `sinx`、`secx`、`cscx`、`cotx`、`sin2x`、`sin(x)`、`x^2`、`e^x` 等写法（`sin2x` 表示 `sin(2x)`）；输入停顿后自动绘图。
- **公式排版**：极限、导数、泰勒、积分公式、推导步骤、练习题与 AI 回答统一由 KaTeX 渲染，窄屏可横向滚动。
- 深色液态玻璃界面，支持鼠标与触摸。

## 本地运行

直接打开 `index.html` 即可，或启动一个静态服务器：

```bash
python -m http.server 8000
# 访问 http://127.0.0.1:8000/
```

需要联网加载 math.js 与 KaTeX：

```text
https://cdn.jsdelivr.net/npm/mathjs@14.0.1/lib/browser/math.js
https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js
https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css
```

## 技术

- 原生 HTML / CSS / JavaScript
- Canvas 2D 绘图（DPR 适配）
- math.js 解析表达式，AST 白名单校验
- KaTeX 渲染公式
- AI 接口约定见 `docs/AI_BACKEND.md`；密钥只放服务端环境变量

## 目录

```text
index.html          页面结构、四个分析面板、练题与问 AI 抽屉
styles.css          深色主题、液态玻璃、KaTeX 与移动端适配
app.js              表达式解析、Canvas 绘图、练习判分、AI 流式客户端
docs/DEPLOY.md      线上部署信息与回滚方式
docs/AI_BACKEND.md  问 AI 的服务端接口约定
```

## 线上地址

<https://math.astroswarm.cn>（部署后启用）

## 许可

目前未指定开源许可证。如需复用代码，请先联系仓库所有者。
