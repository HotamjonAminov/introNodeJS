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
    const id = hasId(searchParams);
    const postIndex = hasPost(id);

    sendJSON(res, posts[postIndex]);
});
methods.set('/posts.post', function ({ res, searchParams }) {
    const content = hasContent(searchParams);

    const post = {
        id: nextId++,
        content: content,
        created: Date.now(),
    };

    posts.unshift(post);
    sendJSON(res, post);
});
methods.set('/posts.edit', function ({ res, searchParams }) {
    const id = hasId(searchParams);
    const newContent = hasContent(searchParams);
    const postIndex = hasPost(id);

    posts[postIndex].content = newContent;
    sendJSON(res, posts[postIndex]);
});
methods.set('/posts.delete', function ({ res, searchParams }) {
    const id = hasId(searchParams);
    const postIndex = hasPost(id);

    const deletedPost = posts[postIndex];
    posts.splice(postIndex, 1);

    sendJSON(res, deletedPost);
});

function hasPost(id) {
    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
        sendResponse(res, { status: statusNotFound });
        return;
    }

    return postIndex;
}

function hasContent(params) {
    if (!params.has('content')) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const content = params.get('content');
    if (!content) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    return content;
}

function hasId(params) {
    if (!params.has('id')) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    const id = Number(params.get('id'));
    if (Number.isNaN(id)) {
        sendResponse(res, { status: statusBadRequest });
        return;
    }

    return id;
}

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