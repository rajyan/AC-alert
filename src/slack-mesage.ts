import { format } from "util";

const ACMessages = [
  "%sさんのstreak続いています！",
  "%sさん、streak続けて偉い！",
  "%sさん、今日も頑張りました！",
  "%sさん、さすがです！",
  "%sさん、明日も頑張ろう！",
  "%sさん、お疲れ様です！",
  "%sさん、素晴らしい！",
];

const WAMessages = [
  "今日はまだ解いていないよ！ => ",
  "まだ間に合います！ => ",
  "今日も頑張ろう！ => ",
  "解いていこう！ => ",
];

const recommendation =
  "<https://kenkoooo.com/atcoder/#/user/%s?userPageTab=Recommendation | %sさんのおすすめ問題>";

const pick = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const createACMessage = (currentStreak: number, userName: string): string => {
  return `streak ${currentStreak}日目\n` + format(pick(ACMessages), userName);
};

export const createWAMessage = (userName: string): string => {
  return pick(WAMessages) + format(recommendation, userName, userName);
};
