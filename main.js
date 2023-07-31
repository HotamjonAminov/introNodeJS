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
    sendJSON(res, posts.filter(post => post.removed === false));
});
methods.set('/posts.getById', function ({ res, searchParams }) {
    try {
        const id = getId(searchParams);
        const foundById = getPost(res, id);

        sendJSON(res, foundById);
    } catch (getByIdError) {
        handleError(res, getByIdError);
    }
});
methods.set('/posts.post', function ({ res, searchParams }) {
    try {
        const content = getContent(searchParams);

        const post = {
            id: nextId++,
            content: content,
            removed: false,
            created: Date.now(),
        };

        posts.unshift(post);
        sendJSON(res, post);
    } catch (postError) {
        handleError(res, postError);
    }
});
methods.set('/posts.edit', function ({ res, searchParams }) {
    try {
        const id = getId(searchParams);
        const newContent = getContent(searchParams);
        const postToEdit = getPost(res, id);

        postToEdit.content = newContent;
        sendJSON(res, postToEdit);
    } catch (editError) {
        handleError(res, editError);
    }
});
methods.set('/posts.delete', function ({ res, searchParams }) {
    try {
        const id = getId(searchParams);
        const postToDelete = getPost(res, id);

        postToDelete.removed = true;

        sendJSON(res, postToDelete);
    } catch (deleteError) {
        handleError(res, deleteError);
    }
});

function handleError(res, error) {
    switch (error.message) {
        case 'statusBadRequest':
            sendResponse(res, { status: statusBadRequest });
            break;
        case 'statusNotFound':
            sendResponse(res, { status: statusNotFound });
            break;

        default:
            break;
    }
}

function getPost(id) {
    const postIndex = getPostIndex( id);
    const post = posts[postIndex];

    if (post.removed === true) {
        throw new Error('statusNotFound');
    }

    return post;
}

function getPostIndex(id) {
    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
        throw new Error('statusNotFound');
    }

    return postIndex;
}

function getContent(params) {
    if (!params.has('content')) {
        throw new Error('statusBadRequest');
    }

    const content = params.get('content');
    if (!content) {
        throw new Error('statusBadRequest');
    }

    return content;
}

function getId(params) {
    if (!params.has('id')) {
        throw new Error('statusBadRequest');
    }

    const id = Number(params.get('id'));
    if (Number.isNaN(id)) {
        throw new Error('statusBadRequest');
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