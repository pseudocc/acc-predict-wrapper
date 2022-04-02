'use strict';

const { default: axios } = require('axios');

class AccApi {
  /**
   * @type {EndpointURL}
   */
  host;
  headers;
  requests;
  /**
   * should check null for parameter host before calling this constructor
   * @param {EndpointURL} host 
   * @param {SubscriptionKey} subKey 
   */
  constructor(host, subKey) {
    this.host = host;
    this.headers = {
      'accept': 'application/json',
      'Ocp-Apim-Subscription-Key': subKey,
      'Content-Type': 'application/json'
    };
    this.requests = [];
  }

  /**
   * list version infos of API
   * @returns {Promise<AccVersions>}
   */
  queryVersion() {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/voicegeneraltask/versions`;
    const p = axios.get(url, { headers: this.headers });
    return p.then(resp => {
      if (resp.status == 200)
        return resp.data;
      throw new Error('Failed to fetch version infos for this subscription.');
    });
  }

  /**
   * list all zh-CN voices of current subscription
   * @param {VoiceType[]} voiceTypes type of voices to include
   * @returns {Promise<AccVoice[]>} all available voices
   */
  async listCNVoices(voiceTypes) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/voices`;
    const data = { queryCondition: {} };
    if (voiceTypes != null) {
      data.queryCondition.item = [{
        name: 'VoiceTypeList',
        value: voiceTypes.join(','),
        operatorKind: 'Contains'
      }];
    }
    /**
     * @type {(AccVoice & {locale: string})[]}
     */
    const accVoices = await this.internalPost(url, data);
    if (!accVoices)
      return [];
    return accVoices.filter(v => v.locale.toLowerCase() === 'zh-cn');
  }

  /**
   * @param {string} voiceName name of the voice to apply
   * @param {string} content SSML content
   * @returns {string} updated SSML content
   */
  async applyVoice(voiceName, content) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/tune`;
    const data = {
      IsSelectionFullSsml: true,
      Ssml: content,
      UpdateType: 'Voice',
      Parameters: { Name: voiceName }
    };
    return await this.internalPost(url, data);
  }

  /**
   * upload ssml file to blob
   * @param {string} fileName target file name
   * @param {string} content SSML content
   * @returns {Guid[]} corresponding file Ids
   */
  async uploadSsmlFiles(fileName, content) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/uploadssmlfiles`;
    const data = {
      parentFolderId: null,
      files: [{
        name: fileName,
        content,
        tags: ['auto-uploaded']
      }],
      splitFileOptions: {
        ssmlMaxCharLengthOfPlainTextPerSegmentMode: 'SsmlFileMaxPlainTextCharLength'
      }
    };

    /**
     * @type {({vcgFiles: {id: Guid}[]})[]}
     */
    const [{ vcgFiles }] = await this.internalPost(url, data);
    return vcgFiles.map(v => v.id);
  }

  /**
   * delete ssml files
   * @param {Guid[]} fileIds files to delete
   */
  async deleteSsmlFiles(fileIds) {
    if (!fileIds || !fileIds.length)
      return;
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/delete-acc-resource-folder-or-files`;
    const data = {
      accResourceFolderOrFileIds: fileIds,
      isDeleteAssociatedAudioFiles: true
    };
    await this.internalPost(url, data);
  }

  /**
   * predict role/style for a single SSML file.
   * should upload first before calling this function.
   * @param {Guid[]} ids SSML files' Id
   * @param {{
   * name: string, 
   * voicePreferences: import('../cli/predict').VoicePreference
   * toolVersion: string
   * }} options predict API options
   * @returns {Guid} submitted batch task Id
   */
  async predictSsmlTags(ids, options) {
    if (ids == null || ids.length == 0)
      throw new Error('ids is null or empty.');
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/predictssmltags`;
    const data = {
      taskName: options.name,
      inputSsmlFolderOrFiles: ids.map(id => ({ ssmlFolderOrFileId: id })),
      predictSsmlTagsKinds: [
        'ExpressAsRole',
        'ExpressAsStyle'
      ],
      toolVersion: options.toolVersion
    };
    if (options.voicePreferences) {
      data.rolePreferredVoiceInfos = options.voicePreferences;
      data.predictSsmlTagsKinds.push('VoicePreference');
    }

    /**
     * @type {{submittedTask: {id: Guid}}}
     */
    const { submittedTask } = await this.internalPost(url, data);
    return submittedTask.id;

  }

  /**
   * query the processing status of a batch task by Id.
   * @param {Guid} id batch task id
   */
  async queryBatchTask(id) {
    if (!id)
      throw new Error('id is null or empty.');
    const url = `${this.host}/api/texttospeech/v3.0-beta1/voicegeneraltask/vcgpredictssmltagtasks`;
    const data = {
      modules: ['VcgPredictSsmlTag'],
      queryCondition: {
        items: [
          {
            name: 'Id',
            value: id,
            operatorKind: 'Equal'
          },
          {
            name: 'StateList',
            value: 'None,Waiting,Processing,Complete,Failed',
            operatorKind: 'Contains'
          }
        ],
        responseSettings: { IsIncludeArtifactUrlWithSas: true }
      }
    };

    /**
     * @type {{tasks: {
     * id: Guid,
     * state: BatchState
     * reportFile: {endpointWithSas: EndpointURL}
     * }[]}}
     */
    const { tasks: [thisTask] } = await this.internalPost(url, data);
    return thisTask;
  }


  /**
   * get the content of SSML file by Id
   * @param {Guid} id SSML file Id
   */
  async querySsmlContent(id) {
    if (!id == null)
      throw new Error('id is null or empty.');
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/queryaccresourcefolderorfiles`;
    const data = {
      queryCondition: {
        items: [{
          name: 'Id',
          value: id,
          operatorKind: 'Equal'
        }],
        responseSettings: { IncludePropertiesInFile: "Content" }
      }
    };
    /**
     * @type {{accResourceFolderOrFiles: {
     * name: string,
     * properties: {Content: string}
     * }[]}}
     */
    const { accResourceFolderOrFiles: [thisFile] } = await this.internalPost(url, data);
    return thisFile;
  }

  /**
   * query polyphone words' pronuciation
   * @param {string} text 
   * @param {{offset?: number, length?: number}} range 
   * @returns 
   */
  async queryZhCNPolyPhonePron(text, range) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/query-polyphone-pron`;
    const data = {
      selectionOfPlainText: range,
      language: 'zh-CN',
      plainText: text,
      phoneSetTypeNames: ['Sapi']
    };
    const { polyphoneWords } = await this.internalPost(url, data);
    const response = [];
    for (const pw of polyphoneWords) {
      if (pw.syllables && pw.syllables[0] && pw.syllables[0].phones && pw.syllables[0].phones[0]) {
        response.push({
          text: pw.text,
          position: pw.position,
          pronunciation: pw.syllables[0].phones[0].sapiPhone
        });
      }
    }
    return response;
  }

  async internalPost(url, data) {
    const requestLimit = 50;
    const limitWindow = 5000;
    let maxRetry = 10;
    do {
      while (this.requests.length >= requestLimit) {
        const timestamp = this.requests.shift();
        await sleep(timestamp + limitWindow - Date.now());
      }
      this.requests.push(Date.now());
      try {
        const resp = await axios.post(url, data, { headers: this.headers });
        if (resp.status == 200 || resp.status == 202)
          return resp.data;
      }
      catch (e) {
        const resp = e.response;
        if (resp.status == 503 || resp.status == 429) {
          const delay = resp.headers['retry-after'] || 1; // seconds
          if (maxRetry--) {
            await sleep(delay * 1000);
            continue;
          }
        }
        throw e;
      }
    } while (true);
  }
};

function sleep(ms) {
  return new Promise(res => {
    if (ms < 0) {
      res();
      return;
    }
    setTimeout(res, ms);
  });
}

module.exports = AccApi;

/**
 * @typedef {string} EndpointURL
 * @typedef {string} SubscriptionKey
 * @typedef {string} Guid
 *
 * @typedef {"StandardVoice"|"OwnTypicalCustomVoice"|"SpecialCustomVoice"
 * |"OtherTypicalCustomVoice"|"OwnBatchVoice"} VoiceType
 *
 * @typedef {"Waiting"|"Processing"|"Complete"|"Failed"} BatchState
 *
 * @typedef {ListVoicesFunc|UploadSsmlFilesFunc|PredictSsmlTagsFunc
 * |QueryBatchStatusFunc|QuerySsmlContentFunc} AbstractNotImpl
 *
 * @typedef {object} AccVoice
 * @property {string} id
 * @property {string} name
 * @property {VoiceType} voiceType
 *
 * @typedef {object} AccExternToolVersion
 * @property {string} defaultVersion
 * @property {string[]} supportedVersions
 *
 * @typedef {object} AccVersions
 * @property {string} apiVersion
 * @property {AccExternToolVersion|string} accPredictRoleAndStyleVersion
 */
