'use strict';

const { default: axios } = require('axios');
const https = require('https');

class AccApi {
  /**
   * @type {EndpointURL}
   */
  host;
  headers;
  /**
   * should check null for parameter host before calling this constructor
   * @param {EndpointURL} host 
   * @param {SubscriptionKey} subKey 
   * @param {boolean} isLocalhost
   */
  constructor(host, subKey, isLocalhost) {
    this.host = host;
    this.headers = {
      'accept': 'application/json',
      'Ocp-Apim-Subscription-Key': subKey,
      'Content-Type': 'application/json'
    };
    this.httpsAgent = isLocalhost
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;
  }

  get axiosConfig() {
    return ({ headers: this.headers, httpsAgent: this.httpsAgent });
  }

  /**
   * list version infos of API
   * @returns {Promise<AccVersions>}
   */
  queryVersion() {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/voicegeneraltask/versions`;
    const p = axios.get(url, this.axiosConfig);
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
  listCNVoices(voiceTypes) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/voices`;
    const data = { queryCondition: {} };
    if (voiceTypes != null) {
      data.queryCondition.item = [{
        name: 'VoiceTypeList',
        value: voiceTypes.join(','),
        operatorKind: 'Contains'
      }];
    }
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200) {
        /**
         * @type {(AccVoice & {locale: string})[]}
         */
        const accVoices = resp.data;
        if (!accVoices)
          return [];
        return accVoices.filter(v => v.locale.toLowerCase() === 'zh-cn');
      }
      throw new Error('Failed to fetch voices for this subscription.');
    });
  }

  /**
   * @param {string} voiceName name of the voice to apply
   * @param {string} content SSML content
   * @returns {string} updated SSML content
   */
  applyVoice(voiceName, content) {
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/tune`;
    const data = {
      IsSelectionFullSsml: true,
      Ssml: content,
      UpdateType: 'Voice',
      Parameters: { Name: voiceName }
    };
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200)
        return resp.data;
      throw new Error('Failed to apply voice for the SSML');
    });
  }

  /**
   * upload ssml file to blob
   * @param {string} fileName target file name
   * @param {string} content SSML content
   * @returns {Guid[]} corresponding file Ids
   */
  uploadSsmlFiles(fileName, content) {
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
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200) {
        /**
         * @type {({vcgFiles: {id: Guid}[]})[]}
         */
        const [{ vcgFiles }] = resp.data;
        return vcgFiles.map(v => v.id);
      }
      throw new Error('Failed to upload file to ACC.');
    });
  }

  /**
   * delete ssml files
   * @param {Guid[]} fileIds files to delete
   */
  deleteSsmlFiles(fileIds) {
    if (!fileIds || !fileIds.length)
      return;
    const url = `${this.host}/api/texttospeech/v3.0-beta1/vcg/delete-acc-resource-folder-or-files`;
    const data = {
      accResourceFolderOrFileIds: fileIds,
      isDeleteAssociatedAudioFiles: true
    };
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200 || resp.status == 202)
        return;
      throw new Error('Failed to delete files from ACC.');
    });
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
  predictSsmlTags(ids, options) {
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
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200) {
        /**
         * @type {{submittedTask: {id: Guid}}}
         */
        const { submittedTask } = resp.data;
        return submittedTask.id;
      }
      throw new Error('Failed to submit prediction task.');
    });
  }

  /**
   * query the processing status of a batch task by Id.
   * @param {Guid} id batch task id
   */
  queryBatchTask(id) {
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
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200) {
        /**
         * @type {{tasks: {
         * id: Guid,
         * state: BatchState
         * reportFile: {endpointWithSas: EndpointURL}
         * }[]}}
         */
        const { tasks: [thisTask] } = resp.data;
        return thisTask;
      }
      throw new Error('Failed to query prediction processing state.');
    });
  }

  /**
   * get the content of SSML file by Id
   * @param {Guid} id SSML file Id
   */
  querySsmlContent(id) {
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
    const p = axios.post(url, data, this.axiosConfig);
    return p.then(resp => {
      if (resp.status == 200) {
        /**
         * @type {{accResourceFolderOrFiles: {
         * name: string,
         * properties: {Content: string}
         * }[]}}
         */
        const { accResourceFolderOrFiles: [thisFile] } = resp.data;
        return thisFile;
      }
      throw new Error('Failed to fetch file content.');
    });
  }
};

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
