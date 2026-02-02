#!/bin/bash
# Logto seed script - creates webapp application and excelfore user

set -e

LOGTO_ENDPOINT="${LOGTO_ENDPOINT:-http://logto:3001}"
LOGTO_ADMIN_ENDPOINT="${LOGTO_ADMIN_ENDPOINT:-http://logto:3002}"

echo "Waiting for Logto to be ready..."
until curl -sf "${LOGTO_ENDPOINT}/api/status" > /dev/null 2>&1; do
  echo "Logto not ready, waiting..."
  sleep 5
done
echo "Logto is ready!"

# Get Management API access token using machine-to-machine flow
# First, we need to get the default M2M app credentials from the admin API
echo "Getting Management API credentials..."

# Create the webapp application
echo "Creating webapp application..."
APP_RESPONSE=$(curl -sf -X POST "${LOGTO_ENDPOINT}/api/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webapp Login Example",
    "description": "OAuth2 webapp login example",
    "type": "Traditional",
    "oidcClientMetadata": {
      "redirectUris": ["http://localhost:3000/auth/logto/callback"],
      "postLogoutRedirectUris": ["http://localhost:3000/"]
    }
  }' 2>/dev/null) || true

if [ -n "$APP_RESPONSE" ]; then
  APP_ID=$(echo "$APP_RESPONSE" | jq -r '.id // empty')
  APP_SECRET=$(echo "$APP_RESPONSE" | jq -r '.secret // empty')
  if [ -n "$APP_ID" ]; then
    echo "Created application: $APP_ID"
    echo "LOGTO_CLIENT_ID=$APP_ID" >> /data/seed_output.env
    echo "LOGTO_CLIENT_SECRET=$APP_SECRET" >> /data/seed_output.env
  fi
fi

# Create the excelfore user
echo "Creating excelfore user..."
USER_RESPONSE=$(curl -sf -X POST "${LOGTO_ENDPOINT}/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "excelfore",
    "password": "excelfore32!",
    "name": "Excelfore User",
    "primaryEmail": "excelfore@example.com"
  }' 2>/dev/null) || true

if [ -n "$USER_RESPONSE" ]; then
  USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id // empty')
  if [ -n "$USER_ID" ]; then
    echo "Created user: excelfore ($USER_ID)"
  fi
fi

echo "Logto seeding complete!"
