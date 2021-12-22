import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as AcAlert from "../lib/ac-alert-stack";

test("Template matches snapshot", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AcAlert.AcAlertStack(app, "MyTestStack", {});
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {
          Bucket83908E77: {
            Type: "AWS::S3::Bucket",
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: {
                      SSEAlgorithm: "AES256",
                    },
                  },
                ],
              },
              BucketName: "ac-alert-bucket",
              LifecycleConfiguration: {
                Rules: [
                  {
                    ExpirationInDays: 30,
                    Status: "Enabled",
                  },
                ],
              },
              Tags: [
                {
                  Key: "aws-cdk:auto-delete-objects",
                  Value: "true",
                },
              ],
              VersioningConfiguration: {
                Status: "Enabled",
              },
            },
            UpdateReplacePolicy: "Delete",
            DeletionPolicy: "Delete",
          },
          BucketPolicyE9A3008A: {
            Type: "AWS::S3::BucketPolicy",
            Properties: {
              Bucket: {
                Ref: "Bucket83908E77",
              },
              PolicyDocument: {
                Statement: [
                  {
                    Action: ["s3:GetBucket*", "s3:List*", "s3:DeleteObject*"],
                    Effect: "Allow",
                    Principal: {
                      AWS: {
                        "Fn::GetAtt": [
                          "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
                          "Arn",
                        ],
                      },
                    },
                    Resource: [
                      {
                        "Fn::GetAtt": ["Bucket83908E77", "Arn"],
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": ["Bucket83908E77", "Arn"],
                            },
                            "/*",
                          ],
                        ],
                      },
                    ],
                  },
                ],
                Version: "2012-10-17",
              },
            },
          },
          BucketAutoDeleteObjectsCustomResourceBAFD23C2: {
            Type: "Custom::S3AutoDeleteObjects",
            Properties: {
              ServiceToken: {
                "Fn::GetAtt": [
                  "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F",
                  "Arn",
                ],
              },
              BucketName: {
                Ref: "Bucket83908E77",
              },
            },
            DependsOn: ["BucketPolicyE9A3008A"],
            UpdateReplacePolicy: "Delete",
            DeletionPolicy: "Delete",
          },
          CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092: {
            Type: "AWS::IAM::Role",
            Properties: {
              AssumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                      Service: "lambda.amazonaws.com",
                    },
                  },
                ],
              },
              ManagedPolicyArns: [
                {
                  "Fn::Sub":
                    "arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                },
              ],
            },
          },
          CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F: {
            Type: "AWS::Lambda::Function",
            Properties: {
              Code: {
                S3Bucket: {
                  Ref: "AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1S3Bucket4842F32D",
                },
                S3Key: {
                  "Fn::Join": [
                    "",
                    [
                      {
                        "Fn::Select": [
                          0,
                          {
                            "Fn::Split": [
                              "||",
                              {
                                Ref: "AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1S3VersionKeyD0A0B57A",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        "Fn::Select": [
                          1,
                          {
                            "Fn::Split": [
                              "||",
                              {
                                Ref: "AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1S3VersionKeyD0A0B57A",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  ],
                },
              },
              Timeout: 900,
              MemorySize: 128,
              Handler: "__entrypoint__.handler",
              Role: {
                "Fn::GetAtt": [
                  "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
                  "Arn",
                ],
              },
              Runtime: "nodejs12.x",
              Description: {
                "Fn::Join": [
                  "",
                  [
                    "Lambda function for auto-deleting objects in ",
                    {
                      Ref: "Bucket83908E77",
                    },
                    " S3 bucket.",
                  ],
                ],
              },
            },
            DependsOn: [
              "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
            ],
          },
          HandlerServiceRoleFCDC14AE: {
            Type: "AWS::IAM::Role",
            Properties: {
              AssumeRolePolicyDocument: {
                Statement: [
                  {
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                      Service: "lambda.amazonaws.com",
                    },
                  },
                ],
                Version: "2012-10-17",
              },
              ManagedPolicyArns: [
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        Ref: "AWS::Partition",
                      },
                      ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                    ],
                  ],
                },
              ],
            },
          },
          HandlerServiceRoleDefaultPolicyCBD0CC91: {
            Type: "AWS::IAM::Policy",
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Action: [
                      "s3:GetObject*",
                      "s3:GetBucket*",
                      "s3:List*",
                      "s3:DeleteObject*",
                      "s3:PutObject*",
                      "s3:Abort*",
                    ],
                    Effect: "Allow",
                    Resource: [
                      {
                        "Fn::GetAtt": ["Bucket83908E77", "Arn"],
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": ["Bucket83908E77", "Arn"],
                            },
                            "/*",
                          ],
                        ],
                      },
                    ],
                  },
                  {
                    Action: [
                      "ssm:DescribeParameters",
                      "ssm:GetParameters",
                      "ssm:GetParameter",
                      "ssm:GetParameterHistory",
                    ],
                    Effect: "Allow",
                    Resource: {
                      "Fn::Join": [
                        "",
                        [
                          "arn:",
                          {
                            Ref: "AWS::Partition",
                          },
                          ":ssm:",
                          {
                            Ref: "AWS::Region",
                          },
                          ":",
                          {
                            Ref: "AWS::AccountId",
                          },
                          ":parameter/ac-alert/username",
                        ],
                      ],
                    },
                  },
                  {
                    Action: [
                      "ssm:DescribeParameters",
                      "ssm:GetParameters",
                      "ssm:GetParameter",
                      "ssm:GetParameterHistory",
                    ],
                    Effect: "Allow",
                    Resource: {
                      "Fn::Join": [
                        "",
                        [
                          "arn:",
                          {
                            Ref: "AWS::Partition",
                          },
                          ":ssm:",
                          {
                            Ref: "AWS::Region",
                          },
                          ":",
                          {
                            Ref: "AWS::AccountId",
                          },
                          ":parameter/ac-alert/slack-webhook-url",
                        ],
                      ],
                    },
                  },
                ],
                Version: "2012-10-17",
              },
              PolicyName: "HandlerServiceRoleDefaultPolicyCBD0CC91",
              Roles: [
                {
                  Ref: "HandlerServiceRoleFCDC14AE",
                },
              ],
            },
          },
          Handler886CB40B: {
            Type: "AWS::Lambda::Function",
            Properties: {
              Code: {
                S3Bucket: {
                  Ref: "AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecS3BucketE9219975",
                },
                S3Key: {
                  "Fn::Join": [
                    "",
                    [
                      {
                        "Fn::Select": [
                          0,
                          {
                            "Fn::Split": [
                              "||",
                              {
                                Ref: "AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecS3VersionKeyAC909A74",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        "Fn::Select": [
                          1,
                          {
                            "Fn::Split": [
                              "||",
                              {
                                Ref: "AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecS3VersionKeyAC909A74",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  ],
                },
              },
              Role: {
                "Fn::GetAtt": ["HandlerServiceRoleFCDC14AE", "Arn"],
              },
              Environment: {
                Variables: {
                  BUCKET_NAME: {
                    Ref: "Bucket83908E77",
                  },
                  API_URL:
                    "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions",
                  AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
                },
              },
              Handler: "index.handler",
              Runtime: "nodejs14.x",
              Timeout: 60,
            },
            DependsOn: [
              "HandlerServiceRoleDefaultPolicyCBD0CC91",
              "HandlerServiceRoleFCDC14AE",
            ],
          },
          Rule136483A30: {
            Type: "AWS::Events::Rule",
            Properties: {
              Description: "rule on 10pm",
              Name: "ac-alert-rule1",
              ScheduleExpression: "cron(0/30 13 * * ? *)",
              State: "ENABLED",
              Targets: [
                {
                  Arn: {
                    "Fn::GetAtt": ["Handler886CB40B", "Arn"],
                  },
                  Id: "Target0",
                },
              ],
            },
          },
          Rule1AllowEventRuleMyTestStackHandlerE1531D2541C230AE: {
            Type: "AWS::Lambda::Permission",
            Properties: {
              Action: "lambda:InvokeFunction",
              FunctionName: {
                "Fn::GetAtt": ["Handler886CB40B", "Arn"],
              },
              Principal: "events.amazonaws.com",
              SourceArn: {
                "Fn::GetAtt": ["Rule136483A30", "Arn"],
              },
            },
          },
          Rule270732244: {
            Type: "AWS::Events::Rule",
            Properties: {
              Description: "rule on 11pm",
              Name: "ac-alert-rule2",
              ScheduleExpression: "cron(0/11 14 * * ? *)",
              State: "ENABLED",
              Targets: [
                {
                  Arn: {
                    "Fn::GetAtt": ["Handler886CB40B", "Arn"],
                  },
                  Id: "Target0",
                },
              ],
            },
          },
          Rule2AllowEventRuleMyTestStackHandlerE1531D258DAAA88C: {
            Type: "AWS::Lambda::Permission",
            Properties: {
              Action: "lambda:InvokeFunction",
              FunctionName: {
                "Fn::GetAtt": ["Handler886CB40B", "Arn"],
              },
              Principal: "events.amazonaws.com",
              SourceArn: {
                "Fn::GetAtt": ["Rule270732244", "Arn"],
              },
            },
          },
        },
        Parameters: {
          AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1S3Bucket4842F32D:
            {
              Type: "String",
              Description:
                'S3 bucket for asset "1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1"',
            },
          AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1S3VersionKeyD0A0B57A:
            {
              Type: "String",
              Description:
                'S3 key for asset version "1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1"',
            },
          AssetParameters1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1ArtifactHash0128B949:
            {
              Type: "String",
              Description:
                'Artifact hash for asset "1f7e277bd526ebce1983fa1e7a84a5281ec533d9187caaebb773681bbf7bf4c1"',
            },
          AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecS3BucketE9219975:
            {
              Type: "String",
              Description:
                'S3 bucket for asset "df4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ec"',
            },
          AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecS3VersionKeyAC909A74:
            {
              Type: "String",
              Description:
                'S3 key for asset version "df4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ec"',
            },
          AssetParametersdf4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ecArtifactHash0DF324E7:
            {
              Type: "String",
              Description:
                'Artifact hash for asset "df4a26b8bf1d15319224d9e624fed4a2b46ffb87839353dedccfa4ee7c1988ec"',
            },
          UserNameSsmParameter: {
            Type: "AWS::SSM::Parameter::Value<String>",
            Default: "/ac-alert/username",
          },
        },
      },
      MatchStyle.EXACT
    )
  );
});
