'use strict';

const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const inquirer = require('inquirer');
const { default: axios } = require('axios');
const { AccApi, getHost } = require('../api');
const commonBuilder = require('./common');
const { prependPlugin } = require('../utils');

/**
 * sleep for a while
 * @param {number} ms 
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {AccApi} api 
 * @param {string} voice 
 * @returns {AccApi.AccVoice}
 */
async function pickVoice(api, voice) {
  const allVoices = await api.listCNVoices();
  const candidates = allVoices.filter(v => v.name.includes(voice));
  switch (candidates.length) {
    case 0:
      throw new Error('Fail to find the specific voice with name: ' + voice);
    case 1:
      [voice] = candidates;
      break;
    default:
      await inquirer
        .prompt([{
          type: 'list',
          name: 'voice',
          message: 'voice name',
          choices: candidates
        }])
        .then(function (answers) {
          voice = candidates.find(v => v.name == answers.voice);
        })
        .catch(function (error) {
          if (error.isTtyError)
            throw new Error("Prompt couldn't be rendered in the current environment");

          else
            throw error;
        });
      break;
  }

  return voice;
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
        return arg && require(path.resolve(arg));
      },
      conflicts: 'voice',
      description: 'A JSON file indicating the voice perferences for different roles. '
        + 'Role names and voice types are case-sensitive. '
        + 'This is the parameter for multicast performance.'
    },
    voice: {
      alias: 'v',
      conflicts: 'preferences',
      description: 'The name of the voice to apply to the whole SSML file. '
        + 'This is the parameter for monocast performance.'
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
    },
    tool: {
      alias: 't',
      description: 'The version of the prediction tool. use `versions` command to list all supported values.'
    }
  },
  handler: async function (argv) {
    const api = new AccApi(getHost(argv.region), argv.key);
    const encoding = argv.encoding;
    const name = argv.name || uuid.v4();
    const extname = path.extname(argv.input);
    const basename = path.basename(argv.input, extname);
    /**
     * @type {VoicePreference[]}
     */
    const voicePreferences = argv.preferences;

    try {
      const voice = argv.voice
        ? await pickVoice(api, argv.voice)
        : voicePreferences.find(v => v.roleName == 'Narrator').preferredVoiceInfo;
      
      let content = await fs.promises.readFile(argv.input, { encoding });
      content = await api.applyVoice(voice.name, content);
      console.log('Applied voice %s to the whole SSML file.', voice.name);
      
      // for multicast API call the plugin will be created automatically
      if (!voicePreferences)
        content = prependPlugin(content, [voice]);
      console.log('Length of the content: %d', content.length);

      const fileIds = await api.uploadSsmlFiles(name, content);
      console.log('Upload successfully, corresponding file Ids: ', fileIds);

      const taskId = await api.predictSsmlTags(fileIds, { voicePreferences });
      console.log('Prediction task was submitted.\nStart to tracking task: %s', taskId);

      while (true) {
        const task = await api.queryBatchTask(taskId);
        if (task.state == 'Complete')
          break;
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
