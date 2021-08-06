import axios from "axios";
import { S3, SSM } from "aws-sdk";
import { BucketEnv, SolvedData, Submission } from "./interface";
import { createMessage } from "./slack-mesage";

import type { ScheduledEvent, ScheduledHandler } from "aws-lambda";

export const handler: ScheduledHandler = async function (
  event: ScheduledEvent
) {
  console.log("event", JSON.stringify(event, null, 2));

  // get params from ssm
  const ssm = new SSM();
  const res = await ssm
    .getParameters({
      Names: ["/ac-alert/username", "/ac-alert/slack-webhook-url"],
      WithDecryption: true,
    })
    .promise();
  if (!res.Parameters) {
    throw Error("Failed to get ssm parameters");
  }
  const [userName, webhookUrl] = res.Parameters;

  // validate env
  const env: BucketEnv = BucketEnv.check({
    bucketName: process.env.BUCKET_NAME,
    apiUrl: process.env.API_URL,
    userName: userName.Value,
    webhookUrl: webhookUrl.Value,
  });

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
  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const yesterday = epocMilliSecondToTokyoDateString(
    new Date().setDate(new Date().getDate() - 1)
  );
  let epocSecond = 0;
  let currentStreak = 0;
  if (bucketObject?.Body) {
    const body = SolvedData.check(JSON.parse(bucketObject.Body.toString()));
    epocSecond = body.lastACSecond;
    // reset current streak if not solved yesterday
    currentStreak =
      epocMilliSecondToTokyoDateString(epocSecond * 1000) === yesterday
        ? body.currentStreak
        : 0;
    const lastACDate = epocMilliSecondToTokyoDateString(epocSecond * 1000);
    if (lastACDate === today) {
      return;
    }
  }

  // get submissions from ac-problems API
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

  // classify data by solved date
  const solvedToday: string[] = [];
  const solvedBefore: string[] = [];
  for (const submission of submissions) {
    if (submission.result !== "AC") {
      continue;
    }
    const solvedDate = epocMilliSecondToTokyoDateString(
      submission.epoch_second * 1000
    );
    if (solvedDate === today) {
      solvedToday.push(submission.problem_id);
    } else {
      solvedBefore.push(submission.problem_id);
    }
  }

  // put solve problems to s3
  for (const problemId in solvedBefore) {
    await s3
      .putObject({
        Bucket: env.bucketName,
        Key: problemId,
        Body: "solved",
      })
      .promise();
  }

  // look for unique AC today
  for (const problemId of solvedToday.reverse()) {
    const isUnique = !!(await s3
      .getObject({
        Bucket: env.bucketName,
        Key: problemId,
      })
      .promise()
      .catch((e) => {
        // ignore NoSuchKey
        if (e.statusCode !== 404) {
          throw e;
        }
        return false;
      }));

    // save if solved a problem today and exit
    if (isUnique) {
      const todayData = {
        lastACSecond: epocSecond,
        currentStreak: currentStreak + 1,
      };
      const s3PutResponse = await s3
        .putObject({
          Bucket: env.bucketName,
          Key: env.userName,
          Body: JSON.stringify(todayData),
        })
        .promise();
      console.log("s3", JSON.stringify(s3PutResponse, null, 2));

      // post message to slack
      const slackResponse = await axios.post(env.webhookUrl, {
        text: createMessage(!!todayData, env.userName),
      });
      console.log("slack response", JSON.stringify(slackResponse, null, 2));
      return;
    }
  }
};

const epocMilliSecondToTokyoDateString = (epocMilliSecond: number): string => {
  return new Date(epocMilliSecond).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
};
