#!/bin/bash
set -e

rm -rf dev/app/lib/common dev/app/spec/lib/common
cp -r source/lib/common dev/app/lib/common
cp -r source/spec/lib/common dev/app/spec/lib/common
