#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$DIR/check-and-publish-package.sh" logger deku-sprout deku-sprout-
