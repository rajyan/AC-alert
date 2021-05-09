/*
This code uses callbacks to handle asynchronous function responses.
It currently demonstrates using an async-await pattern.
AWS supports both the async-await and promises patterns.
For more information, see the following:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/calling-services-asynchronously.html
https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
*/
import {S3} from 'aws-sdk';
import axios from 'axios';

const bucketName = process.env.BUCKET_NAME;
const userName = process.env.USER_NAME;
const apiUrl = process.env.API_URL;
const webhookUrl = process.env.WEBHOOK_URL;

if (!bucketName || !userName || !apiUrl || !webhookUrl) {
  throw new Error('env value is missing');
}

exports.main = async function () {
  try {

    // const s3 = new S3();
    // const lastAC = await s3.getObject({
    //   Bucket: bucketName,
    //   Key: 'lastAC'
    // });

    const response = await axios.get(apiUrl + userName, {
      headers: {
        'Accept-Encoding': 'Encoding:gzip',
      }
    });
    const data: submissionData[] = response.data;

    let solved = new Set<string>();
    const today = (new Date()).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})
    let todayAC: string[] = [];
    for (const sub of data) {
      if (sub.result !== 'AC') continue;
      const date = new Date(sub.epoch_second * 1000);
      const solvedDate = date.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
      if (solvedDate === today) {
        todayAC.push(sub.problem_id);
      } else {
        solved.add(sub.problem_id);
      }
    }

    let uniqueAC = false;
    for (const problemId of todayAC) {
      if (!solved.has(problemId)) {
        uniqueAC = true;
        break
      }
    }

    await axios.post(webhookUrl, {
      text: uniqueAC ? "streak続いています！" : "今日はまだ解いていないよ！"
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

interface submissionData {
  id: number,
  epoch_second: number,
  problem_id: string,
  contest_id: string,
  user_id: string,
  language: string,
  point: number,
  length: number,
  result: string,
  execution_time: number
}
