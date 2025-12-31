# lc-review

[![NPM Version](https://img.shields.io/npm/v/lc-review)](https://www.npmjs.com/package/lc-review)

`lc-review` is a command-line tool designed to help you manage and review your
LeetCode problems using the SuperMemo 2 (SM2) algorithm for spaced repetition.
It processes your problem-solving logs and generates a prioritized list of
problems to review based on their due dates and frustration scores.

## Installation

```bash
npm install --global lc-review@latest
```

## Usage

Show the next `n` problems to review (default: 1):

- `lc-review next [n]`

Example:

```bash
lc-review next 3
```

Record a solved attempt (confidence range: 0.0 to 1.0):

- `lc-review add <problem_number> <confidence>`

Example:

```bash
# add a problem result
lc-review add 1234 0.4
```

## solutions.log File

The tool automatically creates and maintains a `solutions.log` file in your
current directory to track your problem-solving history. Each entry is recorded
in the following format:

```
date=YYYY-MM-DD problem=#### confidence=N.N [skip=true]
```

- **date**: The date you solved the problem (ISO format)
- **problem**: The LeetCode problem number (zero-padded to 4 digits)
- **confidence**: Your confidence level from 0.0 (no confidence) to 1.0 (full
  confidence)
- **skip**: Optional flag to mark a problem as skipped in reviews

This file is used by the SM2 algorithm to calculate when you should review each
problem next.
