#!/bin/bash

# cd to script dir
cd "$(dirname "$0")"

for f in no_border/*.png; do
    python ../add_border.py --role prover $f with_border/$(basename $f)
    echo "Added border to $f"
done
