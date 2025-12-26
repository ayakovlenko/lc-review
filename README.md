# lc-review

[![LeetCode](https://img.shields.io/badge/LeetCode-000000?logo=LeetCode&logoColor=#d16c06)](#)

`lc-review` is a command-line tool designed to help you manage and review your
LeetCode problems using the SuperMemo 2 (SM2) algorithm for spaced repetition.
It processes your problem-solving logs and generates a prioritized list of
problems to review based on their due dates and frustration scores.

## Installation

```bash
npm i -G lc-review
```

## Usage

Show the next `n` problems to review (default: 1):

- `lc-review next [n]`

Example:

```bash
lc-review next 3
```

Record a solved attempt (grade 1-5):

- `lc-review add <problem_number> <grade>`

Example:

```bash
# add a problem result
lc-review add 1234 4
```
