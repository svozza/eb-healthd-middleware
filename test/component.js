const supertest = require('supertest');
const mockFs = require('mock-fs');
const mockDate = require('mockdate');
const middleware = require('../lib/middleware');
const sinon = require('sinon');
const rollers = require('streamroller');
const fs = require('fs');
const assert = require('chai').assert;

describe('component tests', () => {
    const year = new Date().getFullYear();
    const date = new Date(`${year}-01-01T01:00:00`);
    const logDateStr = `${year}-01-01-01`;
    const logFilePrefix = '/var/log/nginx/healthd/application.log';

    const logFile = `${logFilePrefix}.${logDateStr}`;

    describe('restify', () => {
        const logStub = sinon.stub().returns('test logger');

        const ebHealth = middleware(rollers.DateRollingFileStream, logStub);
        const app = require('./fixtures/restify/app')(ebHealth);

        const request = supertest(app);

        beforeEach(done => {
            mockFs({
                '/var/log/nginx/healthd': {}
            });

            mockDate.set(date);
            done();
        });

        afterEach(done => {
            mockFs.restore();
            mockDate.reset();
            logStub.reset();
            done();
        });

        it('should extract info from the request and response objects', () => {
            return request
                .get('/test')
                .set('x-forwarded-for', '10.0.0.1')
                .then(() => {
                    const loggerArgs = logStub.args[0];
                    assert.strictEqual(loggerArgs[0], date.getTime() / 1e3);
                    assert.strictEqual(loggerArgs[1], '/test');
                    assert.strictEqual(loggerArgs[2], 200);
                    assert.strictEqual(loggerArgs[4], '10.0.0.1');
                });
        });

        it('should output to a file when a request is made', () => {
            return request
                .get('/test')
                .then(() => {
                    const file = fs.readFileSync(logFile);
                    assert.strictEqual(file.toString(), 'test logger');
                });
        });

        it('should roll the log file hourly', () => {
            const logFile2 = `${logFilePrefix}.${year}-01-01-02`;

            return request
                .get('/test')
                .then(() => {
                    assert.doesNotThrow(() => fs.statSync(logFile));
                })
                .then(() => {
                    mockDate.set(new Date(`${year}-01-01T02:00:00`));
                    return request
                        .get('/test')
                })
                .then(() => {
                    const file = fs.readFileSync(logFile2);
                    assert.strictEqual(file.toString(), 'test logger');
                })
        });

    });

    describe('express', () => {
        const logStub = sinon.stub().returns('test logger');

        const ebHealth = middleware(rollers.DateRollingFileStream, logStub);
        const app = require('./fixtures/express/app')(ebHealth);

        const request = supertest(app);

        beforeEach(done => {
            mockFs({
                '/var/log/nginx/healthd': {}
            });

            mockDate.set(date);
            done();
        });

        afterEach(done => {
            mockFs.restore();
            mockDate.reset();
            logStub.reset();
            done();
        });

        it('should extract info from the request and response objects', () => {
            return request
                .get('/test')
                .set('x-forwarded-for', '10.0.0.1')
                .then(() => {
                    const loggerArgs = logStub.args[0];
                    assert.strictEqual(loggerArgs[0], date.getTime() / 1e3);
                    assert.strictEqual(loggerArgs[1], '/test');
                    assert.strictEqual(loggerArgs[2], 200);
                    assert.strictEqual(loggerArgs[4], '10.0.0.1');
                });
        });

        it('should output to a file when a request is made', () => {
            return request
                .get('/test')
                .then(() => {
                    const file = fs.readFileSync(logFile);
                    assert.strictEqual(file.toString(), 'test logger');
                });
        });

        it('should roll the log file hourly', () => {
            const logFile2 = `${logFilePrefix}.${year}-01-01-02`;

            return request
                .get('/test')
                .then(() => {
                    assert.doesNotThrow(() => fs.statSync(logFile));
                })
                .then(() => {
                    mockDate.set(new Date(`${year}-01-01T02:00:00`));
                    return request
                        .get('/test')
                })
                .then(() => {
                    const file = fs.readFileSync(logFile2);
                    assert.strictEqual(file.toString(), 'test logger');
                })
        });

    });

});