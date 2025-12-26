import { z } from "zod";

const TopicTag = z.object({
  name: z.string(),
  slug: z.string(),
  __typename: z.literal("CommonTagNode"),
});

const ProblemSetQuestionNodeSchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  id: z.number(),
  paidOnly: z.boolean(),
  questionFrontendId: z.string(),
  status: z.string(),
  title: z.string(),
  titleSlug: z.string(),
  topicTags: z.array(TopicTag),
  frequency: z.null(),
  isInMyFavorites: z.boolean(),
  acRate: z.number(),
  contestPoint: z.null(),
  __typename: z.literal("ProblemSetQuestionNode"),
});

export const ProblemSetSchema = z.object({
  data: z.object({
    problemsetQuestionListV2: z.object({
      questions: z.array(ProblemSetQuestionNodeSchema),
    }),
  }),
});
