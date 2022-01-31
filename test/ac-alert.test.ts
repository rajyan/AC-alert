import { SynthUtils } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as AcAlert from "../lib/ac-alert-stack";

test("Template matches snapshot", () => {
  const app = new cdk.App();
  const stack = new AcAlert.AcAlertStack(app, "MyTestStack", {});
  expect.addSnapshotSerializer({
    test: (val) => typeof val === "string",
    serialize: (val) => {
      return `"${val.replace(
        /AssetParameters([A-Fa-f0-9]{64})(\w+)|(\w+) (\w+) for asset\s?(version)?\s?"([A-Fa-f0-9]{64})"/,
        "[HASH REMOVED]"
      )}"`;
    },
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
