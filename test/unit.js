'use strict';

const assert = require('chai').assert;
const rewire = require('rewire');
const sinon = require('sinon');
const onFinished = require('on-finished');
const EventEmitter = require('events');

describe('unit tests', () => {

    describe('logger', () => {

        const logger = require('../lib/logger');

        it('should log in the appropriate format', () => {
            const expected = '123.566"/test"200"7.14"7.14"10.0.0.1\n';
            const actual = logger(123.566, '/test', 200, 7.14, '10.0.0.1');
            assert.strictEqual(actual, expected);
        });

    });

    describe('middleware', () => {
        const middleware = require('../lib/middleware');

        it('should populate default values', () => {
            const output = {};

            const mockRotator = function(filename, pattern, options) {
                output.filename = filename;
                output.pattern = pattern;
                output.options = options;
            };

            middleware(mockRotator, onFinished)({})('req', 'res', () => {});
            assert.strictEqual(output.filename, '/var/log/nginx/healthd/application.log');
            assert.strictEqual(output.pattern, '.yyyy-MM-dd-hh');
            assert.deepEqual(output.options, {alwaysIncludePattern: true});
        });

        it('should use specified directory', () => {
            const output = {};

            const mockRotator = function(filename, pattern, options) {
                output.filename = filename;
                output.pattern = pattern;
                output.options = options;
            };

            middleware(mockRotator, onFinished)({directory: '/path/to/dir'})('req', 'res', () => {});
            assert.strictEqual(output.filename, '/path/to/dir/application.log');
            assert.strictEqual(output.pattern, '.yyyy-MM-dd-hh');
            assert.deepEqual(output.options, {alwaysIncludePattern: true});
        });

    });

    describe('index', () => {
        const index = require('..');

        it('should return a function', () => {
            const middleware = index({});
            assert.isFunction(middleware);
            assert.strictEqual(middleware.length, 3);
        });

    });

});