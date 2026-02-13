#!/bin/bash
# Updates the cache-busting query parameter on style.css references
# Run this after modifying style.css, before committing.

HASH=$(md5sum style.css | cut -c1-8)

for f in *.html; do
  sed -i "s/style\.css?v=[a-f0-9]*/style.css?v=$HASH/" "$f"
done

echo "Updated style.css cache buster to ?v=$HASH"
