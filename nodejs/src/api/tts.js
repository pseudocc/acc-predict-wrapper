'use strict';

const BaseApi = require('./base');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const { sleep } = require('../utils');

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

    let resp;
    let maxRetry = 10;
    do {
      try {
        resp = await axios.post(this.host, wrappedSsml, { headers: this.headers });
        break;
      }
      catch (e) {
        const resp = e.response;
        if (resp != null && (resp.status == 503 || resp.status == 429)) {
          e.busy = 1;
        }
        if (maxRetry--) {
          await sleep(1000);
          continue;
        }
        throw e;
      }
    } while (maxRetry);

    if (resp.status != 200 || !resp.data.IsValid)
      return null;

    const seq = resp.data.Conversations.map(c => ({
      offset: c.Begin,
      length: c.End - c.Begin,
      text: c.Content,
      role: c.Role,
      style: c.Style
    }));

    return adjust_offset(ssml, seq);
  }
};

/**
 * offset returned by TTS API is not compatible with ACC API.
 * @param {string} ssml 
 * @param {import('./acc').ExpressAsObject[]} seq 
 * @returns {import('./acc').ExpressAsObject[]}
 */
function adjust_offset(ssml, seq) {
  const xml_obj = cheerio.load(ssml, { xml: true });
  const inner_text = xml_obj.text();
  let bias = 0;
  for (const eo of seq) {
    if (!eo.text)
      throw new Error('Property text is null or empty and cannot be referred to: '
        + `${JSON.stringify(eo)}.`);
    const corrected_offset = inner_text.indexOf(eo.text, bias + eo.offset);
    if (corrected_offset == -1)
      throw new Error(`Failed to adjust offset for ${JSON.stringify(eo)}.`);
    bias = corrected_offset - eo.offset;
    eo.offset = corrected_offset;
    delete eo.text;
  }

  return seq;
}

module.exports = TtsApi;
