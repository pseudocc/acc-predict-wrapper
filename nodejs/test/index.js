'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const inquirer = require('inquirer');
const { fork } = require('child_process');

let testKey;
let testRegion;

const entry = path.resolve(__dirname, '..', 'src', 'index.js');
const testRoot = path.resolve(__dirname, '..', '..', 'test');

describe('Unit test', function () {
  before(function (done) {
    this.timeout(Number.MAX_SAFE_INTEGER);
    inquirer
      .prompt([
        {
          type: 'password',
          name: 'subKey',
          message: 'subscription key',
          mask: '*'
        },
        {
          type: 'list',
          name: 'region',
          message: 'region',
          choices: require('../src/cli/common').region.choices
        }
      ])
      .then(function (answers) {
        testKey = answers.subKey;
        testRegion = answers.region;
      })
      .catch(function (error) {
        if (error.isTtyError)
          console.error("Prompt couldn't be rendered in the current environment");
        else
          console.error(error);
      })
      .finally(done);
  });

  describe('# List voices', function () {
    this.timeout(1e4);
    it('should success', function (done) {
      const p = fork(entry, [
        'voices',
        `--key="${testKey}"`,
        `--region=${testRegion}`
      ]);
      p.on('exit', function (code) {
        assert.equal(code, 0);
        done();
      });
    });
  });

  describe('# polypohone', function () {
    this.timeout(1e4);
    const outputPath = path.join(testRoot, 'output', 'pron.json');
    it('should success', function (done) {
      const p = fork(entry, [
        'polyphone',
        `--key="${testKey}"`,
        `--region=${testRegion}`,
        `--input="${path.join(testRoot, 'input.txt')}"`,
        `--output="${outputPath}"`
      ]);
      p.on('exit', function (code) {
        assert.equal(code, 0);
        assert.ok(fs.existsSync(outputPath));
        done();
      });
    });
  });

  describe('# Predict SSML', function () {
    describe('monocast', function () {
      this.timeout(1e6);
      const outputRoot = path.join(testRoot, 'output', 'monocast');
      it('should success', function (done) {
        const p = fork(entry, [
          'predict',
          `--key="${testKey}"`,
          `--region=${testRegion}`,
          `--input="${path.join(testRoot, 'test.xml')}"`,
          `--output="${outputRoot}"`,
          '--voice="XiaomoNeural"',
          '--clean'
        ]);
        p.on('exit', function (code) {
          assert.equal(code, 0);
          assert.ok(fs.existsSync(path.join(outputRoot, 'test.xml')));
          done();
        });
      });
    });

    describe('multicast', function () {
      this.timeout(1e6);
      const outputRoot = path.join(testRoot, 'output', 'multicast');
      it('should success', function (done) {
        const p = fork(entry, [
          'predict',
          `--key="${testKey}"`,
          `--region=${testRegion}`,
          `--input="${path.join(testRoot, 'test.xml')}"`,
          `--output="${outputRoot}"`,
          `--preferences="${path.join(testRoot, 'preset.json')}"`,
          '--clean'
        ]);
        p.on('exit', function (code) {
          assert.equal(code, 0);
          assert.ok(fs.existsSync(path.join(outputRoot, 'test.xml')));
          done();
        });
      });
    });

    describe('monocast tts', function () {
      this.timeout(1e4);
      const outputRoot = path.join(testRoot, 'output', 'monocast-tts');
      it('should success', function (done) {
        const p = fork(entry, [
          'predict',
          `--key="${testKey}"`,
          `--region=${testRegion}`,
          `--input="${path.join(testRoot, 'test.xml')}"`,
          `--output="${outputRoot}"`,
          '--voice="XiaomoNeural"',
          '--api=tts'
        ]);
        p.on('exit', function (code) {
          assert.equal(code, 0);
          assert.ok(fs.existsSync(path.join(outputRoot, 'test.xml')));
          done();
        });
      });
    });
  });
});
