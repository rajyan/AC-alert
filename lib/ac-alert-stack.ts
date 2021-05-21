import * as cdk from "@aws-cdk/core";
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import { Runtime } from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";

export class AcAlertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "Bucket", {
      bucketName: "ac-alert-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
    });

    const func = new NodejsFunction(this, "Checker", {
      runtime: Runtime.NODEJS_14_X,
      entry: "src/ac-alert.ts",
      handler: "AcAlert",
      environment: {
        BUCKET_NAME: bucket.bucketName,
        API_URL: "https://kenkoooo.com/atcoder/atcoder-api/results?user=",
        USER_NAME: StringParameter.fromStringParameterName(
            this,
            "UserName",
            "/ac-alert/username"
        ).stringValue,
        WEBHOOK_URL: StringParameter.fromStringParameterName(
          this,
          "WebhookUrl",
          "/ac-alert/slack-webhook-url"
        ).stringValue,
      },
      timeout: cdk.Duration.seconds(20),
    });
    bucket.grantReadWrite(func);

    new Rule(this, "Rule1", {
      ruleName: "ac-alert-rule1",
      description: "rule on 10pm",
      schedule: Schedule.cron({
        minute: "0/30",
        hour: "13",
      }),
      targets: [new LambdaFunction(func)],
    });
    new Rule(this, "Rule2", {
      ruleName: "ac-alert-rule2",
      description: "rule on 11pm",
      schedule: Schedule.cron({
        minute: "0/11",
        hour: "14",
      }),
      targets: [new LambdaFunction(func)],
    });
  }
}
