// @flow weak

'use strict';

const rollers = require('streamroller');
const logger = require('./lib/logger');
const middleware = require('./lib/middleware');

module.exports = middleware(rollers.DateRollingFileStream, logger);