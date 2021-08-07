# AC alert

streakが続いているどうかslackに通知するアプリ。AWSの無料枠で動いているはず

デフォルトでは 22時に2回(30分毎)、23時に6回（11分毎）に、当日のunique ACが AtCoder Problemsに反映されるまで通知されます

## 使い方

awsのアカウントとnpmがあれば動きます

1. awsコンソールからssmパラメータ`/ac-alert/username, /ac-alert/slack-webhook-url`を設定

1. 以下を実行すると、ac-alertのスタックがデプロイされます
```shell
npm install
npm run cdk deploy
```
