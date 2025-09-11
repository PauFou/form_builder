import os
import sys
import django
from django.conf import settings

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings before importing anything else
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

# Setup Django
django.setup()