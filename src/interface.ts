import {Record, Static, String,} from 'runtypes'

export const Env = Record({
  bucketName: String,
  userName: String,
  apiUrl: String,
  webhookUrl: String
});
export type Env = Static<typeof Env>;

export const SolvedData = Record({
  lastAC: String,
  solvedProblem: String,
});
export type SolvedData = Static<typeof SolvedData>;

export type SubmissionData = {
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
