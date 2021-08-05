import axios from "axios";
import { S3, SSM } from "aws-sdk";
import { BucketEnv, SolvedData, SubmissionData } from "./interface";
import { createMessage } from "./slack-mesage";

import type { ScheduledEvent, ScheduledHandler } from "aws-lambda";

export const handler: ScheduledHandler = async function (
  event: ScheduledEvent
) {
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
  if (bucketObject?.Body) {
    const body = SolvedData.check(JSON.parse(bucketObject.Body.toString()));
    if (body.lastAC === today) {
      return;
    }
  }

  // get submission data from ac-problems API
  const response = await axios.get(env.apiUrl + env.userName, {
    headers: {
      "Accept-Encoding": "Encoding:gzip",
    },
  });
  const data: SubmissionData[] = response.data;

  // classify data by solved date
  const solvedToday: string[] = [];
  const solvedBefore = new Set<string>();
  for (const sub of data) {
    if (sub.result !== "AC") continue;
    const date = new Date(sub.epoch_second * 1000);
    const solvedDate = date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    if (solvedDate === today) {
      solvedToday.push(sub.problem_id);
    } else {
      solvedBefore.add(sub.problem_id);
    }
  }

  // look for unique AC today
  let todayData: SolvedData | null = null;
  for (const problemId of solvedToday) {
    if (!solvedBefore.has(problemId)) {
      todayData = {
        lastAC: today,
        solvedProblem: problemId,
      };
      break;
    }
  }

  // save if todayData exists
  if (todayData) {
    await s3
      .putObject({
        Bucket: env.bucketName,
        Key: env.userName,
        Body: JSON.stringify(todayData),
      })
      .promise();
  }

  // post message to slack
  await axios.post(env.webhookUrl, {
    text: createMessage(!!todayData, env.userName),
  });
};
