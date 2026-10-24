# Docs Plan: Rename logger/ folder to deku-sprout/

Main plan: [plan.md](plan.md)

## Shared contracts

- The folder is now `deku-sprout/`. The npm name and README version row (`Lib (Deku Sprout)`) are unchanged.

## Implementation Steps

### Step 1: Root README and the package README

- `README.md:23`: `` `deku-sprout` (`logger/`) `` → `` `deku-sprout` (`deku-sprout/`) ``. Leave `` `deku-swarm` (`worker/`) `` alone (#1001).
- `deku-sprout/README.md` (moved by the logger step): check it for folder-path references. None are expected: `Logger.setLogger(logger)` is a concept use and stays.

## Files to Change

- `README.md`: the folder name in the npm packages list

## Notes

- Your agent description mentions `logger/README.md`. The coordinator updates it to `deku-sprout/README.md` in `.claude/agents/docs.md`.
