# acc-predict-wrapper

An integrated API call for automation.

## Inputs

1. SSML file to predict
1. Voice perferences JSON

    This should contains exactly on element with `roleName` Narrator.

    Before preparing your preferences preset,
    you might need to list all your voices first.

    ```json
    [
      {
        "roleName": "Narrator",
        "preferredVoiceInfo": {
          "type": "StandardVoice",
          "name": "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaomoNeural)",
          "id": "0ca5d0ac-5a66-4d8e-9140-de556ef3916d"
        }
      },
      {
        "roleName": "YoungAdultMale",
        "preferredVoiceInfo": {
          "type": "StandardVoice",
          "name": "Microsoft Server Speech Text to Speech Voice (zh-CN, YunxiNeural)",
          "id": "1011ca97-3e33-4e7c-8dda-a22dc244bafc"
        }
      },
      ...
    ]
    ```

## Outputs

1. Predicted SSML file(s)
1. Error messages on command line

## Samples

CLI tool for [nodejs](https://github.com/pseudocc/acc-predict-wrapper/tree/main/nodejs)

## Notice

One subscription can only submit 200 export tasks at a time.
Be careful while running the CLI tool on parallel.
