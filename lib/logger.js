// @flow weak

'use strict';

module.exports = (unixTime, url, statusCode, responseTime, remoteAddr) => {
    return [unixTime, url, statusCode, responseTime, responseTime, remoteAddr].join('"') + '\n';
};