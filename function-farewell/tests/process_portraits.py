#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 30 张立绘处理成带透明通道的 soft PNG（numpy 加速版）。

只做抠像与羽化，不改构图、不修脸：
  1. 最长边缩放到 1200
  2. 四边中位数估计纸面色 → 按颜色距离生成软 alpha（无 250/255 灰台阶）
  3. 裁到内容 bbox + 留白
  4. 高斯羽化
  5. 顶部溶解淡入 / 底部淡出到透明 / 左右羽化
  6. RGBA PNG（256 色量化 + 透明）控制体积
"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = r"C:\Users\li\Desktop\场景照片"
DST = r"D:\Astroswarm\function-farewell-mono\assets"
MAX_SIDE = 1200
TOP_FADE = 0.10
BOTTOM_FADE = 0.16
SIDE_FADE = 0.055
PAD = 18
NOISE = 10.0
FULL = 78.0


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def estimate_paper(arr):
    h, w, _ = arr.shape
    top = arr[1, :, :]
    bottom = arr[h - 2, :, :]
    left = arr[:, 1, :]
    right = arr[:, w - 2, :]
    border = np.concatenate([top, bottom, left, right], axis=0).astype(np.float32)
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

    radius = max(2.0, im.size[0] / 220.0)
    alpha_im = alpha_im.filter(ImageFilter.GaussianBlur(radius))

    a = np.asarray(alpha_im, dtype=np.float32) / 255.0
    hh, ww = a.shape
    top = max(1, int(hh * TOP_FADE))
    bottom = max(1, int(hh * BOTTOM_FADE))
    side = max(1, int(ww * SIDE_FADE))
    fy = np.ones(hh, dtype=np.float32)
    fy[:top] = smoothstep(np.arange(top) / top) ** 0.85
    fy[hh - bottom:] = smoothstep((np.arange(bottom)[::-1]) / bottom) ** 1.15
    fx = np.ones(ww, dtype=np.float32)
    fx[:side] = smoothstep(np.arange(side) / side)
    fx[ww - side:] = smoothstep((np.arange(side)[::-1]) / side)
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
    print("源图数量:", len(files))
    os.makedirs(DST, exist_ok=True)
    total = 0
    for i, name in enumerate(files, 1):
        out_name = "portrait-m%02d-soft.png" % i
        size, nbytes = process(os.path.join(SRC, name), os.path.join(DST, out_name))
        total += nbytes
        print("%-2d %-30s -> %-24s %4dx%-4d %5d KB" % (i, name[-30:], out_name, size[0], size[1], nbytes // 1024))
    print("total %.2f MB" % (total / 1024.0 / 1024.0))


if __name__ == "__main__":
    main()
