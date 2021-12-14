'use strict';

const { AccApi, getHost } = require('../api');
const commonBuilder = require('./common');

const cliModule = {
  command: 'voices [options]',
  description: 'List all zh-CN voices that given subscription contains.',
  builder: {
    ...commonBuilder
  },
  handler: async function (argv) {
    const api = new AccApi(getHost(argv.region, argv.port), argv.key);
    const voices = await api.listCNVoices();
    
    for (const voice of voices) {
      console.log({
        name: voice.name,
        id: voice.id,
        type: voice.voiceType
      });
    }
  }
};

module.exports = cliModule;
