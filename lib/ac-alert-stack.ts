import * as cdk from '@aws-cdk/core';
import {Bucket} from '@aws-cdk/aws-s3';
import {Runtime} from '@aws-cdk/aws-lambda';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

export class AcAlertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'LastACMemo', {
      bucketName: 'last-ac-memo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const func = new NodejsFunction(this, 'Checker', {
      runtime: Runtime.NODEJS_14_X,
      entry: 'src/ac-checker.ts',
      handler: 'main',
      environment: {
        BUCKET_NAME: bucket.bucketName,
        USER_NAME: process.env.USERNAME ?? '',
        API_URL: 'https://kenkoooo.com/atcoder/atcoder-api/results?user=',
        WEBHOOK_URL: process.env.WEBHOOOK ?? ''
      }
    });
    bucket.grantReadWrite(func);

    const rule1 = new Rule(this, 'Rule1', {
      ruleName: 'ac-alert-rule1',
      description: 'rule on 10pm',
      schedule: Schedule.cron({
        minute: '0/30',
        hour: '22'
      }),
      targets: [new LambdaFunction(func)]
    });
    const rule2 = new Rule(this, 'Rule2', {
      ruleName: 'ac-alert-rule2',
      description: 'rule on 11pm',
      schedule: Schedule.cron({
        minute: '0/11',
        hour: '23'
      }),
      targets: [new LambdaFunction(func)]
    });

  }
}
