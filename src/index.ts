#!/usr/bin/env node
import { appendFile } from "node:fs/promises";
import process, { cwd } from "node:process";
import { readLogFromFile } from "./core.ts";
import { review } from "./review.ts";
import packageJson from "../package.json" with { type: "json" };
import { parseArgs } from "node:util";
import { encode as encodeToon } from "@toon-format/toon";
import { join } from "node:path";
import { ALL_PROBLEMS } from "./gen/problems.ts";

const INCLUDE_PREMIUM = false;

await main();

function findSolutionLogFile(): string {
  const fromEnv = process.env["LC_REVIEW_SOLUTIONS_FILE"];
  if (fromEnv) {
    return fromEnv;
  }

  return join(cwd(), "solutions.log");
}

async function main(): Promise<void> {
  const SOLUTIONS_FILE = findSolutionLogFile();

  const { values: globalValues, positionals: args } = parseArgs({
    args: process.argv.slice(2),
    options: {
      agent: { type: "boolean" },
      difficulty: { type: "string" },
    },
    allowPositionals: true,
    strict: false,
  });

  const availableCommands = [
    "help",
    "version",
    "next",
    "add",
    "list-unsolved",
    "debug:show-solutions-log",
    "debug:show-problem-info",
  ] as const;

  type CommandType = (typeof availableCommands)[number];

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

    case "list-unsolved": {
      await listUnsolvedProblems(SOLUTIONS_FILE, {
        includePremium: INCLUDE_PREMIUM,
        difficulty: globalValues.difficulty as string | undefined,
      });

      break;
    }

    case "debug:show-solutions-log": {
      const isAgent = globalValues.agent === true;

      await showJsonLog(SOLUTIONS_FILE, isAgent);

      break;
    }

    case "debug:show-problem-info": {
      const problemNumbers = args.shift();

      if (!problemNumbers) {
        throw new Error("no problem numbers provided");
      }

      const isAgent = globalValues.agent === true;

      showProblemInfo(problemNumbers.split(","), isAgent);

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
  console.log(`Usage: lc-review [flags] <command> [options]

Flags:

  --agent

       Outputs results in a machine-readable format (toon) for use with agents.

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
    
    lc-review list-unsolved [--difficulty <difficulty>]

        Lists all unsolved problems.
        - --difficulty: (optional) Filter by difficulty (Easy, Medium, Hard)

Debug commands:

    debug:show-json-log <log_file>

    debug:show-problem-info <problem_number>[,problem_number,...]
`);
}

async function listUnsolvedProblems(
  logFile: string,
  options: { includePremium: boolean; difficulty: string | undefined },
): Promise<void> {
  const records = await readLogFromFile(logFile);

  const solvedProblemIds = new Set(records.map((record) => record.problem));

  let unsolvedProblems = ALL_PROBLEMS.filter(
    (problem) => !solvedProblemIds.has(parseInt(problem.questionFrontendId)),
  );

  if (!options.includePremium) {
    unsolvedProblems = unsolvedProblems.filter((problem) => !problem.paidOnly);
  }

  if (options.difficulty) {
    unsolvedProblems = unsolvedProblems.filter(
      (problem) =>
        problem.difficulty.toLowerCase() === options.difficulty!.toLowerCase(),
    );
  }

  for (const problem of unsolvedProblems) {
    console.log(`https://leetcode.com/problems/${problem.titleSlug}/`);
  }
}

async function showProblemInfo(
  problemNumbers: string[],
  isAgent: boolean,
): Promise<void> {
  const problems: typeof ALL_PROBLEMS = [];
  for (const problemNumber of problemNumbers) {
    const problem = ALL_PROBLEMS.find(
      (p) => p.questionFrontendId === problemNumber,
    );

    if (problem) {
      problems.push(problem);
    }
  }

  if (!problems) {
    console.log(`No problems found for numbers: ${problemNumbers.join(", ")}`);
    return;
  }

  if (isAgent) {
    console.log(
      encodeToon(
        problems.map((problem) => {
          return {
            id: problem.questionFrontendId,
            title: problem.title,
            difficulty: problem.difficulty,
            paidOnly: problem.paidOnly,
            acRate: problem.acRate,
            topics: problem.topicTags.map((tag) => tag.slug),
            url: `https://leetcode.com/problems/${problem.titleSlug}/`,
          };
        }),
      ),
    );
    return;
  }

  for (const problem of problems) {
    console.log(`ID:         ${problem.questionFrontendId}`);
    console.log(`Title:      ${problem.title}`);
    console.log(`Difficulty: ${problem.difficulty}`);
    console.log(`Paid only:  ${problem.paidOnly}`);
    console.log(`AC Rate:    ${(problem.acRate * 100).toFixed(2)}%`);
    if (problem.topicTags) {
      console.log(
        `Topics:     ${problem.topicTags.map((tag) => tag.name).join(", ")}`,
      );
    }
    console.log(
      `URL:        https://leetcode.com/problems/${problem.titleSlug}/`,
    );
    console.log("");
  }
}

async function showJsonLog(logFile: string, isAgent: boolean): Promise<void> {
  const records = await readLogFromFile(logFile);

  if (isAgent) {
    console.log(encodeToon(records));
    return;
  }

  console.log(JSON.stringify(records, null, 2));
}
