'use strict';

const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const { AccApi, getHost } = require('../api');
const commonBuilder = require('./common');
const { default: axios } = require('axios');

/**
 * sleep for a while
 * @param {number} ms 
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const cliModule = {
  command: 'predict [options]',
  description: 'Predict a single SSML file.',
  builder: {
    ...commonBuilder,
    input: {
      alias: 'i',
      demandOption: true,
      description: 'The input SSML file to predict.'
    },
    output: {
      alias: 'o',
      demandOption: true,
      description: 'The output directory to store the predicted results.'
    },
    preferences: {
      alias: 'p',
      coerce: function (arg) {
        const jsonAbsPath = path.resolve(arg);
        return require(jsonAbsPath);
      },
      demandOption: true,
      description: 'A JSON file indicating the voice perferences for different roles. '
        + 'Role names and voice types are case-sensitive.'
    },
    name: {
      alias: 'n',
      description: 'The file name under the root directory. '
        + 'If not given, a GUID will be generated as the file name.'
    },
    encoding: {
      alias: 'e',
      choices: ['ascii', 'utf8', 'utf-8', 'utf16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex'],
      default: 'utf8',
      description: 'The encoding for the input and output ssml file.'
    }
  },
  handler: async function (argv) {
    const api = new AccApi(getHost(argv.region), argv.key);
    const encoding = argv.encoding;
    const voicePreferences = argv.preferences;
    const name = argv.name || uuid.v4();
    const extname = path.extname(argv.input);
    const basename = path.basename(argv.input, extname);

    try {
      const content = await fs.promises.readFile(argv.input, { encoding });
      console.log('Length of the content: %d', content.length);
      const fileIds = await api.uploadSsmlFiles(name, content.toString());
      console.log('Upload successfully, corresponding file Ids: ', fileIds);
      const taskId = await api.predictSsmlTags(fileIds, { voicePreferences });
      console.log('Prediction task was submitted, start to tracking task [%s]', taskId);

      while (true) {
        const task = await api.queryBatchTask(taskId);
        if (task.state == 'Complete') {
          const report = await axios.get(task.reportFile.endpointWithSas);
          console.log(report.data);
          break;
        }
        if (task.state == 'Failed') {
          const report = await axios.get(task.reportFile.endpointWithSas);
          console.error(report.data);
          process.exit(1);
        }
        await sleep(1e4);
      }

      if (!fs.existsSync(argv.output))
        fs.mkdirSync(argv.output);

      for (const fileId of fileIds) {
        const ssmlFile = await api.querySsmlContent(fileId);
        const content = ssmlFile.properties.Content;
        const suffix = ssmlFile.name.replace(name, '');
        const outputPath = path.join(argv.output, basename + suffix + extname);
        fs.writeFile(outputPath, content, { encoding }, function () {
          console.log('File %s is downloaded successfully.', ssmlFile.name);
        });
      }
    }
    catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
};

/**
 * @typedef {"Narrator"|"YoungAdultMale"|"OlderAdultMale"|"SeniorMale"|"YoungAdultFemale"
 * |"OlderAdultFemale"|"SeniorFemale"|"Boy"|"Girl"} ExpressAsRole
 * 
 * @typedef {object} VoicePreference
 * @property {ExpressAsRole} roleName
 * @property {PreferredVoiceInfo} preferredVoiceInfo
 * 
 * @typedef {object} PreferredVoiceInfo
 * @property {string} name
 * @property {AccApi.Guid} id
 * @property {AccApi.VoiceType} type
 */

module.exports = cliModule;
