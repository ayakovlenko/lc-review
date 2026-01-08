import problemset from "../data/problems.json" with { type: "json" };
import { ProblemSetSchema } from "./problemset-parser.ts";

const parsedProblemSet = ProblemSetSchema.parse(problemset);

export const ALL_PROBLEMS =
  parsedProblemSet.data.problemsetQuestionListV2.questions;

export const PREMIUM_PROBLEMS = new Set<number>(
  parsedProblemSet.data.problemsetQuestionListV2.questions
    .filter((q) => q.paidOnly)
    .map((q) => q.id),
);
