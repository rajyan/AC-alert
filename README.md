# AC alert

streakが続いているどうかslackに通知するアプリ。AWSの無料枠で動いているはず

デフォルトでは 22時に2回(30分毎)、23時に6回（11分毎）に、当日のunique ACが AtCode Problemsに反映されるまで通知されます

## 使い方

awsのアカウントとnpmがあれば動きます

ssmに'/ac-alert/username', /ac-alert/slack-webhook-url というパラメータ名でユーザーとSlack Webhook url を追加して、以下のコマンドを実行してください

```shell
npm install
npm run cdk deploy
```