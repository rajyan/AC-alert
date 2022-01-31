import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import * as AcAlert from "../lib/ac-alert-stack";

test("Template matches snapshot", () => {
  const app = new App();
  const stack = new AcAlert.AcAlertStack(app, "MyTestStack", {});
  expect.addSnapshotSerializer({
    test: (val) => typeof val === "string",
    serialize: (val) => {
      return `"${val.replace(
        /[a-f0-9]{64}\.zip|cdk-[a-z0-9]{9}-assets-\${AWS::AccountId}-\${AWS::Region}/,
        "[HASH REMOVED]"
      )}"`;
    },
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
