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

  describe('# Predict SSML', function () {
    this.timeout(1e6);
    it('should success', function (done) {
      const p = fork(entry, [
        'predict',
        `--key="${testKey}"`,
        `--region=${testRegion}`,
        `--input="${path.join(testRoot, 'test.xml')}"`,
        `--output="${path.join(testRoot, 'output')}"`,
        `--preferences="${path.join(testRoot, 'preset.json')}"`
      ]);
      p.on('exit', function (code) {
        assert.equal(code, 0);
        assert.ok(fs.existsSync(path.join(testRoot, 'output', 'test.xml')));
        done();
      });
    });
  });
});
