'use strict';

class BaseApi {
  /**
   * @type {EndpointURL}
   */
   host;
   headers;
   /**
    * should check null for parameter host before calling this constructor
    * @param {EndpointURL} host 
    * @param {SubscriptionKey} subKey 
    */
   constructor(host, subKey) {
     this.host = host;
     this.headers = {
       'Ocp-Apim-Subscription-Key': subKey
     };
   }
}

module.exports = BaseApi;

/**
 * @typedef {string} EndpointURL
 * @typedef {string} SubscriptionKey
 * @typedef {string} Guid
 */
