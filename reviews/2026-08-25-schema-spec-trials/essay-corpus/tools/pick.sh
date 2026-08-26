#!/bin/sh
# view a window of an extracted text with absolute line numbers
sed -n "$2,$3p" "work/extracted/$1.md" | awk -v s="$2" '{printf "%5d| %s\n", s+NR-1, $0}'
