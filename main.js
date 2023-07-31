'use strict';
const http = require('node:http');

const port = 9999;
const statusOk = 200;
const statusBadRequest = 400;
const statusNotFound = 404;

let nextId = 1;
const posts = [];

const methods = new Map();
methods.set('/posts.get', function(req, res) {
    res.writeHead(statusOk, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(posts));
});
methods.set('/posts.getById', function(req, res) {});
methods.set('/posts.post', function(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const searchParams = url.searchParams;

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
    res.writeHead(statusOk, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(post));
});
methods.set('/posts.edit', function(req, res) {});
methods.set('/posts.delete', function(req, res) {});

const server = http.createServer((req, res) => {    
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    const method = methods.get(pathname);
    if (method === undefined) {
        res.writeHead(statusNotFound);
        res.end();
        return;
    }

    method(req, res);
});

server.listen(port);