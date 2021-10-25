'use strict';

const AccApi = require('./acc');

/**
 * Base URL for all REST API calls
 * @param {string} region where your cognitive service - text to speech creates
 * @returns {HostURL|null} return null when region is not supported
 */
function getHost(region) {
  if (region)
    return `https://${region.toLowerCase()}.customvoice.api.speech.microsoft.com`;
  return null;
}

module.exports = {
  AccApi,
  getHost
};
