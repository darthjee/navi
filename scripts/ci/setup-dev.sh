#!/bin/bash
set -e

rm -rf dev/app/lib/common dev/app/spec/lib/common
cp -r source/lib/common dev/app/lib/common
cp -r source/spec/lib/common dev/app/spec/lib/common

# dev/app depends on deku-sprout via "file:../deku-sprout", which resolves to
# /home/node/deku-sprout inside Docker (compose mount) but to dev/deku-sprout on a bare
# CI checkout — place a copy there so yarn can resolve it.
rm -rf dev/deku-sprout
cp -r deku-sprout dev/deku-sprout
