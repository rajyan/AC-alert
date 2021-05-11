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

    const s3 = new S3();
    const lastAC = await s3.getObject({
      Bucket: bucketName,
      Key: userName
    }).promise()
      .catch((e) => {
        // ignore NoSuchKey
        if (e.statusCode !== 404) {
          throw e;
        }
      });

    const today = (new Date()).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
    if (lastAC && lastAC.Body && JSON.parse(lastAC.Body.toString())?.lastAC === today) {
      return {
        statusCode: 200,
      };
    }

    const response = await axios.get(apiUrl + userName, {
      headers: {
        'Accept-Encoding': 'Encoding:gzip',
      }
    });
    const data: submissionData[] = response.data;

    let solved = new Set<string>();
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

    let todayData = null;
    for (const problemId of todayAC) {
      if (!solved.has(problemId)) {
        todayData = {
          lastAC: today,
          solvedProblem: problemId,
        };
        break;
      }
    }

    if (todayData) {
      await s3.putObject({
        Bucket: bucketName,
        Key: userName,
        Body: JSON.stringify(todayData)
      }).promise();
    }

    const ACMessages = [
      "さんのstreak続いています！",
      "さん、streak続けて偉い！",
      "さん、今日も頑張りました！",
      "さん、さすがです！",
      "さん、明日も頑張ろう！"
    ];

    const ACMessage = userName + ACMessages[Math.floor(Math.random() * ACMessages.length)];
    const WAMessage = `今日はまだ解いていないよ！ => <https://kenkoooo.com/atcoder/#/user/${userName}?userPageTab=Recommendation | ${userName}さんのおすすめ問題>`;

    await axios.post(webhookUrl, {
      text: !!todayData ? ACMessage : WAMessage
    })

    return {
      statusCode: 200,
    };
  } catch (error) {
    const body = error.stack || JSON.stringify(error, null, 2);
    console.log(body)
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
