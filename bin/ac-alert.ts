#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { AcAlertStack } from "../lib/ac-alert-stack";
import { StackEnv } from "../src/interface";

const app = new cdk.App();
const stackEnv = StackEnv.check({
  userName: process.env.USER_NAME,
  webhookUrl: process.env.WEBHOOK_URL,
});
new AcAlertStack(app, "AcAlertStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackEnv: stackEnv,
});
