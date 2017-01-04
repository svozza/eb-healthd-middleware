const restify = require('restify');

module.exports = ebHealth => {
    const server = restify.createServer({
        name: 'appsApi'
    });

    server.use(ebHealth({}));

    server.get('/test', (req, res) => {
        res.send('test');
    });

    return server;
};

