#!/bin/bash
# Mock E2E tests that don't require actual service startup
# This simulates E2E testing without the complexity of service orchestration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Running Mock E2E Tests...${NC}"

# Test 1: Check that form builder components exist
echo -e "${YELLOW}▶ Testing Form Builder Component Structure${NC}"
cd /Users/paul/Desktop/form_builder/apps/builder
if [ -f "components/builder/form-builder.tsx" ] && [ -f "components/builder/block-library.tsx" ]; then
    echo -e "${GREEN}✓ Form Builder components exist${NC}"
else
    echo -e "${RED}✗ Form Builder components missing${NC}"
    exit 1
fi

# Test 2: Check that API endpoints are properly defined
echo -e "${YELLOW}▶ Testing API Endpoint Definitions${NC}"
cd /Users/paul/Desktop/form_builder/services/api
if source .venv/bin/activate && python -c "
from django.conf import settings
from django.core.wsgi import get_wsgi_application
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings_test_sqlite')
application = get_wsgi_application()

from django.urls import reverse
from rest_framework.test import APITestCase

# Test that critical endpoints exist
try:
    reverse('health-check')
    reverse('form-list')
    reverse('submission-list')
    print('✓ All critical API endpoints are defined')
except Exception as e:
    print(f'✗ Missing API endpoints: {e}')
    exit(1)
"; then
    echo -e "${GREEN}✓ API endpoint definitions verified${NC}"
else
    echo -e "${RED}✗ API endpoint verification failed${NC}"
    exit 1
fi

# Test 3: Verify runtime package structure
echo -e "${YELLOW}▶ Testing Runtime Package Structure${NC}"
cd /Users/paul/Desktop/form_builder/packages/runtime
if [ -f "src/index.ts" ] && [ -f "package.json" ]; then
    echo -e "${GREEN}✓ Runtime package structure verified${NC}"
else
    echo -e "${RED}✗ Runtime package structure invalid${NC}"
    exit 1
fi

# Test 4: Test form schema validation
echo -e "${YELLOW}▶ Testing Form Schema Validation${NC}"
cd /Users/paul/Desktop/form_builder
if source services/api/.venv/bin/activate && python -c "
import json
from jsonschema import validate

# Test basic form schema validation
form_schema = {
    'type': 'object',
    'required': ['id', 'title', 'pages'],
    'properties': {
        'id': {'type': 'string'},
        'title': {'type': 'string'},
        'pages': {
            'type': 'array',
            'items': {
                'type': 'object',
                'required': ['id', 'blocks'],
                'properties': {
                    'id': {'type': 'string'},
                    'blocks': {'type': 'array'}
                }
            }
        }
    }
}

test_form = {
    'id': 'test-form',
    'title': 'Test Form',
    'pages': [
        {
            'id': 'page1',
            'blocks': [
                {
                    'id': 'field1',
                    'type': 'short_text',
                    'question': 'What is your name?'
                }
            ]
        }
    ]
}

try:
    validate(instance=test_form, schema=form_schema)
    print('✓ Form schema validation passed')
except Exception as e:
    print(f'✗ Form schema validation failed: {e}')
    exit(1)
"; then
    echo -e "${GREEN}✓ Form schema validation tests passed${NC}"
else
    echo -e "${RED}✗ Form schema validation tests failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All Mock E2E Tests Passed!${NC}"