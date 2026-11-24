#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 docs/90-branch.json 生成为前端数据文件 js/story90.js。

做三件事：
  1. 回响补齐：除 m01 外每幕 3 条，缺的按上一幕选项补一句（不引入新事实）
  2. galgame 其后的一幕（m11/m18/m26）回响改为对应 galgame 选项
  3. 结局整理为 5 个，带 lead / 正文 / 道理 / 图形名
"""
import json
import re

SRC = r"D:\Astroswarm\function-farewell-mono\docs\90-branch.json"
OUT = r"D:\Astroswarm\function-farewell-mono\js\story90.js"

FALLBACK_ECHO = "那天之后，你们有几天没说话。"

# galgame 之后那条主干的回响：按 galgame 选项补
GAL_AFTER = {"G1": "m11", "G2": "m18", "G3": "m26"}

SHAPE_NAMES = {
    "A": "完整的心",
    "B": "断成两半的心",
    "C": "渐近线与玫瑰",
    "D": "隔一步的平行线",
    "E": "两条平行线",
}



def clean_meta(meta):
    """去掉「主干 · 」「分叉点 N · 」「中版 · 」等制作标注。"""
    m = re.sub(r"^(主干|分叉点 \d+|暖版|中版|冷版)\s*·\s*", "", meta)
    m = re.sub(r"^(主干|分叉点 \d+|暖版|中版|冷版)\s*·\s*", "", m)
    m = re.sub(r"^(暖版|中版|冷版)\s*·\s*", "", m)
    return m.strip()


def merge_body(lines, target_paras=2):
    """PDF 提取是硬换行；合并成长句后再按句号切成 2~3 段。"""
    text = "".join([l.strip() for l in lines if l.strip()])
    if not text:
        return []
    # 按句末标点切句
    parts = re.findall(r"[^。！？…]*[。！？…]+|[^。！？…]+$", text)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) <= target_paras:
        return parts
    total = sum(len(p) for p in parts)
    per = total / float(target_paras)
    out, cur = [], ""
    for p in parts:
        cur += p
        if len(cur) >= per and len(out) < target_paras - 1:
            out.append(cur)
            cur = ""
    if cur:
        out.append(cur)
    return out


WARM_B = ["你们又见了一面。", "她先给你发了消息。", "你们一起走了一段路。", "她笑了笑，没再提。"]
MID_B = ["日子照常过去。", "你们偶尔说几句话。", "谁都没有多问。", "一切照旧。"]
COLD_B = ["你们有几天没说话。", "谁也没有先开口。", "那之后安静了一阵。", "你们各走各的。"]


def time_phrase(meta):
    """从下一幕的 meta 取时间词，拼成过渡开头。"""
    m = (meta or "").split("·")[0].strip()
    if re.match(r"^(一|二|三|四|五|六|七|八|九|十|十一|十二)月$", m):
        return "到了" + m
    if m.startswith("第二年"):
        return "第二年"
    if m in ("认识第九天", ""):
        return "后来"
    return m or "后来"


def make_bridge(next_scene, opt, idx, k):
    t = time_phrase(next_scene.get("meta") if next_scene else "")
    d = opt.get("delta", 0)
    pool = WARM_B if d >= 2 else (COLD_B if d <= -2 else MID_B)
    clause = pool[(idx * 3 + k) % len(pool)]
    return t + "，" + clause


# 文档要求「全零信号的选项要么给信号，要么删掉」：按动作补最小合理信号（只在数据层，不改文案）
SIGNAL_FIX = {
    ("m08", "说新年快乐"): [1, 0, 0],
    ("m14", "说我也是"): [1, 1, 0],
    ("m16", "解释"): [0, 1, 1],
    ("m29", "说很好看"): [1, 0, 0],
    ("m07-cold", "说句累了"): [0, 1, 0],
}


def apply_signal_fix(scenes, m07vars):
    for sc in scenes + m07vars:
        for o in sc["options"]:
            key = (sc["id"], o["label"])
            if key in SIGNAL_FIX:
                sig = SIGNAL_FIX[key]
                o["signal"] = list(sig)
                o["delta"] = max(-2, min(2, sum(sig)))

def synth_echo(prev_opt_label, prev_scene_title):
    """缺的第三条回响：只描述上一幕选项的动作后果，不引入新事实。"""
    label = prev_opt_label.strip("。 ")
    return "她记得你那天%s。" % label


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    scenes = data["scenes"]
    galgame = data["galgame"]
    m07vars = data["m07variants"]
    endings_doc = data["endings"]

    by_id = {s["id"]: s for s in scenes}
    order = ["m%02d" % i for i in range(1, 31)]

    # ---- 回响补齐 ----
    for idx, sid in enumerate(order):
        s = by_id[sid]
        if sid == "m01":
            s["echoes"] = []
            continue
        # galgame 之后的幕：用 galgame 选项的回响
        gal_before = [g for g, target in GAL_AFTER.items() if target == sid]
        if gal_before:
            gid = gal_before[0]
            echoes = []
            for g in [x for x in galgame if x["id"].startswith(gid)]:
                for o in g["options"]:
                    echoes.append({"prevId": o["id"], "text": "她记得你说“%s”时的表情。" % o["label"]})
            s["echoes"] = echoes
            continue
        prev = by_id[order[idx - 1]]
        have = {e["prevId"]: e["text"] for e in s["echoes"] if e.get("prevId")}
        filled = []
        for o in prev["options"]:
            if o["id"] in have:
                filled.append({"prevId": o["id"], "text": have[o["id"]]})
            else:
                filled.append({"prevId": o["id"], "text": synth_echo(o["label"], prev["title"])})
        s["echoes"] = filled

    # ---- m07 变体回响 key ----
    for v in m07vars:
        echoes = [{"prevId": None, "text": e["text"]} for e in v["echoes"]]
        # 对应 m06 的三个选项
        m06 = by_id["m06"]
        for i, e in enumerate(echoes):
            if i < 3:
                e["prevId"] = m06["options"][i]["id"]
        v["echoes"] = echoes

    # ---- 结局 ----
    endings = []
    for e in endings_doc:
        endings.append({
            "code": e["code"],
            "title": e["title"],
            "lead": e["lead"],
            "text": e["text"].replace("十二幕", "三十幕"),
            "principle": e["principle"],
            "shapeName": SHAPE_NAMES.get(e["code"], e["title"]),
            "shape": e["code"],
        })

    # bridge：每个选项一句真正的过渡（时间流逝 + 她的反应）
    for i, s in enumerate(scenes):
        nxt = scenes[i + 1] if i + 1 < len(scenes) else None
        for k, o in enumerate(s["options"]):
            o["bridge"] = make_bridge(nxt, o, i, k)
    for v in m07vars:
        for k, o in enumerate(v["options"]):
            nxt = scenes[7] if len(scenes) > 7 else None
            o["bridge"] = make_bridge(nxt, o, 7, k)
    for g in galgame:
        for k, o in enumerate(g["options"]):
            o["bridge"] = ""

    # 正文按 PDF 换行合并成段；meta 去掉制作标注
    for s in scenes + m07vars:
        s["body"] = merge_body(s.get("body") or [])
        s["meta"] = clean_meta(s.get("meta") or "")
    for g in galgame:
        g["meta"] = clean_meta(g.get("meta") or "")

    apply_signal_fix(scenes, m07vars)

    payload = {
        "scenes": scenes,
        "m07variants": {v["id"].replace("m07-", ""): v for v in m07vars},
        "galgame": {g["id"]: g for g in galgame},
        "endings": endings,
        "fallbackEcho": FALLBACK_ECHO,
        "thresholds": {
            "m07": 4, "gal": 6,
            "affinityMin": -12, "affinityMax": 12,
            "deltaMin": -2, "deltaMax": 2,
        },
    }

    js = "/* 自动生成：由 docs/90-branch.json 生成，勿手改；改文案请改 PDF 解析结果并重跑 tests/build_story90.py */\n"
    js += "window.STORY90 = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    open(OUT, "w", encoding="utf-8").write(js)

    # 校验
    print("scenes:", len(scenes))
    bad = [s["id"] for s in scenes if s["id"] != "m01" and len(s["echoes"]) != 3]
    print("回响不为 3 的幕:", bad if bad else "无 ✓")
    print("结局:", [(e["code"], e["title"], bool(e["lead"]), len(e["text"])) for e in endings])
    print("galgame 段数:", len(galgame), "m07 变体:", list(payload["m07variants"].keys()))
    print("输出:", OUT, "size:", len(js) // 1024, "KB")


if __name__ == "__main__":
    main()
