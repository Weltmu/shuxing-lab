#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""处理 galgame 8 张表情图：白底抠像 + 羽化，输出 assets/gal/*-soft.png。

顺序（按文件名增序）：
  1 平静 calm  2 闭眼 blink  3 疑惑 puzzle  4 微笑 smile
  5 捂嘴笑 laugh 6 害羞 shy   7 生气 angry  8 悲伤 sad
"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = r"C:\Users\li\Desktop\gal"
DST = r"D:\Astroswarm\function-farewell-mono\assets\gal"
NAMES = ["calm", "blink", "puzzle", "smile", "laugh", "shy", "angry", "sad"]
MAX_SIDE = 900
TOP_FADE = 0.06
BOTTOM_FADE = 0.10
SIDE_FADE = 0.045
PAD = 14
NOISE = 10.0
FULL = 78.0


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def estimate_paper(arr):
    h, w, _ = arr.shape
    border = np.concatenate([arr[1, :, :], arr[h - 2, :, :], arr[:, 1, :], arr[:, w - 2, :]], axis=0).astype(np.float32)
    return np.median(border, axis=0)


def process(path, out_path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    scale = MAX_SIDE / float(max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)

    arr = np.asarray(im, dtype=np.float32)
    paper = estimate_paper(arr)
    dist = np.sqrt(np.mean((arr - paper) ** 2, axis=2))
    alpha = smoothstep((dist - NOISE) / (FULL - NOISE)) * 255.0
    alpha_im = Image.fromarray(alpha.astype(np.uint8), "L")

    bbox = alpha_im.point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        box = (max(0, bbox[0] - PAD), max(0, bbox[1] - PAD),
               min(im.size[0], bbox[2] + PAD), min(im.size[1], bbox[3] + PAD))
        im = im.crop(box)
        alpha_im = alpha_im.crop(box)

    alpha_im = alpha_im.filter(ImageFilter.GaussianBlur(max(2.0, im.size[0] / 240.0)))

    a = np.asarray(alpha_im, dtype=np.float32) / 255.0
    hh, ww = a.shape
    top = max(1, int(hh * TOP_FADE))
    bottom = max(1, int(hh * BOTTOM_FADE))
    side = max(1, int(ww * SIDE_FADE))
    fy = np.ones(hh, dtype=np.float32)
    fy[:top] = smoothstep(np.arange(top) / top) ** 0.9
    fy[hh - bottom:] = smoothstep(np.arange(bottom)[::-1] / bottom) ** 1.1
    fx = np.ones(ww, dtype=np.float32)
    fx[:side] = smoothstep(np.arange(side) / side)
    fx[ww - side:] = smoothstep(np.arange(side)[::-1] / side)
    a = a * fy[:, None] * fx[None, :]

    out = im.convert("RGBA")
    out.putalpha(Image.fromarray((a * 255).astype(np.uint8), "L"))
    try:
        q = out.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE)
        q.save(out_path, format="PNG", optimize=True)
    except Exception:
        out.save(out_path, format="PNG", optimize=True)
    return out.size, os.path.getsize(out_path)


def main():
    files = sorted([f for f in os.listdir(SRC) if f.lower().endswith(".png")])
    print("源图:", len(files))
    os.makedirs(DST, exist_ok=True)
    total = 0
    for i, name in enumerate(files[:8]):
        out_name = NAMES[i] + "-soft.png"
        size, nbytes = process(os.path.join(SRC, name), os.path.join(DST, out_name))
        total += nbytes
        print("%-40s -> %-18s %4dx%-4d %5d KB" % (name[-40:], out_name, size[0], size[1], nbytes // 1024))
    print("total %.2f MB" % (total / 1024 / 1024))


if __name__ == "__main__":
    main()
