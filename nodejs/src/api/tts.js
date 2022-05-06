'use strict';

const BaseApi = require('./base');
const { default: axios } = require('axios');

class TtsApi extends BaseApi {
  parser;
  builder;
  /**
   * should check null for parameter host before calling this constructor
   * @param {BaseApi.EndpointURL} host 
   * @param {BaseApi.SubscriptionKey} subKey 
   */
  constructor(host, subKey) {
    super(host, subKey);
    this.headers['accept'] = 'application/json';
    this.headers['Content-Type'] = 'application/ssml+xml';
    this.headers['X-Microsoft-OutputFormat'] = 'textanalytics-json';
  }

  /**
   * Predict role and style for SSML
   * @param {string} ssml 
   * @returns {import('./acc').ExpressAsObject[]}
   */
  async predictRoleAndStyle(ssml) {
    if (ssml == null || ssml.length == 0)
      throw new Error('SSML is null or empty.');
    const match = /<voice\s+name="[^"]+"\s*>/.exec(ssml);
    const wrappedSsml = ssml.substring(0, match.index)
      + match[0]
      + '<mstts:task name="RoleStyle" />'
      + ssml.substring(match.index + match[0].length);

    const resp = await axios.post(this.host, wrappedSsml, { headers: this.headers });
    if (resp.status != 200 || !resp.data.IsValid)
      return null;

    const seq = resp.data.Conversations.map(c => ({
      offset: c.Begin,
      length: c.End - c.Begin,
      role: c.Role,
      style: c.Style
    }));

    return seq;
  }
};

module.exports = TtsApi;
