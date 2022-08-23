'use strict';

/**
 * @param {string} content SSML file content
 * @param {import("./api/acc").AccVoice[]} voices 
 */
function prependPlugin(content, voices) {
  if (!voices || !voices.length)
    return content;
  const VoiceNameToIdMapItems = voices.map(v => ({
    Id: v.id,
    Name: v.name,
    VoiceType: v.voiceType
  }));
  const mapString = JSON.stringify({ VoiceNameToIdMapItems });
  return `<!--ID=B7267351-473F-409D-9765-754A8EBCDE05;Version=1|${mapString}-->\n${content}`;
}

/**
 * @param {number} ms number of ms to sleep
 */
function sleep(ms) {
  return new Promise(res => {
    if (ms < 0) {
      res();
      return;
    }
    setTimeout(res, ms);
  });
}

module.exports = { prependPlugin, sleep };
