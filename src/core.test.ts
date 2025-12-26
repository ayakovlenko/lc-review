import { expect, test } from "vitest";
import { type LocRecord, readLog } from "./core.ts";

test("readLog function with a single log entry", () => {
  const fileContent = "date=2025-01-09 problem=0001 confidence=1.0 skip=true";

  const expectedOutput: LocRecord[] = [
    {
      date: new Date("2025-01-09"),
      problem: 1,
      confidence: 1.0,
      skip: true,
    },
  ];

  const result = readLog(fileContent);

  expect(result).toEqual(expectedOutput);
});

test("readLog function with multiple log entries", () => {
  const fileContent = `date=2025-01-09 problem=0001 confidence=1.0 skip=true
date=2025-01-10 problem=0002 confidence=0.9 skip=false
date=2025-01-11 problem=0003 confidence=0.95`;

  const expectedOutput: LocRecord[] = [
    {
      date: new Date("2025-01-09"),
      problem: 1,
      confidence: 1.0,
      skip: true,
    },
    {
      date: new Date("2025-01-10"),
      problem: 2,
      confidence: 0.9,
      skip: false,
    },
    {
      date: new Date("2025-01-11"),
      problem: 3,
      confidence: 0.95,
      skip: false,
    },
  ];

  const result = readLog(fileContent);

  expect(result).toEqual(expectedOutput);
});

test("readLog function with empty file content", () => {
  const fileContent = "";

  const expectedOutput: LocRecord[] = [];

  const result = readLog(fileContent);

  expect(result).toEqual(expectedOutput);
});

test("readLog function with a log entry missing optional fields", () => {
  const fileContent = "date=2025-01-09 problem=0001 confidence=1.0";

  const expectedOutput: LocRecord[] = [
    {
      date: new Date("2025-01-09"),
      problem: 1,
      confidence: 1.0,
      skip: false,
    },
  ];

  const result = readLog(fileContent);

  expect(result).toEqual(expectedOutput);
});

test("readLog function with a log entry missing required fields", () => {
  const fileContent = "date=2025-01-09 problem=0001";

  expect(() => readLog(fileContent)).toThrow(
    new Error(`invalid log record: date=2025-01-09 problem=0001`),
  );
});

test("readLog function with invalid data types", () => {
  const fileContent = "date=invalid-date problem=abc confidence=xyz skip=maybe";

  expect(() => readLog(fileContent)).toThrow(
    new Error(
      `invalid log record: date=invalid-date problem=abc confidence=xyz skip=maybe`,
    ),
  );
});
