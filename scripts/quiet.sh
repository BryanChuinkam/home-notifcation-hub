#!/usr/bin/env bash
set -u
mkdir -p .verification
log=$(mktemp .verification/check.XXXXXX)
if "$@" >"$log" 2>&1; then
  printf 'PASS: %s\n' "$*"
  rm -f "$log"
else
  result=$?
  printf 'FAIL (%s): %s — full log: %s\n' "$result" "$*" "$log" >&2
  tail -n 60 "$log" >&2
  exit "$result"
fi
