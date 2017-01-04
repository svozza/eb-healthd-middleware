// @flow weak

'use strict';

const onFinished = require('on-finished');
const getIp = require('request-ip').getClientIp;

// manually curry to avoid confusing Flow
module.exports = (Rotator, logger) => options => (req, res, next) => {
    const start = process.hrtime();
    const directory = options.directory == null ? '/var/log/nginx/healthd' : options.directory;
    const healthdStream = new Rotator(`${directory}/application.log`, '.yyyy-MM-dd-hh', {alwaysIncludePattern: true});
    onFinished(res, () => {
        const diff = process.hrtime(start);
        const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
        healthdStream.write(logger(Date.now() / 1e3, req.url, res.statusCode, responseTime, getIp(req)));
    });
    next();
};