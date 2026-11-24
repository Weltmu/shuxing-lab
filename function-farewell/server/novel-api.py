#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""函数式告别 · 结局小说 API（后端代理，Python 标准库实现）

密钥只存在于服务器环境变量（/etc/shuxing-lab/novel.env），
前端代码、静态资源与仓库里都不出现。
"""
import json
import os
import sys
import time
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("NOVEL_PORT", "8791"))
KEY = os.environ.get("NVIDIA_API_KEY", "").strip()
MODEL = os.environ.get("NOVEL_MODEL", "stepfun-ai/step-5-preview")
FALLBACK = os.environ.get("NOVEL_FALLBACK_MODEL", "z-ai/glm-5.3-flash")
MAX_TOKENS = int(os.environ.get("NOVEL_MAX_TOKENS", "9000"))
TIMEOUT = int(os.environ.get("NOVEL_TIMEOUT_MS", "900000")) / 1000.0

CRLF = "\r\n"

SYSTEM = (
    "你是一位克制、细腻的中文小说作者，擅长写三五千字的短篇。\n"
    "写作要求：第三人称叙述，具体、克制、不煽情；有天气、声音、触感与动作细节；"
    "不写总结句，不做道德判断。\n"
    "必须严格使用玩家这一局真实经历的场景与选择，不得编造没有发生过的情节，不得改结局。\n"
    "只输出小说正文，不要标题、不要分段标题、不要任何解释或元信息。"
)


def log(*args):
    print(time.strftime("%Y-%m-%dT%H:%M:%S"), " ".join(str(a) for a in args), flush=True)


def user_prompt(run):
    steps = run.get("steps") or []
    ending = run.get("ending") or {}
    lines = [
        "这是我刚刚玩完的一局《函数式告别》的完整记录，请据此写一篇约 5000 字的中文短篇小说。",
        "",
        "【结局】%s（%s）" % (ending.get("title", "未知"), ending.get("text", "")),
        "",
        "【这一局走过的场景与选择】",
    ]
    for i, st in enumerate(steps):
        lines.append("%d. %s：你选择了「%s」——%s" % (
            i + 1, st.get("scene", ""), st.get("label", ""), st.get("text", "")))
    lines += [
        "",
        "【写作要求】",
        "1. 按顺序写这一年，每幕至少一段，把选择的后果写出来：因为你当时选了 A，后来才会发生 B。",
        "2. 结尾必须落在结局给出的基调上，与结局正文一致，不要另起结局。",
        "3. 全文约 5000 字，一次写完，不要分节标题。",
    ]
    return "\n".join(lines)


def upstream_stream(prompt, model, emit):
    """向 NVIDIA 发起流式请求，逐段 emit；返回 (正文字数, 错误)。"""
    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.9,
        "top_p": 0.95,
        "max_tokens": MAX_TOKENS,
        "stream": True,
    }, ensure_ascii=False).encode("utf-8")

    conn = http.client.HTTPSConnection("integrate.api.nvidia.com", timeout=TIMEOUT)
    try:
        conn.request("POST", "/v1/chat/completions", body=body, headers={
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "text/event-stream",
        })
        resp = conn.getresponse()
        if resp.status != 200:
            detail = resp.read(400).decode("utf-8", "ignore")
            log("upstream", model, resp.status, detail.replace("\n", " ")[:200])
            return 0, "upstream %s" % resp.status

        chars = 0
        think = 0
        last_think = 0.0
        pending = b""
        while True:
            block = resp.read1(4096) if hasattr(resp, "read1") else resp.read(512)
            if not block:
                break
            pending += block
            while b"\n" in pending:
                line, pending = pending.split(b"\n", 1)
                line = line.strip()
                if not line.startswith(b"data:"):
                    continue
                payload = line[5:].strip()
                if payload == b"[DONE]":
                    return chars, None
                try:
                    item = json.loads(payload.decode("utf-8"))
                except Exception:
                    continue
                choices = item.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                rc = delta.get("reasoning_content") or ""
                if rc:
                    think += len(rc)
                    now = time.time()
                    if now - last_think > 1.5:
                        last_think = now
                        emit({"thinking": think})
                text = delta.get("content") or ""
                if text:
                    chars += len(text)
                    emit(text, chars)
        return chars, None
    except Exception as exc:  # noqa: BLE001
        log("upstream error", model, repr(exc)[:160])
        return 0, str(exc)
    finally:
        try:
            conn.close()
        except Exception:
            pass


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def _json(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/novel/health":
            self._json(200, {"ok": bool(KEY), "model": MODEL, "fallback": FALLBACK})
            return
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/novel":
            self._json(404, {"error": "not found"})
            return
        if not KEY:
            self._json(503, {"error": "service not configured"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(min(length, 256 * 1024)) if length else b"{}"
            data = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            self._json(400, {"error": "bad request"})
            return

        run = data.get("run") or {}
        prompt = user_prompt(run)
        log("generate steps=%d ending=%s" % (
            len(run.get("steps") or []), (run.get("ending") or {}).get("title")))

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "keep-alive")
        self.send_header("Transfer-Encoding", "chunked")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()

        def write_chunk(raw_text):
            data_bytes = raw_text.encode("utf-8") if isinstance(raw_text, str) else raw_text
            if not data_bytes:
                return
            self.wfile.write(("%X" % len(data_bytes)).encode("ascii") + b"\r\n" + data_bytes + b"\r\n")
            self.wfile.flush()

        def sse(obj):
            write_chunk("data: " + json.dumps(obj, ensure_ascii=False) + "\n\n")

        def emit(text, chars=None):
            if isinstance(text, dict):
                sse({"type": "thinking", "chars": text.get("thinking", 0)})
            else:
                sse({"type": "delta", "text": text, "chars": chars or 0})

        def finish(chars):
            sse({"type": "done", "chars": chars})

        try:
            write_chunk(": connected\n\n")
            chars, err = upstream_stream(prompt, MODEL, emit)
            if chars < 200:
                log("primary short/failed", err or "", "fallback", FALLBACK)
                chars, err = upstream_stream(prompt, FALLBACK, emit)
            if chars <= 0:
                sse({"type": "error", "message": err or "empty"})
            else:
                finish(chars)
        except Exception as exc:  # noqa: BLE001
            log("handler error", repr(exc)[:160])
        finally:
            try:
                self.wfile.write(b"0\r\n\r\n")
                self.wfile.flush()
            except Exception:
                pass


def main():
    log("novel-api listening on 127.0.0.1:%d model=%s key=%s" % (
        PORT, MODEL, "set" if KEY else "MISSING"))
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
