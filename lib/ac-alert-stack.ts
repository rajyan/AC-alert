import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as chatbot from '@aws-cdk/aws-chatbot';

export class AcAlertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'LastACMemo', {
      bucketName: 'last-ac-memo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const func = new lambda.Function(this, 'Checker', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('src'),
      handler: 'ac-checker.main',
      environment: {
        BUCKET_NAME: bucket.bucketName,
        USER_NAME: process.env.USERNAME ?? '',
        API_URL: 'https://kenkoooo.com/atcoder/atcoder-api/results?user=',
        WEBHOOK_URL: process.env.WEBHOOOK ?? ''
      }
    });
    bucket.grantReadWrite(func);

    const rule1 = new events.Rule(this, 'Rule1', {
      ruleName: 'rule on 10pm',
      schedule: events.Schedule.cron({
        minute: '0/30',
        hour: '22'
      }),
      targets: [new targets.LambdaFunction(func)]
    });
    const rule2 = new events.Rule(this, 'Rule2', {
      ruleName: 'rule on 11pm',
      schedule: events.Schedule.cron({
        minute: '0/11',
        hour: '23'
      }),
      targets: [new targets.LambdaFunction(func)]
    });

  }
}
