/* 兼容入口：node tests/visual-qa.js
 * 单场景/Canvas 渲染修复后，视觉验收统一由 animation-qa.js 执行；
 * 这里先跑锁定内容/引擎测试，再跑动画/渲染与桌面手机验收。
 */
'use strict';

var { spawnSync } = require('child_process');
var path = require('path');

var content = spawnSync(process.execPath, [path.join(__dirname, 'content-test.js')], { stdio: 'inherit' });
if (content.status) process.exit(content.status);

var visual = spawnSync(process.execPath, [path.join(__dirname, 'animation-qa.js')], { stdio: 'inherit' });
process.exit(visual.status || 0);