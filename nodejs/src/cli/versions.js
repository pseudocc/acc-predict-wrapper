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
    const api = new AccApi(getHost(argv.region, argv.port), argv.key, argv.region == 'localhost');
    const versions = await api.queryVersion();
    const pversion = typeof versions.accPredictRoleAndStyleVersion == 'string'
      ? { defaultVersion: versions.accPredictRoleAndStyleVersion }
      : versions.accPredictRoleAndStyleVersion;
    
    console.log('API version: %s', versions.apiVersion);
    console.log('Predict:');
    console.log('\tdefault version: %s', pversion.defaultVersion);
    if (pversion.supportedVersions && pversion.supportedVersions.length > 1) {
      console.log('\tall versions: %o', pversion.supportedVersions);
      console.log('\tnon-default versions are unstable and might have bugs, you should be aware of using them.');
    }
  }
};

module.exports = cliModule;
