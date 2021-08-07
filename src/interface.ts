import { Record, Static, String, Number, Array } from "runtypes";

export const BucketEnv = Record({
  bucketName: String,
  userName: String,
  apiUrl: String,
  webhookUrl: String,
});
export type BucketEnv = Static<typeof BucketEnv>;

export const SolvedData = Record({
  lastACSecond: Number,
  currentStreak: Number,
  problemIds: Array(String),
});
export type SolvedData = Static<typeof SolvedData>;

export type Submission = {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time: number;
};
