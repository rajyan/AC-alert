import {Number, Record, Static, String,} from 'runtypes'

export const Env = Record({
  bucketName: String,
  userName: String,
  apiUrl: String,
  webhookUrl: String
});

export let SolvedData = Record({
  lastAC: String,
  solvedProblem: String,
});
export type SolvedData = Static<typeof SolvedData>;

export interface submissionData {
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
