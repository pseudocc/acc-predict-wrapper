'use strict';

const BaseApi = require('./base');
const { default: axios } = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

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
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributesGroupName: "#",
      attributeNamePrefix: '',
      alwaysCreateTextNode: true
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributesGroupName: "#",
      alwaysCreateTextNode: true,
      suppressEmptyNode: false,
      unpairedTags: ['mstts:task', 's'],
    });
  }

  /**
   * Predict role and style for SSML
   * @param {string} ssml 
   * @returns {[string, import('./acc').ExpressAsObject[]]}
   */
  async predictRoleAndStyle(ssml) {
    if (ssml == null || ssml.length == 0)
      throw new Error('SSML is null or empty.');
    const obj = this.parser.parse(ssml);
    const trimmedSsml = this.builder.build(obj);
    obj.speak.voice = {
      'mstts:task': { '#': { name: 'RoleStyle' } },
      ...obj.speak.voice
    };
    const wrappedSsml = this.builder.build(obj);
    const resp = await axios.post(this.host, wrappedSsml, { headers: this.headers });
    if (resp.status != 200 || !resp.data.IsValid)
      return null;
    const seq = resp.data.Conversations.map(c => ({
      offset: c.Begin,
      length: c.End - c.Begin,
      role: c.Role,
      style: c.Style
    }));
    return [trimmedSsml, seq];
  }
};

module.exports = TtsApi;
