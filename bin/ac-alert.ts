#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AcAlertStack } from "../lib/ac-alert-stack";

const app = new App();

new AcAlertStack(app, "AcAlertStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
