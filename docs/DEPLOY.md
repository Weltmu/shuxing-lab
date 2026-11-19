# 部署说明

静态站点，无 systemd 服务。Nginx 直接托管 `/opt/shuxing-lab/web`。

## 线上信息

| 项 | 值 |
| --- | --- |
| 域名 | `math.astroswarm.cn` |
| 服务器 | `112.124.11.144`（Ubuntu 22.04） |
| 站点目录 | `/opt/shuxing-lab/web` |
| Nginx 配置 | `/etc/nginx/sites-available/math.astroswarm.cn.conf`（仓库内 `deploy/math.astroswarm.cn.conf`） |
| 证书 | Let's Encrypt `math.astroswarm.cn`（webroot：`/var/www/letsencrypt`） |
| GitHub | <https://github.com/Weltmu/shuxing-lab> |

## 更新流程

```bash
# 1. 本机打包（仅站点文件）并上传
tar -czf "$TEMP/shuxing-lab.tgz" -C D:/Astroswarm/shuxing-lab index.html styles.css app.js
scp -i "<ssh-key>" "$TEMP/shuxing-lab.tgz" root@112.124.11.144:/tmp/shuxing-lab.tgz

# 2. 服务器：备份旧目录 → 解压到新目录 → 原子替换
ssh -i "<ssh-key>" root@112.124.11.144 'set -e
  TS=$(date +%Y%m%d_%H%M%S)
  mkdir -p /root/backups
  if [ -d /opt/shuxing-lab/web ]; then
    tar -czf /root/backups/shuxing-lab-web-$TS.tgz -C /opt/shuxing-lab web
  fi
  rm -rf /opt/shuxing-lab/web.new
  mkdir -p /opt/shuxing-lab/web.new
  tar -xzf /tmp/shuxing-lab.tgz -C /opt/shuxing-lab/web.new
  rm -rf /opt/shuxing-lab/web.old
  if [ -d /opt/shuxing-lab/web ]; then mv /opt/shuxing-lab/web /opt/shuxing-lab/web.old; fi
  mv /opt/shuxing-lab/web.new /opt/shuxing-lab/web
'
```

## 验收

```bash
curl -sS -o /dev/null -w 'math=%{http_code}\n' https://math.astroswarm.cn/
curl -sS -o /dev/null -w 'root=%{http_code}\n' https://astroswarm.cn/
curl -sS -o /dev/null -w 'music=%{http_code}\n' https://music.astroswarm.cn/
nginx -t
```

## 回滚

```bash
# 恢复上一版静态文件
tar -xzf /root/backups/shuxing-lab-web-<时间戳>.tgz -C /opt/shuxing-lab

# 或整体下线
rm /etc/nginx/sites-enabled/math.astroswarm.cn.conf
nginx -t && systemctl reload nginx
```

回滚后同样检查 `astroswarm.cn` 与 `music.astroswarm.cn` 是否仍为 200。
