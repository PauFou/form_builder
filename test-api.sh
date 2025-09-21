#!/bin/bash

# Test API and create test form

echo "🧪 Testing API endpoints and creating test data"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:8000"

# 1. Test if API is running
echo -e "${BLUE}1. Testing API health...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/v1/health/)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    exit 1
fi

# 2. Login and get token
echo -e "\n${BLUE}2. Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/v1/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "Test1234!"
    }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])" 2>/dev/null)
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['refresh'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}✗ Login failed. Response: $LOGIN_RESPONSE${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Successfully authenticated${NC}"
fi

# 3. Get current user info
echo -e "\n${BLUE}3. Getting user info...${NC}"
USER_INFO=$(curl -s -X GET $API_URL/api/v1/auth/me/ \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo -e "${GREEN}User: $(echo $USER_INFO | python3 -c "import sys, json; print(json.load(sys.stdin)['email'])")${NC}"

# 4. Get or create organization
echo -e "\n${BLUE}4. Getting organizations...${NC}"
ORGS_RESPONSE=$(curl -s -X GET $API_URL/api/v1/orgs/ \
    -H "Authorization: Bearer $ACCESS_TOKEN")

ORG_ID=$(echo $ORGS_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'results' in data and len(data['results']) > 0:
    print(data['results'][0]['id'])
elif isinstance(data, list) and len(data) > 0:
    print(data[0]['id'])
else:
    print('')
" 2>/dev/null)

if [ -z "$ORG_ID" ]; then
    echo -e "${YELLOW}No organization found, creating one...${NC}"
    CREATE_ORG_RESPONSE=$(curl -s -X POST $API_URL/api/v1/orgs/ \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Organization",
            "slug": "test-org"
        }')
    ORG_ID=$(echo $CREATE_ORG_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    if [ -z "$ORG_ID" ]; then
        echo -e "${RED}✗ Failed to create organization: $CREATE_ORG_RESPONSE${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Organization ID: $ORG_ID${NC}"

# 5. Create a test form
echo -e "\n${BLUE}5. Creating test form...${NC}"
CREATE_FORM_RESPONSE=$(curl -s -X POST $API_URL/api/v1/forms/ \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"organization_id\": \"$ORG_ID\",
        \"title\": \"Test Form $(date +%s)\",
        \"description\": \"A test form created via API\",
        \"pages\": [{
            \"id\": \"page-1\",
            \"title\": \"Page 1\",
            \"blocks\": [{
                \"id\": \"block-1\",
                \"type\": \"short_text\",
                \"question\": \"What is your name?\",
                \"required\": true
            }]
        }]
    }")

FORM_ID=$(echo $CREATE_FORM_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -z "$FORM_ID" ]; then
    echo -e "${RED}✗ Failed to create form: $CREATE_FORM_RESPONSE${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Form created with ID: $FORM_ID${NC}"
fi

# 6. Test update endpoint
echo -e "\n${BLUE}6. Testing form update...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT $API_URL/api/v1/forms/$FORM_ID/ \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"title\": \"Updated Test Form\",
        \"description\": \"Updated description\",
        \"pages\": [{
            \"id\": \"page-1\",
            \"title\": \"Updated Page\",
            \"blocks\": [{
                \"id\": \"block-1\",
                \"type\": \"short_text\",
                \"question\": \"What is your full name?\",
                \"required\": true
            }]
        }]
    }")

UPDATE_STATUS=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print('OK' if 'id' in data else 'FAIL')" 2>/dev/null || echo "FAIL")

if [ "$UPDATE_STATUS" = "OK" ]; then
    echo -e "${GREEN}✓ Form updated successfully${NC}"
else
    echo -e "${RED}✗ Update failed: $UPDATE_RESPONSE${NC}"
fi

# 7. List forms to verify
echo -e "\n${BLUE}7. Listing forms...${NC}"
LIST_RESPONSE=$(curl -s -X GET $API_URL/api/v1/forms/ \
    -H "Authorization: Bearer $ACCESS_TOKEN")

FORM_COUNT=$(echo $LIST_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'forms' in data:
    print(len(data['forms']))
elif 'results' in data:
    print(len(data['results']))
elif isinstance(data, list):
    print(len(data))
else:
    print(0)
" 2>/dev/null || echo "0")

echo -e "${GREEN}✓ Total forms: $FORM_COUNT${NC}"

echo -e "\n${GREEN}✅ API test complete!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  - API URL: $API_URL"
echo -e "  - Organization ID: $ORG_ID"
echo -e "  - Form ID: $FORM_ID"
echo -e "  - Access Token: ${ACCESS_TOKEN:0:20}..."
echo -e "\n${YELLOW}You can now:${NC}"
echo -e "  - View the form in the builder: http://localhost:3001/forms/${FORM_ID}/edit"
echo -e "  - Test the form endpoints with the token above"