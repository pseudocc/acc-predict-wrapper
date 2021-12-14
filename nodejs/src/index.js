'use strict';

const yargs = require('yargs');
const voices = require('./cli/voices');
const versions = require('./cli/versions');
const predict = require('./cli/predict');

function check(argv) {
  const [command] = argv._;
  if (command != 'predict' || argv.voice)
    return true;

  /**
   * @type {{preferences: import('./cli/predict').VoicePreference[]}}
   */
  const { preferences } = argv;
  let hasNarrator = false;
  for (const p of preferences) {
    if (p.roleName == 'Narrator')
      hasNarrator = true;
    switch (p.roleName) {
      case 'Narrator':
      case 'YoungAdultMale':
      case 'OlderAdultMale':
      case 'SeniorMale':
      case 'YoungAdultFemale':
      case 'OlderAdultFemale':
      case 'SeniorFemale':
      case 'Boy':
      case 'Girl':
        break;
      default:
        console.error('Unexpected role name: %s', p.roleName);
        return false;
    }
    switch (p.preferredVoiceInfo.type) {
      case 'OwnBatchVoice':
      case 'StandardVoice':
      case 'SpecialCustomVoice':
      case 'OwnTypicalCustomVoice':
      case 'OtherTypicalCustomVoice':
        break;
      default:
        console.error('Unexpected type: %s', p.preferredVoiceInfo.type);
        return false;
    }
  }
  if (!hasNarrator) {
    console.error('Should include the preferred voice for narrator.');
    return false;
  }
  return true;
}

if (require.main == module) {
  yargs
    .command(voices)
    .command(predict)
    .command(versions)
    .demandCommand()
    .check(check)
    .argv;
}
