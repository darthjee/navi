#!/bin/bash
#
# link_farm.sh <dest> <src-node_modules> [<src-node_modules> ...]
#
# Populates <dest> with symlinks to every top-level package found in the given
# source node_modules directories. Earlier sources win on name clashes. Scoped
# (@scope/pkg) packages are linked one level deeper so a later source can still
# contribute sibling packages under the same scope. `.bin` and dot-entries are
# skipped. Node resolves each linked package's own dependencies from its real
# location, so the two Navi installs stay self-consistent.

set -uo pipefail

dest="${1:?usage: link_farm.sh <dest> <src-node_modules>...}"
shift
mkdir -p "$dest"

for src in "$@"; do
  [ -d "$src" ] || continue
  for entry in "$src"/*; do
    [ -e "$entry" ] || continue
    name="$(basename "$entry")"
    case "$name" in
      .bin|.*) continue ;;
    esac
    if [ "${name#@}" != "$name" ]; then
      mkdir -p "$dest/$name"
      for sub in "$entry"/*; do
        [ -e "$sub" ] || continue
        subname="$(basename "$sub")"
        [ -e "$dest/$name/$subname" ] || ln -s "$sub" "$dest/$name/$subname"
      done
    else
      [ -e "$dest/$name" ] || ln -s "$entry" "$dest/$name"
    fi
  done
done
