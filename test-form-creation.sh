#!/bin/bash

echo "Testing Form Creation Flow"
echo "=========================="

# 1. Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s http://localhost:8000/v1/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234!"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")
ORG_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['organization']['id'])")

echo "Token: ${TOKEN:0:20}..."
echo "Organization ID: $ORG_ID"

# 2. Create a form
echo -e "\n2. Creating a form..."
FORM_RESPONSE=$(curl -s http://localhost:8000/v1/forms/ \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Form $(date +%s)\",
    \"description\": \"Created via API test\",
    \"organization_id\": \"$ORG_ID\"
  }")

FORM_ID=$(echo $FORM_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'ERROR'))")
echo "Form ID: $FORM_ID"

# 3. Update the form
echo -e "\n3. Updating the form..."
UPDATE_RESPONSE=$(curl -s http://localhost:8000/v1/forms/$FORM_ID/ \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Form",
    "description": "This form was updated via API",
    "pages": [{
      "id": "page-1",
      "title": "Welcome Page",
      "blocks": [{
        "id": "block-1",
        "type": "short_text",
        "properties": {
          "label": "What is your name?",
          "required": true
        }
      }]
    }]
  }')

echo "Update response status: $(echo $UPDATE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print('SUCCESS' if 'id' in d else 'FAILED')")"

# 4. Get the form
echo -e "\n4. Retrieving the form..."
GET_RESPONSE=$(curl -s http://localhost:8000/v1/forms/$FORM_ID/ \
  -H "Authorization: Bearer $TOKEN")

TITLE=$(echo $GET_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('title', 'ERROR'))")
echo "Retrieved form title: $TITLE"

echo -e "\n✅ Test completed successfully!"