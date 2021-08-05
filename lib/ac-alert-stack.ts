import * as path from "path";
import * as cdk from "@aws-cdk/core";
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import { Runtime } from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import { ParameterType, StringParameter } from "@aws-cdk/aws-ssm";

export class AcAlertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "Bucket", {
      bucketName: "ac-alert-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
    });

    const userNameSsm = new StringParameter(this, "UserNameSsm", {
      stringValue: "/ac-alert/username",
      type: ParameterType.STRING,
    });
    const webhookSsm = new StringParameter(this, "WebHookSsm", {
      stringValue: "/slack-webhook-url",
      type: ParameterType.SECURE_STRING,
    });

    const lambda = new NodejsFunction(this, "Handler", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "../src/handler.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName,
        API_URL: "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions",
      },
      timeout: cdk.Duration.seconds(20),
    });
    bucket.grantReadWrite(lambda);
    userNameSsm.grantRead(lambda);
    webhookSsm.grantRead(lambda);

    new Rule(this, "Rule1", {
      ruleName: "ac-alert-rule1",
      description: "rule on 10pm",
      schedule: Schedule.cron({
        minute: "0/30",
        hour: "13",
      }),
      targets: [new LambdaFunction(lambda)],
    });
    new Rule(this, "Rule2", {
      ruleName: "ac-alert-rule2",
      description: "rule on 11pm",
      schedule: Schedule.cron({
        minute: "0/11",
        hour: "14",
      }),
      targets: [new LambdaFunction(lambda)],
    });
  }
}
