#!/bin/bash
#!/bin/bash

# Function to display usage information
function usage() {
    echo "Usage: $0 [-o output_file] file1.js file2.js ..."
    echo "  -o: Specify output file (default: output.js)"
    exit 1
}

# Function to concatenate files
function concatenate_files() {
    local output_file="$1"
    shift
    local files=("$@")

    # Create output directory if it doesn't exist
    mkdir -p "$(dirname "$output_file")"

    # Clear the output file
    > "$output_file"

    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "Error: File '$file' does not exist." >&2
            exit 1
        fi
        echo "" >> "$output_file"
        echo "// File: $file" >> "$output_file"
        cat "$file" >> "$output_file"
        echo "" >> "$output_file"  # Add a newline after each file
    done
}

# Parse command-line options
output_file="output.js"
files=()

while getopts ":o:" opt; do
    case $opt in
        o)
            output_file="$OPTARG"
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            usage
            ;;
        :)
            echo "Option -$OPTARG requires an argument." >&2
            usage
            ;;
    esac
done

# Shift to get the remaining arguments (files)
shift $((OPTIND - 1))

# Check if at least one file is provided
if [[ $# -eq 0 ]]; then
    echo "Error: No input files provided." >&2
    usage
fi

files=("$@")

# Call the concatenate function
concatenate_files "$output_file" "${files[@]}"

echo "Concatenation complete. Output saved to: $output_file"
