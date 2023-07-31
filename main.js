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
methods.set('/posts.edit', function ({ res, searchParams }) {
    if (!searchParams.has('id') || !searchParams.has('content')) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const id = Number(searchParams.get('id'));
    const newContent = searchParams.get('content');

    if (Number.isNaN(id) || !newContent) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const postIndex = posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
        sendResponse(res, { status: statusNotFound });
        return;
    }

    posts[postIndex].content = newContent;
    sendJSON(res, posts[postIndex]);
});
methods.set('/posts.delete', function ({ res, searchParams }) {
    if (!searchParams.has('id')) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const id = Number(searchParams.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
        sendResponse(res, { status: statusNotFound });
        return;
    }

    const deletedPost = posts[postIndex];
    posts.splice(postIndex, 1);
    sendJSON(res, deletedPost);
});

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