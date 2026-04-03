#!/bin/bash
# Run the public data refresh for all cities
# Usage: CRON_SECRET=your-secret APP_URL=https://your-app.vercel.app ./scripts/populate-live-data.sh

set -e

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET env var required"
  echo "Usage: CRON_SECRET=your-secret APP_URL=https://your-app.vercel.app $0"
  exit 1
fi

APP_URL="${APP_URL:-http://localhost:3000}"

echo "Triggering full data refresh on $APP_URL..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$APP_URL/api/refresh-public-data" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Success!"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "Failed with HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

echo ""
echo "Now trigger field report aggregation..."

RESPONSE2=$(curl -s -w "\n%{http_code}" \
  -X POST "$APP_URL/api/aggregate-signals" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

if [ "$HTTP_CODE2" = "200" ]; then
  echo "Aggregation complete!"
  echo "$BODY2" | python3 -m json.tool 2>/dev/null || echo "$BODY2"
else
  echo "Aggregation failed with HTTP $HTTP_CODE2"
  echo "$BODY2"
fi

echo ""
echo "Done. Check city_data_sources table in Supabase to verify data populated."
