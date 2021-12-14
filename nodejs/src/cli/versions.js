'use strict';

const { AccApi, getHost } = require('../api');
const commonBuilder = require('./common');

const cliModule = {
  command: 'versions [options]',
  description: 'List version infos of API.',
  builder: {
    ...commonBuilder
  },
  handler: async function (argv) {
    const api = new AccApi(getHost(argv.region, argv.port), argv.key);
    const versions = await api.queryVersion();
    const pversion = versions.accPredictRoleAndStyleVersion;
    
    console.log('API version: %s', versions.apiVersion);
    console.log('Predict:');
    console.log('\tcurrent version: %s', pversion.current);
    if (pversion.others && pversion.others.length) {
      console.log('\tother versions: %o', pversion.others);
      console.log('\tnon-current versions are unstable and might have bugs.');
    }
  }
};

module.exports = cliModule;
