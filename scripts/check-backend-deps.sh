#!/bin/bash

# Script to verify backend dependencies are properly configured
# This helps catch missing dependencies before CI runs

set -e

echo "🔍 Checking Backend Dependencies"
echo "================================"

cd "$(dirname "$0")/../services/api" || exit 1

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found!"
    exit 1
fi

# Check for python-decouple
if ! grep -q "python-decouple" requirements.txt; then
    echo "❌ Missing python-decouple in requirements.txt"
    echo "   This is required for settings.py"
    echo "   Add: python-decouple==3.8"
    exit 1
fi

# Check all imports in settings.py
echo "→ Checking settings.py imports..."
if [ -f "api/settings.py" ]; then
    # Extract all imports from settings.py
    imports=$(grep -E "^from|^import" api/settings.py | grep -v "^#" || true)
    
    # Check each import
    while IFS= read -r line; do
        if [[ $line == *"from decouple import"* ]]; then
            echo "✓ Found decouple import"
        fi
        if [[ $line == *"import environ"* ]] || [[ $line == *"from environ import"* ]]; then
            if ! grep -q "django-environ" requirements.txt; then
                echo "❌ django-environ used but not in requirements.txt"
                exit 1
            fi
        fi
    done <<< "$imports"
fi

# Create a test virtual environment to verify all dependencies install
echo ""
echo "→ Creating test virtual environment..."
test_venv=".test_venv_$$"
python3 -m venv "$test_venv"
source "$test_venv/bin/activate"

echo "→ Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# Test imports
echo "→ Testing Python imports..."
python -c "
try:
    from decouple import config
    print('✓ python-decouple imports correctly')
except ImportError as e:
    print('❌ Failed to import decouple:', e)
    exit(1)

try:
    import django
    print('✓ Django imports correctly')
except ImportError as e:
    print('❌ Failed to import django:', e)
    exit(1)
"

# Cleanup
deactivate
rm -rf "$test_venv"

echo ""
echo "✅ Backend dependencies check passed!"