#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把《函数告别式 · 90 幕分支》PDF 提取文本解析成结构化 JSON（v2）。"""
import json
import re

SRC = r"D:\Astroswarm\function-farewell-mono\docs\90幕分支-原文.txt"
OUT = r"D:\Astroswarm\function-farewell-mono\docs\90-branch.json"

PAGE_RE = re.compile(r"^---- PAGE \d+ ----$")


def clean(text):
    out = []
    for l in text.split("\n"):
        if PAGE_RE.match(l.strip()):
            continue
        # PDF 提取时页眉页脚可能残留：整行只有页码
        if re.fullmatch(r"\s*\d{1,3}\s*", l):
            continue
        out.append(l.rstrip())
    return "\n".join(out)


def norm(s):
    s = s.replace("　", " ").strip()
    s = re.sub(r"[ \t]+", " ", s)
    return s


def chapter_starts(text):
    idx = {}
    for m in re.finditer(r"^(一|二|三|四|五|六|七|八)、", text, re.M):
        idx[m.group(1)] = m.start()
    return idx


def parse_signal(seg):
    t = re.search(r"t\s*=\s*(-?\d+)", seg)
    h = re.search(r"h\s*=\s*(-?\d+)", seg)
    a = re.search(r"a\s*=\s*(-?\d+)", seg)
    return [int(t.group(1)) if t else 0,
            int(h.group(1)) if h else 0,
            int(a.group(1)) if a else 0]


def parse_fn(seg):
    m = re.search(r"f(\d+)", seg)
    return "f%s" % m.group(1) if m else ""


# ---------------- 主干 / m07 变体 ----------------
def parse_scene(block):
    lines = [l.strip() for l in block.split("\n")]
    head = re.match(r"^(m\d{2}(?:-(?:中版|冷版))?)\s*·\s*(.+?)\s*（(.+?)）$", lines[0]) if lines else None
    if not head:
        return None
    scene = {
        "id": head.group(1), "title": norm(head.group(2)), "meta": norm(head.group(3)),
        "body": [], "question": "", "options": [], "echoes": [], "sketch": "", "iconNote": "", "audit": "",
    }
    pending = None
    for line in lines[1:]:
        if not line:
            continue
        if line.startswith("审计修正"):
            scene["audit"] = norm(line)
            continue
        if line.startswith("问题："):
            scene["question"] = norm(line[3:])
            continue
        if line.startswith("选项"):
            continue
        if line.startswith("函数："):
            if pending:
                pending["fn"] = parse_fn(line)
                pending["signal"] = parse_signal(line)
                t, h, a = pending["signal"]
                pending["delta"] = max(-2, min(2, t + h + a))
            continue
        mo = re.match(r"^(\d)\.\s*([^:：]+)[:：]\s*(.+)$", line)
        if mo:
            pending = {"id": None, "label": norm(mo.group(2)), "text": norm(mo.group(3)),
                       "fn": "", "signal": [0, 0, 0], "delta": 0}
            scene["options"].append(pending)
            continue
        if line.startswith("本幕开头的回响") or line.startswith("本幕结束后的回响"):
            continue
        if line.startswith("•"):
            echo = norm(line.lstrip("• "))
            mm = re.match(r"若上一幕选了\s*(m\d{2}[a-c])[:：]\s*(.+)", echo)
            if mm:
                scene["echoes"].append({"prevId": mm.group(1), "text": norm(mm.group(2))})
            continue
        me = re.match(r"^(\d)\.\s*(她记得.+)$", line)
        if me:
            scene["echoes"].append({"prevId": None, "text": norm(me.group(2))})
            continue
        if line.startswith("线稿："):
            scene["sketch"] = norm(line[3:])
            continue
        if line.startswith("选项图标"):
            scene["iconNote"] = norm(line)
            continue
        if line.startswith("【照片") or line.startswith("照片由用户"):
            continue
        if line.startswith("呼应：") or line.startswith("对话：") or line.startswith("眨眼规则") or line.startswith("表情反馈"):
            continue
        scene["body"].append(norm(line))
    # 选项 id：m01a/b/c
    for i, opt in enumerate(scene["options"]):
        opt["id"] = "%s%s" % (re.match(r"m\d{2}", scene["id"]).group(0), "abc"[i] if i < 3 else str(i))
    return scene


# ---------------- galgame ----------------
def parse_galgame(block):
    m = re.match(r"^(G[123][ABC])\s*·\s*(.+?)\s*（(.+?)）", block, re.M)
    if not m:
        return None
    gid, title, meta = m.group(1), norm(m.group(2)), norm(m.group(3))
    echo = ""
    em = re.search(r"呼应：(.+)", block)
    if em:
        echo = norm(em.group(1))
    dialogue = [{"who": dm.group(1), "text": norm(dm.group(2))} for dm in re.finditer(r"^(她|你)：“(.+?)”", block, re.M)]

    # 选项：按 “1.” 开头切块，字段可能跨行（去向在下一行）
    options = []
    chunks = re.split(r"(?m)^(?=\d\.[^\n]*——)", block)
    for ch in chunks:
        om = re.match(r"^(\d)\.(.+?)——\s*(.*)$", ch.strip(), re.S)
        if not om:
            continue
        key = int(om.group(1))
        label = norm(om.group(2))
        tail = norm(om.group(3).replace("\n", " "))
        expr = re.search(r"表情：([^；;]+)", tail)
        sig = re.search(r"信号：([^；;]+)", tail)
        delta = re.search(r"亲密度变化：([^；;]+)", tail)
        dest = re.search(r"去向：\s*(m\d{2}[A-Ca-c]?)", tail)
        options.append({
            "key": key,
            "label": label,
            "expr": norm(expr.group(1)) if expr else "",
            "signal": parse_signal(sig.group(1)) if sig else [0, 0, 0],
            "delta": max(-2, min(2, sum(parse_signal(sig.group(1))))) if sig else 0,
            "nextRaw": norm(dest.group(1)) if dest else "",
            "next": re.match(r"m\d{2}", dest.group(1)).group(0) if dest else "",
            "lineage": (dest.group(1)[3:] if dest and len(dest.group(1)) > 3 else ""),
        })
    # 按 key 排序并占位补齐
    options.sort(key=lambda o: o["key"])
    for i, o in enumerate(options):
        o["id"] = gid.lower() + "abc"[i] if i < 3 else gid.lower() + str(i)
    return {"id": gid, "title": title, "meta": meta, "echo": echo,
            "dialogue": dialogue, "options": options}


# ---------------- 结局 ----------------
def parse_endings(text):
    out = []
    for m in re.finditer(r"^([A-E])\s*线结局\s*·\s*(.+)$", text, re.M):
        start = m.start()
        nxt = re.search(r"^(?:[A-E]\s*线结局\s*·|八、)", text[m.end():], re.M)
        end = m.end() + nxt.start() if nxt else len(text)
        block = text[start:end]
        lead = re.search(r"引导句\s*lead[:：]\s*(.+)", block)
        body = re.search(r"正文[:：]\s*([\s\S]+?)\n\s*道理[:：]", block)
        prin = re.search(r"道理[:：]\s*(.+)", block)
        shape = re.search(r"结局图[:：]\s*(.+)", block)
        out.append({
            "code": m.group(1), "title": norm(m.group(2)),
            "lead": norm(lead.group(1)) if lead else "",
            "text": norm(body.group(1).replace("\n", "")) if body else "",
            "principle": norm(prin.group(1)) if prin else "",
            "shapeNote": norm(shape.group(1)) if shape else "",
        })
    return out


def main():
    text = clean(open(SRC, encoding="utf-8").read())
    ch = chapter_starts(text)

    # 四、主干 + m07 变体
    sec4 = text[ch["四"]:ch["五"]]
    cut = re.search(r"(?m)^分叉点 1 变体", sec4)
    main_part = sec4[:cut.start()] if cut else sec4
    var_part = sec4[cut.start():] if cut else ""

    scene_blocks = re.split(r"(?m)^(?=m\d{2}\s*·)", main_part)
    scenes = [parse_scene(b) for b in scene_blocks if re.match(r"^m\d{2}\s*·", b.strip())]
    scenes = [s for s in scenes if s]
    seen, uniq = set(), []
    for s in scenes:
        if s["id"] not in seen:
            seen.add(s["id"])
            uniq.append(s)
    scenes = sorted(uniq, key=lambda s: s["id"])

    var_blocks = re.split(r"(?m)^(?=m07-(?:中版|冷版)\s*·)", var_part)
    m07vars = [parse_scene(b) for b in var_blocks if re.match(r"^m07-(?:中版|冷版)\s*·", b.strip())]
    m07vars = [v for v in m07vars if v]
    for v in m07vars:
        v["id"] = "m07-mid" if "中版" in v["id"] else "m07-cold"

    # 五、galgame
    sec5 = text[ch["五"]:ch["六"]]
    gblocks = re.split(r"(?m)^(?=G[123][ABC]\s*·)", sec5)
    galgame = [parse_galgame(b) for b in gblocks if re.match(r"^G[123][ABC]\s*·", b.strip())]
    galgame = [g for g in galgame if g]

    # 七、结局
    sec7 = text[ch["七"]:ch["八"]] if "八" in ch else text[ch["七"]:]
    endings = parse_endings(sec7)

    data = {"scenes": scenes, "m07variants": m07vars, "galgame": galgame, "endings": endings}
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print("scenes:", len(scenes))
    for s in scenes:
        flag = "" if (len(s["options"]) == 3 and s["question"]) else "  <-- 检查"
        print("  %s %-18s opts=%d echoes=%d body=%d%s" % (
            s["id"], s["title"], len(s["options"]), len(s["echoes"]), len(s["body"]), flag))
    print("m07 variants:", [(v["id"], len(v["options"]), len(v["echoes"])) for v in m07vars])
    print("galgame:", [(g["id"], len(g["dialogue"]), len(g["options"])) for g in galgame])
    print("endings:", [(e["code"], e["title"], len(e["text"]), bool(e["lead"])) for e in endings])


if __name__ == "__main__":
    main()
