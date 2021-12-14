'use strict';

const commonBuilder = {
  key: {
    alias: 'k',
    demandOption: true,
    description: 'This key is used to access your Cognitive Service API.'
  },
  region: {
    alias: 'r',
    choices: [
      'localhost',
      'southeastasia',
      'eastasia',
      'japaneast',
      'japanwest',
      'koreacentral',
      'centralindia',
      'australiaeast',
      'brazilsouth',
      'canadacentral',
      'eastus',
      'eastus2',
      'francecentral',
      'northeurope',
      'westeurope',
      'southafricanorth',
      'uksouth',
      'centralus',
      'northcentralus',
      'southcentralus',
      'westus',
      'westus2',
      'westcentralus'
    ],
    demandOption: true,
    description: 'This is the location (or region) of your resource. '
      + 'You may need to use this field when making calls to the speech service API.'
  },
  port: {
    default: 44311,
    description: 'localhost port.'
  }
};

module.exports = commonBuilder;
