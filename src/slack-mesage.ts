import {format} from "util";

const ACMessages = [
  "%sさんのstreak続いています！",
  "%sさん、streak続けて偉い！",
  "%sさん、今日も頑張りました！",
  "%sさん、さすがです！",
  "%sさん、明日も頑張ろう！",
  "%sさん、お疲れ様です！",
  "%sさん、素晴らしい！",
];

const recommendation = "<https://kenkoooo.com/atcoder/#/user/%s?userPageTab=Recommendation | %sさんのおすすめ問題>"

const WAMessages = [
  "今日はまだ解いていないよ！ =>",
  "まだ間に合います！ =>",
  "今日も頑張ろう！ =>",
  "解いていこう！ =>",
];

const pick = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
}

export const createMessage = (solved: boolean, userName: string) => {
  if (solved) {
    return format(pick(ACMessages), userName)
  }
  else {
    return pick(WAMessages) + format(recommendation, userName, userName)
  }
}