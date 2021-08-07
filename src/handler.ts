import axios from "axios";
import { S3, SSM } from "aws-sdk";
import { BucketEnv, SolvedData, Submission } from "./interface";
import { createACMessage, createWAMessage } from "./slack-mesage";

import type { ScheduledEvent, ScheduledHandler } from "aws-lambda";

export const handler: ScheduledHandler = async function (
  event: ScheduledEvent
) {
  console.log("event", JSON.stringify(event, null, 2));

  // get params from ssm
  const ssm = new SSM();
  const userNameParam = (
    await ssm
      .getParameter({
        Name: "/ac-alert/username",
        WithDecryption: true,
      })
      .promise()
  ).Parameter;
  const webhookUrlParam = (
    await ssm
      .getParameter({
        Name: "/ac-alert/slack-webhook-url",
        WithDecryption: true,
      })
      .promise()
  ).Parameter;
  if (!userNameParam || !webhookUrlParam) {
    throw Error("Failed to get ssm parameters");
  }

  // validate env
  const env: BucketEnv = BucketEnv.check({
    bucketName: process.env.BUCKET_NAME,
    apiUrl: process.env.API_URL,
    userName: userNameParam.Value,
    webhookUrl: webhookUrlParam.Value,
  });
  console.log("bucketName", env.bucketName, "userName", env.userName);

  // get solved data from S3
  const s3 = new S3();
  const bucketObject = await s3
    .getObject({
      Bucket: env.bucketName,
      Key: env.userName,
    })
    .promise()
    .catch((e) => {
      // ignore NoSuchKey
      if (e.statusCode !== 404) {
        throw e;
      }
      return null;
    });

  // return if already solved a problem today
  const today = toTokyoDateString(new Date().getMilliseconds());
  const yesterday = toTokyoDateString(
    new Date().setDate(new Date().getDate() - 1)
  );
  let bucketData: SolvedData = {
    lastACSecond: 0,
    currentStreak: 0,
    problemIds: [],
  };
  if (bucketObject?.Body) {
    // validate and assign
    bucketData = SolvedData.check(JSON.parse(bucketObject.Body.toString()));
    // reset current streak if not solved yesterday
    if (toTokyoDateString(bucketData.lastACSecond * 1000) !== yesterday) {
      bucketData.currentStreak = 0;
    }
    const lastACDate = toTokyoDateString(bucketData.lastACSecond * 1000);
    if (lastACDate === today) {
      console.log("already solved a problem today");
      return;
    }
  }
  console.log("bucket data", JSON.stringify(bucketData, null, 2));

  // get submissions from ac-problems API
  let epocSecond = bucketData.lastACSecond + 1;
  const submissions: Submission[] = [];
  for (let i = 0; i < 50; i++) {
    const response = await axios.get(
      `${env.apiUrl}?user=${env.userName}&from_second=${epocSecond}`,
      {
        headers: {
          "Accept-Encoding": "Encoding:gzip",
        },
      }
    );
    const responseData: Submission[] = response.data;
    if (responseData.length === 0) {
      break;
    }

    submissions.push(...responseData);
    epocSecond = responseData[responseData.length - 1].epoch_second + 1;

    // sleep for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log("submissions", JSON.stringify(submissions, null, 2));

  // classify data by solved date
  const solvedToday: string[] = [];
  const solvedBefore: Set<string> = new Set(bucketData.problemIds);
  for (const submission of submissions) {
    if (submission.result !== "AC") {
      continue;
    }
    const solvedDate = toTokyoDateString(submission.epoch_second * 1000);
    if (solvedDate === today) {
      solvedToday.push(submission.problem_id);
    } else {
      solvedBefore.add(submission.problem_id);
    }
  }
  console.log("today's AC", solvedToday);

  // look for unique AC today
  for (const problemId of solvedToday.reverse()) {
    // save to s3 if solved a problem today
    if (!solvedBefore.has(problemId)) {
      const todayData: SolvedData = {
        lastACSecond: epocSecond,
        currentStreak: bucketData.currentStreak + 1,
        problemIds: [...solvedBefore, ...solvedToday],
      };
      const s3PutResponse = await s3
        .putObject({
          Bucket: env.bucketName,
          Key: env.userName,
          Body: JSON.stringify(todayData),
        })
        .promise();
      console.log("s3", JSON.stringify(s3PutResponse, null, 2));

      // post solved message to slack
      await axios.post(env.webhookUrl, {
        text: createACMessage(todayData.currentStreak, env.userName),
      });

      return;
    }
  }

  // post unsolved message to slack
  await axios.post(env.webhookUrl, {
    text: createWAMessage(env.userName),
  });
};

const toTokyoDateString = (epocMilliSecond: number): string => {
  return new Date(epocMilliSecond).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
};
