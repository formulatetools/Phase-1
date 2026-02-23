#!/bin/bash
# Push branded email templates to Supabase production
#
# Usage:
#   1. Go to https://supabase.com/dashboard/account/tokens
#   2. Generate a new access token
#   3. Run: SUPABASE_ACCESS_TOKEN=your_token ./scripts/push-supabase-email-templates.sh
#
# Or update templates manually:
#   1. Go to https://supabase.com/dashboard/project/gjjvlqxlzfoxkcbjmktn/auth/templates
#   2. Paste the HTML from each file in supabase/templates/ into the corresponding template

PROJECT_REF="gjjvlqxlzfoxkcbjmktn"
API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set"
  echo ""
  echo "Generate a token at: https://supabase.com/dashboard/account/tokens"
  echo "Then run: SUPABASE_ACCESS_TOKEN=your_token $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Reading email templates..."

CONFIRM_HTML=$(cat "$SCRIPT_DIR/supabase/templates/confirm-signup.html")
MAGIC_HTML=$(cat "$SCRIPT_DIR/supabase/templates/magic-link.html")
RECOVERY_HTML=$(cat "$SCRIPT_DIR/supabase/templates/reset-password.html")
INVITE_HTML=$(cat "$SCRIPT_DIR/supabase/templates/invite.html")

echo "Pushing to Supabase project: $PROJECT_REF"

# Build the JSON payload using python for proper escaping
PAYLOAD=$(python3 -c "
import json
confirm = open('$SCRIPT_DIR/supabase/templates/confirm-signup.html').read()
magic = open('$SCRIPT_DIR/supabase/templates/magic-link.html').read()
recovery = open('$SCRIPT_DIR/supabase/templates/reset-password.html').read()
invite = open('$SCRIPT_DIR/supabase/templates/invite.html').read()

print(json.dumps({
    'MAILER_SUBJECTS_CONFIRMATION': 'Confirm your Formulate account',
    'MAILER_SUBJECTS_MAGIC_LINK': 'Your Formulate login link',
    'MAILER_SUBJECTS_RECOVERY': 'Reset your Formulate password',
    'MAILER_SUBJECTS_INVITE': \"You've been invited to Formulate\",
    'MAILER_TEMPLATES_CONFIRMATION_CONTENT': confirm,
    'MAILER_TEMPLATES_MAGIC_LINK_CONTENT': magic,
    'MAILER_TEMPLATES_RECOVERY_CONTENT': recovery,
    'MAILER_TEMPLATES_INVITE_CONTENT': invite,
}))
")

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$API_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Email templates updated successfully!"
else
  echo "✗ Failed to update templates (HTTP $HTTP_CODE)"
  echo "$BODY"
  echo ""
  echo "You can update them manually at:"
  echo "https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
fi
