import { readFile } from "node:fs/promises";
import { z } from "zod";

const logRecordSchema = z.object({
  date: z.preprocess((val) => new Date(String(val)), z.date()),
  problem: z.preprocess((val) => Number(String(val)), z.number().int()),
  confidence: z.preprocess((val) => Number(String(val)), z.number()),
  skip: z
    .preprocess(
      (val) => (val ? String(val).toLowerCase() === "true" : false),
      z.boolean(),
    )
    .default(false),
});

export type LocRecord = z.infer<typeof logRecordSchema>;

export async function readLogFromFile(filepath: string): Promise<LocRecord[]> {
  const fileContent = await readFile(filepath, "utf8");

  return readLog(fileContent);
}

export function readLog(fileContent: string): LocRecord[] {
  const lines = fileContent.split("\n");

  const records: LocRecord[] = [];

  for (const line of lines) {
    if (line.trim()) {
      records.push(parseLine(line));
    }
  }

  return records;
}

function parseLine(line: string): LocRecord {
  const parts = line.split(" ");

  const recordDict: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (!key || !value) {
      throw new Error(`invalid log record: ${line}`);
    }

    recordDict[key] = value;
  }

  const result = logRecordSchema.safeParse(recordDict);

  if (!result.success) {
    throw new Error(`invalid log record: ${line}`);
  }

  return result.data;
}
