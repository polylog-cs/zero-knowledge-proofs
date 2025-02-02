#!/bin/bash

# cd to script dir
cd "$(dirname "$0")"

cd orig
for i in *.png; do
	magick $i -resize $(if [ $i = thinking.png ]; then echo '500x'; else echo x600; fi) -background none -gravity north -extent 800x800 -gravity center -extent 900x900 ../no_border/$i
done
cd ..

for f in no_border/*.png; do
	python ../add_border.py --role verifier $f with_border/$(basename $f)
	echo "Added border to $f"
done
