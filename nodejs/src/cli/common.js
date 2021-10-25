'use strict';

const commonBuilder = {
  key: {
    alias: 'k',
    demandOption: true,
    description: 'This key is used to access your Cognitive Service API.'
  },
  region: {
    alias: 'r',
    choices: ['southeastasia'],
    demandOption: true,
    description: 'This is the location (or region) of your resource. '
      + 'You may need to use this field when making calls to the speech service API.'
  }
};

module.exports = commonBuilder;
