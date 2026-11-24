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
