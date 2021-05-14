import {S3} from 'aws-sdk';
import axios from 'axios';
import {Env, SolvedData, submissionData} from './interface';
import {createMessage} from "./slack-mesage";

const ACChecker = async function () {
  try {

    // fetch env
    const env = Env.check({
      bucketName: process.env.BUCKET_NAME,
      userName: process.env.USER_NAME,
      apiUrl: process.env.API_URL,
      webhookUrl: process.env.WEBHOOK_URL,
    })

    // get solved data from S3
    const s3 = new S3();
    const bucketObject = await s3.getObject({
      Bucket: env.bucketName,
      Key: env.userName
    }).promise()
      .catch((e) => {
        // ignore NoSuchKey
        if (e.statusCode !== 404) {
          throw e;
        }
        return {
          Body: null
        };
      });

    // return if already solved a problem today
    const today = (new Date()).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
    if (bucketObject?.Body) {
      const body = SolvedData.check(JSON.parse(bucketObject.Body.toString()));
      if (body.lastAC === today) {
        return {
          statusCode: 200,
        };
      }
    }

    // get submission data from ac-problems API
    const response = await axios.get(env.apiUrl + env.userName, {
      headers: {
        'Accept-Encoding': 'Encoding:gzip',
      }
    });
    const data: submissionData[] = response.data;

    // classify data by solved date
    let solvedToday: string[] = [];
    let solvedBefore = new Set<string>();
    for (const sub of data) {
      if (sub.result !== 'AC') continue;
      const date = new Date(sub.epoch_second * 1000);
      const solvedDate = date.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
      if (solvedDate === today) {
        solvedToday.push(sub.problem_id);
      } else {
        solvedBefore.add(sub.problem_id);
      }
    }

    // look for unique AC today
    let todayData = null;
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
      await s3.putObject({
        Bucket: env.bucketName,
        Key: env.userName,
        Body: JSON.stringify(todayData)
      }).promise();
    }

    // post message to slack
    await axios.post(env.webhookUrl, {
      text: createMessage(!!todayData, env.userName)
    })

    return {
      statusCode: 200,
    };

  } catch (error) {
    const body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      body: JSON.stringify(body)
    }
  }
}
