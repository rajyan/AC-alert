# AC Alert

streakが続いているどうかslackに通知するアプリ。AWSの無料枠で動いているはず

デフォルトでは 22時に2回(30分毎)、23時に6回（11分毎）に、当日のunique ACが AtCode Problemsに反映されるまで通知されます

## 使い方

awsのアカウントとnpmがあれば動きます

```shell
npm install
USER_NAME=<ユーザー名> WEBHOOK_URL=<通知するSlackのwebhook url> npm run cdk deploy
```