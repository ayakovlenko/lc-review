#!/usr/bin/env bash
set -eax

npm run gen

npm run build

npm publish
