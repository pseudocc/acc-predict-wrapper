# acc-predict-wrapper-nodejs

Using REST APIs of ACC (Audio Content Creation) to predict role/style for local SSML file.

## Install

Install [Nodejs](https://nodejs.org/en/) and add to PATH.

No matter LTS or Current, they are both okay.

### Install Dependencies

Under this directory (/nodejs).

```bash
npm i
```

## Use the CLI tool

Get help

```bash
node src/index.js --help
node src/index.js voices --help
node src/index.js predict --help
```

### List all zh-CN Voices

List all voices and prepare your voice preferences preset.json.

```bash
node src/index.js voices --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION
```

*See the definition of `VoicePreference` in [src/cli/predict.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/src/cli/predict.js#L104).*

*See the test input [preset.json](https://github.com/pseudocc/acc-predict-wrapper/blob/main/test/preset.json) as an example.*

### Predict SSML file

Prediction will take about 150 seconds to finish.

```bash
node src/index.js predict --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION --input=YOUR_SSML.xml --output=OUTPUT_DIRECTORY --preferences=YOUR_PRESET.json
```

### Notes

Your can refer to the codes and all the related files in [test/index.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/test/index.js).

## Test

Verified on Southeast Asia -- 10/25/2021.

```
npm test
```
