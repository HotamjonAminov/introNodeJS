'use strict';
const http = require('node:http');

const port = 9999;
const statusOk = 200;
const statusBadRequest = 400;
const statusNotFound = 404;

let nextId = 1;
const posts = [];

const methods = new Map();
methods.set('/posts.get', function ({ res }) {
    res.writeHead(statusOk, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(posts));
});
methods.set('/posts.getById', function () { });
methods.set('/posts.post', function ({ res, searchParams }) {
    if (!searchParams.has('content')) {
        res.writeHead(statusBadRequest);
        res.end();
        return;
    }

    const content = searchParams.get('content');
    const post = {
        id: nextId++,
        content: content,
        created: Date.now(),
    };

    posts.unshift(post);
    res.writeHead(statusOk, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(post));
});
methods.set('/posts.edit', function () { });
methods.set('/posts.delete', function () { });

const server = http.createServer((req, res) => {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

    const method = methods.get(pathname);
    if (method === undefined) {
        res.writeHead(statusNotFound);
        res.end();
        return;
    }

    const params = {
        req,
        res,
        pathname,
        searchParams,
    }

    method(params);
});

server.listen(port);