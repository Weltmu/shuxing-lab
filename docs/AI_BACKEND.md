# 问 AI 服务端接口

前端只请求同源接口 `POST /api/ai/ask`，不接触任何模型密钥。

## 安全约束

- 密钥只能存在于 Qoder Sites 的 Server Function 环境变量中，不写入 `index.html`、`app.js`、Git 或日志。
- 静态托管（如 `math.astroswarm.cn` 预览环境）没有该接口时，前端显示固定文案 `AI 暂时没回应，稍后再试`，作图、拖动、练题全部照常工作。
- 不在浏览器里拼接上游地址，也不允许客户端指定模型。

## 请求

```http
POST /api/ai/ask
Content-Type: application/json
```

```json
{
  "question": "这里的极限为什么存在？",
  "mode": "limit",
  "context": {
    "mode": "limit",
    "modeLabel": "极限",
    "function": "sin(x)/x",
    "a": 0,
    "x": 0.9,
    "taylorOrder": 3,
    "integralA": 0,
    "integralB": 1,
    "integralN": 12
  }
}
```

练题页的“AI 出题”复用同一接口，额外带 `"task": "practice"`。

## 上游模型

- 固定模型：`nvidia/nemotron-3-ultra-550b-a55b`
- 上游：NVIDIA `https://integrate.api.nvidia.com/v1/chat/completions`
- 密钥环境变量：`NVIDIA_API_KEY`（只在服务端读取）
- 系统提示：中文、分步讲解、控制在 200 字左右；公式使用 `$…$` 与 `$$…$$`；只讲数学，不执行代码。

## 流式响应

成功时返回 `text/event-stream`，每个事件是一行 JSON：

```text
data: {"delta":"先看左右两侧：\\n"}
data: {"delta":"$\\\\lim_{x\\\\to0}\\\\frac{\\\\sin x}{x}=1$。\\n"}
data: [DONE]
```

也兼容纯文本事件（`data: 文字`）与非流式 JSON（`{ "answer": "…" }`）。前端会累积文本，结束后用 KaTeX 渲染 `$…$` / `$$…$$`。

失败、超时（前端 25 秒）或空响应时，前端只显示：

```text
AI 暂时没回应，稍后再试
```

## 练题出题格式

`task: "practice"` 时要求模型只返回：

```json
{
  "question": "求 \\lim_{x\\to0}\\frac{\\tan x}{x}",
  "answer": "1",
  "answerTex": "1",
  "hint": "把 tan x 写成 sin x / cos x。",
  "explanation": "……"
}
```

前端解析失败或请求失败时不报错，静默回退到下一道内置题。

## 部署位置

Qoder Sites 上线时，在站点后端创建 `/api/ai/ask` Server Function，并把 `NVIDIA_API_KEY` 写入服务端环境变量；预览站保持静态，不配置密钥。
