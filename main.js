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
    sendJSON(res, posts);
});
methods.set('/posts.getById', function ({ res, searchParams }) {
    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const foundPost = posts.find(post => post.id === id);

    if (!foundPost) {
        sendResponse(res, { status: statusNotFound });
        return;
    }

    sendJSON(res, foundPost);
});
methods.set('/posts.post', function ({ res, searchParams }) {
    if (!searchParams.has('content')) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const content = searchParams.get('content');
    const post = {
        id: nextId++,
        content: content,
        created: Date.now(),
    };

    posts.unshift(post);
    sendJSON(res, post);
});
methods.set('/posts.edit', function () { });
methods.set('/posts.delete', function () { });

function sendResponse(res, { status = statusOk, headers = {}, body = null }) {
    Object.entries(headers).forEach(function ([key, value]) {
        res.setHeader(key, value);
    });
    res.writeHead(status);
    res.end(body);
}

function sendJSON(res, body) {
    sendResponse(res, {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

const server = http.createServer((req, res) => {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

    const method = methods.get(pathname);
    if (method === undefined) {
        sendResponse(res, { status: statusNotFound });
        return;
    }

    const params = {
        req,
        res,
        pathname,
        searchParams,
    };

    method(params);
});

server.listen(port);