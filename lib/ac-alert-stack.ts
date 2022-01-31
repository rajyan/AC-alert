import * as path from "path";
import { Construct } from "constructs";
import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  aws_s3,
  aws_ssm,
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_lambda_nodejs,
} from "aws-cdk-lib";

export class AcAlertStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const bucket = new aws_s3.Bucket(this, "Bucket", {
      bucketName: "ac-alert-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{ expiration: Duration.days(30) }],
    });

    const userNameSsm = aws_ssm.StringParameter.fromStringParameterName(
      this,
      "UserNameSsm",
      "/ac-alert/username"
    );
    const webhookSsm = aws_ssm.StringParameter.fromStringParameterAttributes(
      this,
      "WebHookSsm",
      {
        parameterName: "/ac-alert/slack-webhook-url",
        version: 1,
      }
    );

    const lambda = new aws_lambda_nodejs.NodejsFunction(this, "Handler", {
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "../src/handler.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName,
        API_URL: "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions",
      },
      timeout: Duration.seconds(60),
    });
    bucket.grantReadWrite(lambda);
    userNameSsm.grantRead(lambda);
    webhookSsm.grantRead(lambda);

    new aws_events.Rule(this, "Rule1", {
      ruleName: "ac-alert-rule1",
      description: "rule on 10pm",
      schedule: aws_events.Schedule.cron({
        minute: "0/30",
        hour: "13",
      }),
      targets: [new aws_events_targets.LambdaFunction(lambda)],
    });
    new aws_events.Rule(this, "Rule2", {
      ruleName: "ac-alert-rule2",
      description: "rule on 11pm",
      schedule: aws_events.Schedule.cron({
        minute: "0/11",
        hour: "14",
      }),
      targets: [new aws_events_targets.LambdaFunction(lambda)],
    });
  }
}
