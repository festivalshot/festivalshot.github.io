#!/usr/bin/env bash
set -euo pipefail

CONFIG="$HOME/.config/festivalshot/config"

usage() {
  echo "Usage: $0 <photo.jpg> \"Artist Name\" \"Venue, City\""
  exit 1
}

[[ $# -lt 3 ]] && usage

FILE="$1"
ARTIST="$2"
LOCATION="$3"

[[ ! -f "$FILE" ]] && echo "Error: file '$FILE' not found" && exit 1
[[ ! -f "$CONFIG" ]] && echo "Error: config not found at $CONFIG" && exit 1

# shellcheck source=/dev/null
source "$CONFIG"

BASENAME=$(basename "$FILE")

# Extract date from filename (DD.MM.YYYY pattern), fall back to today
if [[ "$BASENAME" =~ ([0-9]{2})\.([0-9]{2})\.([0-9]{4}) ]]; then
  DAY="${BASH_REMATCH[1]}"
  MONTH="${BASH_REMATCH[2]}"
  YEAR="${BASH_REMATCH[3]}"
  PHOTO_DATE="${YEAR}-${MONTH}-${DAY}"
else
  YEAR=$(date +%Y)
  PHOTO_DATE=$(date +%Y-%m-%d)
fi

# Generate URL-friendly filename from file content hash
EXT="${BASENAME##*.}"
EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')
HASH=$(sha256sum "$FILE" | cut -c1-12)
R2_KEY="${YEAR}/${HASH}.${EXT}"

echo "Uploading ${BASENAME} as ${R2_KEY}..."

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "$FILE" "s3://${R2_BUCKET}/${R2_KEY}" \
  --endpoint-url "$R2_ENDPOINT" \
  --region auto \
  --content-type "image/jpeg" \
  --cache-control "public, max-age=31536000, immutable"

echo "Uploaded: ${PUBLIC_URL}/${R2_KEY}"

# Update photos.json — prepend new entry
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="${SCRIPT_DIR}/photos.json"

ESCAPED_ARTIST=$(echo "$ARTIST" | sed 's/"/\\"/g')
ESCAPED_LOCATION=$(echo "$LOCATION" | sed 's/"/\\"/g')

TMP=$(mktemp)
jq --arg file "$R2_KEY" \
   --arg artist "$ESCAPED_ARTIST" \
   --arg date "$PHOTO_DATE" \
   --arg location "$ESCAPED_LOCATION" \
   '[{"file": $file, "artist": $artist, "date": $date, "location": $location}] + .' \
   "$MANIFEST" > "$TMP" && mv "$TMP" "$MANIFEST"

echo "Updated photos.json"
