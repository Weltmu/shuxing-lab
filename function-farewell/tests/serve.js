/* 本地静态服务器：node tests/serve.js [port] */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var rootDir = path.resolve(__dirname, '..');
var port = Number(process.argv[2] || 4173);

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

var server = http.createServer(function (req, res) {
  var pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  var filePath = path.resolve(rootDir, '.' + pathname);
  if (filePath.indexOf(rootDir) !== 0) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', function () {
  console.log('Serving ' + rootDir + ' at http://127.0.0.1:' + port + '/');
});
