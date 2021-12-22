#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import {AcAlertStack} from "../lib/ac-alert-stack";

const app = new cdk.App();

new AcAlertStack(app, "AcAlertStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },


});
