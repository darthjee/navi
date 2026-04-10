#!/bin/bash

function usage() {
    echo "Usage: $0 [-o output_file] file1.md file2.md ..."
}

function create_output_dir() {
    local output_file="$1"
    local output_dir=$(dirname "$output_file")
    mkdir -p "$output_dir"
}

function concatenate_files() {
    local output_file="$1"
    shift
    > "$output_file"  # Truncate the output file
    for file in "$@"; do
        if [ ! -f "$file" ]; then
            echo "Warning: File $file does not exist." >&2
            continue
        fi
        echo "<!-- File: $file -->" >> "$output_file"
        cat "$file" >> "$output_file"
        echo -e "\n---\n" >> "$output_file"
    done
}

# Main script
output_file="output.md"

while getopts "o:" opt; do
    case $opt in
        o) output_file="$OPTARG" ;;
        *) usage; exit 1 ;;
    esac
done

shift $((OPTIND-1))

if [ $# -eq 0 ]; then
    echo "No input files provided." >&2
    exit 1
fi

create_output_dir "$output_file"
concatenate_files "$output_file" "$@"