# 问 AI 服务端接口

前端只请求同源接口 `POST /api/ai/ask`，不接触任何模型密钥。

## 安全约束

- 密钥只存在于服务器环境变量 `NVIDIA_API_KEY`（生产路径 `/etc/shuxing-lab/ai.env`，权限 600），不写入 `index.html`、`app.js`、Git 或日志。
- 服务端进程只从环境变量读密钥；代理不记录请求头、密钥或完整上游响应。
- 未配置密钥或上游失败时，前端只显示固定文案 `AI 暂时没回应，稍后再试`，作图、拖动、缩放、练题全部照常工作。
- 不在浏览器里拼接上游地址，也不允许客户端指定模型；模型在 `server/ai-proxy.js` 中固定。
- 代理只监听 `127.0.0.1:8787`，经 Nginx 同源转发；内置按 IP 限流（24 次/分钟）。

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

`math.astroswarm.cn` 当前使用阿里云服务器上的独立 Node 代理：

| 项 | 值 |
| --- | --- |
| 代码 | `/opt/shuxing-lab/ai/ai-proxy.js`（仓库内 `server/ai-proxy.js`） |
| 运行时 | `/opt/shuxing-lab/ai/runtime/bin/node`（Node 20，自包含，不依赖系统 Node） |
| 服务 | `shuxing-ai.service`，监听 `127.0.0.1:8787` |
| 密钥文件 | `/etc/shuxing-lab/ai.env`，`root:root`、`chmod 600` |
| Nginx | `location = /api/ai/ask` 反向代理，关闭缓冲以支持 SSE |

设置密钥（不会回显，不写入 shell 历史）：

```bash
read -rsp 'NVIDIA key: ' NVIDIA_API_KEY
printf 'NVIDIA_API_KEY=%s\n' "$NVIDIA_API_KEY" > /etc/shuxing-lab/ai.env
unset NVIDIA_API_KEY
chmod 600 /etc/shuxing-lab/ai.env
systemctl restart shuxing-ai
curl -sS http://127.0.0.1:8787/healthz
```

`healthz` 返回 `{"ok":true,"configured":true}` 表示密钥已加载。仓库里只有 `.env.example`，任何真实密钥都不得提交。

Qoder Sites 上线时也可以用同样的接口约定改为 Server Function；当前预览站直接使用上述代理。
