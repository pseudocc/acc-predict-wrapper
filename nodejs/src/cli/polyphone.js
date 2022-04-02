'use strict';

const fs = require('fs');
const { writeFileSync } = require('jsonfile');
const { AccApi, getHost } = require('../api');
const commonBuilder = require('./common');

const errorSymbol = Symbol('ERRORRED');

const cliModule = {
  command: 'polyphone [options]',
  description: 'Query polyphone words\' pronunciation.',
  builder: {
    ...commonBuilder,
    input: {
      alias: 'i',
      demandOption: true,
      description: 'The input plain text file.'
    },
    output: {
      alias: 'o',
      demandOption: true,
      description: 'The output JSON file.'
    },
    encoding: {
      alias: 'e',
      choices: ['ascii', 'utf8', 'utf-8', 'utf16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex'],
      default: 'utf8',
      description: 'The encoding for the input text file.'
    }
  },
  handler: async function (argv) {
    const { region, key, input, encoding, output } = argv;
    const api = new AccApi(getHost(region), key);
    try {
      const promises = [];
      const content = await fs.promises.readFile(input, { encoding });
      const lines = content.split(/\n|\r\n/g);
      for (const text of lines) {
        promises.push(tryQueryPron(api, text));
      }
      const results = await Promise.all(promises);
      const response = [];
      let line = 1;
      for (const result of results) {
        if (result == errorSymbol) {
          response.push({ text: lines[line - 1], line, errorred: true });
        }
        else if (result) {
          const filtered = [];
          for (const word of result) {
            if (Array.prototype.some.call(word.text, checkPolyphone)) {
              filtered.push(word);
            }
          }
          response.push({ text: lines[line - 1], line, result: filtered });
        }
        line++;
      }
      writeFileSync(output, response, { encoding, spaces: 2 });
    }
    catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
};

// This is only a walkaround since the API did not handle multiple
// utterances input successfully.
// the length of each element in the set must be 1.
const sentenceBreak = new Set(['。', '！', '？', '…', '!', '?']);
const checkSentenceBreak = Set.prototype.has.bind(sentenceBreak);
async function tryQueryPron(api, text) {
  let response;
  if (!text)
    return null;

  try {
    let offset = 0;
    let length = 0;
    let hasPolyphone = false;
    response = [];
    const subResponses = []
    for (const char of text) {
      length++;
      if (checkSentenceBreak(char)) {
        if (hasPolyphone) {
          const subResponse = api.queryZhCNPolyPhonePron(text, { offset, length });
          subResponses.push(subResponse);
        }
        hasPolyphone = false;
        offset += length;
        length = 0;
      }
      else if (!hasPolyphone && checkPolyphone(char)) {
        hasPolyphone = true;
      }
    }

    if (!subResponses.length)
      return null;

    for (const result of await Promise.all(subResponses))
      response.push(...result);
    response.sort((a, b) => a.position - b.position);
  }
  catch (e) {
    response = errorSymbol;
    console.error(e);
  }

  return response;
}

const polyphoneWords = new Set([
  "柏", "曾", "挑", "塞", "扒", "雀", "教", "咽", "撇", "冠", "嚼", "煞", "倒", "降", "屏",
  "干", "壳", "折", "磨", "厦", "荫", "长", "剥", "累", "卷", "拧", "抹", "衰", "晕", "曲",
  "称", "解", "背", "少", "斗", "宁", "钉", "唉", "行", "撒", "蒙", "溜", "种", "参", "涨",
  "数", "哗", "薄", "重", "供", "划", "奔", "创", "罢", "传", "调", "转", "哄", "咳", "削",
  "混", "笼", "旋", "杆", "嘿", "载", "朝", "切", "咯", "铺", "尾", "邪", "率", "核", "趟",
  "弥", "差", "角", "主", "得", "兴", "肚", "扎", "济", "乘", "将", "血", "分", "为", "丧",
  "佛", "勒", "当", "散", "藏", "刺", "帖", "仇", "吐", "舍", "各", "省", "闷", "相", "似",
  "摩", "空", "露", "喝", "假", "乐", "系", "糊", "晃", "量", "都", "好", "鲜", "难", "担",
  "炸", "任", "发", "还", "压", "石", "落", "胜", "场", "更", "着", "台", "模", "待", "校",
  "奇", "熟", "冲", "汗", "和", "嚷", "夹", "地", "谁", "处", "扇", "格", "应", "那", "甚",
  "呢", "中", "打", "伯", "只", "术", "看", "了", "通", "强", "拉", "吓", "观", "阿", "片",
  "正", "觉", "几", "作", "亲", "绿", "华", "河", "咱", "间", "度", "有", "答", "来", "这",
  "没", "大", "会", "红", "上", "车", "与", "见", "便", "里", "说", "什", "可", "圈", "茜",
  "堡", "琢", "堤", "否", "爪", "缪", "朴", "蔵", "弹", "刹", "町", "圻", "贾", "栎", "扁",
  "楂", "佃", "陆", "遍", "剖", "卜", "畜", "晟", "牟", "筠", "卡", "酵", "恶", "兹", "偻",
  "的", "澄", "咖", "隗", "粘", "莞", "颤", "芫", "炮", "劲", "暴", "芾", "钿", "宿", "菀",
  "査", "俊", "提", "仔", "诘", "给", "烙", "盛", "柜", "曝", "嗨", "择", "珩", "棱", "巷", "棹"]);

const excludeWords = new Set([]);
for (const word of excludeWords)
  polyphoneWords.delete(word);
const checkPolyphone = Set.prototype.has.bind(polyphoneWords);

module.exports = cliModule;
