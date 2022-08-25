# acc-predict-wrapper-nodejs

Using REST APIs of ACC (Audio Content Creation) to predict role/style for local SSML file.
It is highly suggested that debugging on the unit test case to walk through the general flow and required parameters of this CLI tool.

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
node src/index.js versions --help
node src/index.js predict --help
```

### See current API Versions

List ACC API version and predict tool version.

```bash
node src/index.js versions --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION
```

### List all zh-CN Voices

List all voices and prepare your voice preferences preset.json.

```bash
node src/index.js voices --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION
```

*See the definition of `VoicePreference` in [src/cli/predict.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/src/cli/predict.js#L104).*

*See the test input [preset.json](https://github.com/pseudocc/acc-predict-wrapper/blob/main/test/preset.json) as an example.*

### Predict SSML file

Prediction will take about 150 seconds to finish by using ACC API (default), using TTS API will reduce this to 20 seconds or lower.

```bash
node src/index.js predict --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION --input=YOUR_SSML.xml --output=OUTPUT_DIRECTORY --voice=YOUR_FAVORITE_VOICE --api=tts
```

  - `voice`: Please make sure you have the right access to this voice
    and it supports role plays and styles/emotions.
  - `preferences`: Set this option will also take effects for muliticast experience.

If you are trying to experience the multicast performance which is not currently enabled on Audio Content Creation web portal, try the following command line.

```bash
node src/index.js predict --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION --input=YOUR_SSML.xml --output=OUTPUT_DIRECTORY --preferences=YOUR_PRESET.json
```

You can also specify the tool version with something like `--tool=1.0.2`. Refer to the section `See current API Versions` for more.

Feed the tool with `--clean` to remove all intermediate SSML files generated during the process.

### Query Polyphone Pronunciation

This is an ACC internal API for certain partner to get the pronunciation of polyphone words without sythesize the audio and listen to it.

```bash
node src/index.js polyphone --key=YOUR_KEY_GOES_HERE --region=YOUR_REGION --input=YOUR_TEXT.txt --output=OUTPUT_JSON
```

You can ignore certain polyphone words by removing them from variable `polyphoneWords` in `src/cli/polyphone.js`.

This CLI tool will call ACC API for each line in the input file and store all the result in a list.

### Notes

Your can refer to the codes and all the related files in [test/index.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/test/index.js).

## Debug

Open [Visual Studio Code](https://code.visualstudio.com/) under this directory (/nodejs).

Add break points inside the async function `handler` of [src/cli/predict.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/src/cli/predict.js#L56) and [src/cli/voices.js](https://github.com/pseudocc/acc-predict-wrapper/blob/main/nodejs/src/cli/voices.js#L13).  

Then press `F5` to debug.

## Test

Verified on Southeast Asia -- 10/25/2021.

```
npm test
```
