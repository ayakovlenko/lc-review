#!/usr/bin/env node
import { appendFile } from "node:fs/promises";
import process from "node:process";
import { readLogFromFile } from "./core.ts";
import { review } from "./review.ts";
import packageJson from "../package.json" with { type: "json" };
import { log } from "node:console";
import { ALL_PROBLEMS } from "./data.ts";

const INCLUDE_PREMIUM = false;

const SOLUTIONS_FILE = "./solutions.log";

await main();

async function main(): Promise<void> {
  const availableCommands = [
    "help",
    "version",
    "next",
    "add",
    "debug:show-json-log",
    "debug:show-problem-info",
  ] as const;

  type CommandType = (typeof availableCommands)[number];

  const args = process.argv.slice(2);

  const command = args.shift() as CommandType;

  switch (command) {
    case "help": {
      printHelp();

      break;
    }

    case "version": {
      console.log(`lc-review v${packageJson.version}`);

      break;
    }

    case "next": {
      const n = args.shift();

      await review(SOLUTIONS_FILE, n ? parseInt(n) : 1, INCLUDE_PREMIUM);

      break;
    }

    case "add": {
      const problemNumber = args.shift();

      const confidence = args.shift();

      const skip = args.shift() === "skip";

      if (!problemNumber || !confidence) {
        console.error("problem number and confidence are required");
        process.exit(1);
      }

      const problemNumberInt = parseInt(problemNumber);
      if (isNaN(problemNumberInt)) {
        console.error(
          `problem number must be an integer; got: ${problemNumber}`,
        );
        process.exit(1);
      }

      const confidenceFloat = parseFloat(confidence);
      if (isNaN(confidenceFloat)) {
        console.error(`confidence must be a number; got: ${confidence}`);
        process.exit(1);
      }

      if (confidenceFloat < 0 || confidenceFloat > 1) {
        console.error(
          `confidence must be between 0 and 1; got: ${confidenceFloat}`,
        );
        process.exit(1);
      }

      // write to file in the following format:
      // date=2025-06-05 problem=0175 confidence=1.0 skip=true

      const date = new Date().toISOString().split("T")[0];
      let logEntry = `date=${date} problem=${problemNumberInt
        .toString()
        .padStart(4, "0")} confidence=${confidenceFloat.toFixed(1)}`;
      if (skip) {
        logEntry += " skip=true";
      }

      await appendFile(SOLUTIONS_FILE, logEntry + "\n");

      break;
    }

    case "debug:show-json-log": {
      const logFile = args.shift();

      if (!logFile) {
        throw new Error("no log file provided");
      }

      await showJsonLog(logFile);

      break;
    }

    case "debug:show-problem-info": {
      const problemNumber = args.shift();

      if (!problemNumber) {
        throw new Error("no problem number provided");
      }

      showProblemInfo(problemNumber);

      break;
    }

    default:
      console.log(`Error: invalid command: ${command}`);
      console.log();

      printHelp();

      process.exit(1);
  }
}

function printHelp(): void {
  console.log(`Usage: lc-review <command> [options]

Commands:

    lc-review help

        Prints this help message.

    lc-review version

        Prints the version of lc-review.

    lc-review next [n_items]

        Gets the next N items for review.
        - n_items: (optional) The number of items to review (default: 1)

    lc-review add <problem_number> <grade> [skip]

        Adds a problem with a grade to the log.
        - problem_number: The problem number (integer)
        - grade: The grade for the problem (integer)

Debug commands:

    debug:show-json-log <log_file>

    debug:show-problem-info <problem_number>
`);
}

async function showProblemInfo(problemNumber: string): Promise<void> {
  // NOTE: problemNumber is the frontend ID, e.g., "1", "175", etc.
  const problem = ALL_PROBLEMS.find(
    (p) => p.questionFrontendId === problemNumber,
  );

  if (!problem) {
    console.log(`Problem ${problemNumber} not found.`);
    return;
  }

  log(`ID:         ${problem.id}`);
  log(`Title:      ${problem.title}`);
  log(`Difficulty: ${problem.difficulty}`);
  log(`Paid only:  ${problem.paidOnly}`);
  log(`AC Rate:    ${(problem.acRate * 100).toFixed(2)}%`);
  if (problem.topicTags) {
    log(`Topics:     ${problem.topicTags.map((tag) => tag.name).join(", ")}`);
  }
  log(`URL:        https://leetcode.com/problems/${problem.titleSlug}/`);
  log(`AC rate:    ${(problem.acRate * 100).toFixed(2)}%`);
}

async function showJsonLog(logFile: string): Promise<void> {
  const records = await readLogFromFile(logFile);

  console.log(JSON.stringify(records, null, 2));
}
