// Kindly ported from Python by Claude Sonnet 3.7
import { supermemo, type SuperMemoGrade, type SuperMemoItem } from "supermemo";
import { readLogFromFile } from "./core.ts";
import { ALL_PROBLEMS } from "./gen/problems.ts";

const INTERVAL_FACTOR = 7;

interface SM2Item extends SuperMemoItem {
  interval: number;
  repetition: number;
  efactor: number;
}

interface ReviewItem {
  problemNumber: number;
  sm2Item: SM2Item;
  attemptDate: string; // ISO date string
  dueDate: string; // ISO date string
  numAttempts: number;
  frustrationScore: number;
}

interface LogRecord {
  date: Date;
  problem: number;
  confidence: number;
  skip?: boolean;
}

/**
 * Creates a new review item with default values
 */
const createReviewItem = (
  problemNumber: number,
  initialDate: string,
): ReviewItem => ({
  problemNumber,
  sm2Item: {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
  },
  attemptDate: initialDate,
  dueDate: initialDate,
  numAttempts: 0,
  frustrationScore: 0.0,
});

/**
 * Updates a review item based on practice results
 */
const practiceReviewItem = (
  reviewItem: ReviewItem,
  grade: SuperMemoGrade,
  attemptDate: string,
): ReviewItem => {
  const newSm2Item = supermemo(reviewItem.sm2Item, grade);
  const nDays = newSm2Item.interval * INTERVAL_FACTOR;
  const newDueDate = new Date(
    new Date(attemptDate).getTime() + nDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0]!;
  const newNumAttempts = reviewItem.numAttempts + 1;

  return {
    problemNumber: reviewItem.problemNumber,
    sm2Item: newSm2Item,
    attemptDate,
    dueDate: newDueDate,
    numAttempts: newNumAttempts,
    frustrationScore: newNumAttempts / newSm2Item.efactor,
  };
};

/**
 * Converts confidence score to SuperMemo grade
 */
const mapConfidenceToGrade = (confidence: number): SuperMemoGrade => {
  if (confidence < 0.5) return 1;
  if (confidence < 0.7) return 2;
  if (confidence < 0.9) return 3;
  if (confidence < 1.0) return 4;
  return 5;
};

/**
 * Processes log records and returns sorted review items
 */
const processLogRecords = (logRecords: LogRecord[]): ReviewItem[] => {
  // Filter out skipped problems
  const problemsToSkip = new Set(
    logRecords.filter((record) => record.skip).map((record) => record.problem),
  );

  const filteredRecords = logRecords.filter(
    (record) => !problemsToSkip.has(record.problem),
  );

  // Sort by date
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Process records
  const reviewMap = new Map<number, ReviewItem>();

  for (const record of sortedRecords) {
    const { problem: problemNumber, date } = record;
    const dateStr = date.toISOString();

    if (!reviewMap.has(problemNumber)) {
      reviewMap.set(problemNumber, createReviewItem(problemNumber, dateStr));
    }

    const currentItem = reviewMap.get(problemNumber)!;
    const updatedItem = practiceReviewItem(
      currentItem,
      mapConfidenceToGrade(record.confidence),
      dateStr,
    );

    reviewMap.set(problemNumber, updatedItem);
  }

  // Sort review items
  return [...reviewMap.values()].sort((a, b) => {
    const dateA = new Date(a.dueDate).valueOf();
    const dateB = new Date(b.dueDate).valueOf();

    // Sort by due date (ascending)
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Then by frustration score (descending)
    return b.frustrationScore - a.frustrationScore;
  });
};

/**
 * Main review function
 */
export const review = async (
  logFile: string,
  n: number | undefined,
  premium = false,
): Promise<void> => {
  const logRecords = await readLogFromFile(logFile);

  const PREMIUM_PROBLEMS = new Set<number>(
    ALL_PROBLEMS.filter((q) => q.paidOnly).map((q) => q.id),
  );

  // Filter by premium status
  const filteredRecords = logRecords.filter(
    (record) => PREMIUM_PROBLEMS.has(record.problem) === premium,
  );

  const sortedReviewItems = processLogRecords(filteredRecords);

  // Display results
  for (const item of sortedReviewItems.slice(0, n)) {
    const lcidccUrl = `https://lcid.cc/${item.problemNumber}`;
    console.log(`${item.dueDate} -- ${lcidccUrl}`);
  }
};
