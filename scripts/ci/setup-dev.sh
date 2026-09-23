#!/bin/bash
set -e

rm -rf dev/app/lib/common dev/app/spec/lib/common
cp -r source/lib/common dev/app/lib/common
cp -r source/spec/lib/common dev/app/spec/lib/common

# dev/app depends on deku-sprout via "file:../logger", which resolves to
# /home/node/logger inside Docker (compose mount) but to dev/logger on a bare
# CI checkout — place a copy there so yarn can resolve it.
rm -rf dev/logger
cp -r logger dev/logger
