'use strict';

const AccApi = require('./acc');
const TtsApi = require('./tts');

/**
 * Base URL for all REST API calls
 * @param {string} region where your cognitive service - text to speech creates
 * @param {HostType} type
 * @returns {HostURL|null} return null when region is not supported
 */
function getHost(region, type = 'acc') {
  if (!region)
    return null;
  region = region.toLocaleLowerCase();
  switch (type) {
    case 'acc':
      return `https://${region}.customvoice.api.speech.microsoft.com`;
    case 'tts':
      return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    default:
      break;
  }
  return null;
}

module.exports = {
  AccApi,
  TtsApi,
  getHost
};

/**
 * @typedef {'tts'|'acc'} HostType
 */