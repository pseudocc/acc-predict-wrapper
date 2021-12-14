'use strict';

const AccApi = require('./acc');

/**
 * Base URL for all REST API calls
 * @param {string} region where your cognitive service - text to speech creates
 * @param {number} port optional parameter indicating port for localhost server
 * @returns {HostURL|null} return null when region is not supported
 */
function getHost(region, port) {
  if (region) {
    if (region == 'localhost')
      return `https://localhost:${port}`;
    return `https://${region.toLowerCase()}.customvoice.api.speech.microsoft.com`;
  }
  return null;
}

module.exports = {
  AccApi,
  getHost
};
