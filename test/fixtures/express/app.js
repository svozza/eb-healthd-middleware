const express = require('express');

module.exports = ebHealth => {
    const server = express();

    server.use(ebHealth({}));

    server.get('/test', (req, res) => {
        res.send('test');
    });

    return server;
};

