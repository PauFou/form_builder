import pytest
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from forms.models import Form, FormPage, FormBlock
from importers.typeform_importer import TypeformImporter
from importers.google_forms_importer import GoogleFormsImporter

User = get_user_model()


class TypeformImporterTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            owner=self.user
        )
        self.importer = TypeformImporter(self.organization)

    def test_import_basic_form(self):
        """Test importing a basic Typeform"""
        typeform_data = {
            "id": "test123",
            "title": "Test Form",
            "welcome_screens": [{"title": "Welcome to our form"}],
            "fields": [
                {
                    "id": "field1",
                    "type": "short_text",
                    "title": "What is your name?",
                    "properties": {"placeholder": "Enter your name"},
                    "validations": {"required": True}
                },
                {
                    "id": "field2",
                    "type": "email",
                    "title": "What is your email?",
                    "validations": {"required": False}
                }
            ],
            "logic": [],
            "theme": {}
        }

        form, report = self.importer.import_form(typeform_data, self.user)

        self.assertEqual(form.title, "Test Form")
        self.assertEqual(form.organization, self.organization)
        self.assertEqual(form.created_by, self.user)
        
        # Check pages and blocks
        self.assertEqual(form.pages.count(), 1)
        page = form.pages.first()
        self.assertEqual(page.blocks.count(), 2)
        
        # Check blocks
        blocks = page.blocks.all()
        self.assertEqual(blocks[0].data['type'], 'text')
        self.assertEqual(blocks[0].data['question'], 'What is your name?')
        self.assertEqual(blocks[0].data['required'], True)
        
        self.assertEqual(blocks[1].data['type'], 'email')
        self.assertEqual(blocks[1].data['question'], 'What is your email?')
        self.assertEqual(blocks[1].data['required'], False)

        # Check report
        self.assertEqual(report['total_questions'], 2)
        self.assertEqual(report['imported'], 2)

    def test_import_multiple_choice(self):
        """Test importing multiple choice questions"""
        typeform_data = {
            "id": "test123",
            "title": "Choice Form",
            "fields": [
                {
                    "id": "field1",
                    "type": "multiple_choice",
                    "title": "Choose your favorite color",
                    "properties": {
                        "choices": [
                            {"id": "choice1", "label": "Red", "ref": "red"},
                            {"id": "choice2", "label": "Blue", "ref": "blue"},
                            {"id": "choice3", "label": "Green", "ref": "green"}
                        ]
                    }
                }
            ]
        }

        form, report = self.importer.import_form(typeform_data, self.user)
        
        block = form.pages.first().blocks.first()
        self.assertEqual(block.data['type'], 'single_select')
        self.assertEqual(len(block.data['options']), 3)
        self.assertEqual(block.data['options'][0]['text'], 'Red')
        self.assertEqual(block.data['options'][0]['value'], 'red')

    def test_import_unsupported_field(self):
        """Test handling of unsupported field types"""
        typeform_data = {
            "id": "test123",
            "title": "Unsupported Form",
            "fields": [
                {
                    "id": "field1",
                    "type": "unsupported_type",
                    "title": "Unsupported question"
                }
            ]
        }

        form, report = self.importer.import_form(typeform_data, self.user)
        
        self.assertEqual(report['total_questions'], 1)
        self.assertEqual(report['imported'], 0)
        self.assertEqual(len(report['unsupported']), 1)
        self.assertEqual(report['unsupported'][0]['type'], 'unsupported_type')

    def test_import_with_logic(self):
        """Test importing forms with logic rules"""
        typeform_data = {
            "id": "test123",
            "title": "Logic Form",
            "fields": [
                {
                    "id": "field1",
                    "type": "yes_no",
                    "title": "Do you like pizza?"
                },
                {
                    "id": "field2", 
                    "type": "short_text",
                    "title": "What's your favorite pizza?"
                }
            ],
            "logic": [
                {
                    "type": "field",
                    "ref": "field1",
                    "actions": [
                        {
                            "action": "jump",
                            "condition": {"op": "equal", "value": "yes"},
                            "details": {"to": {"value": "field2"}}
                        }
                    ]
                }
            ]
        }

        form, report = self.importer.import_form(typeform_data, self.user)
        
        self.assertIn('logic', form.data)
        logic_rules = form.data['logic']
        self.assertEqual(len(logic_rules), 1)
        self.assertEqual(logic_rules[0]['actions'][0]['type'], 'jump')


class GoogleFormsImporterTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.organization = Organization.objects.create(
            name='Test Org',
            owner=self.user
        )
        self.importer = GoogleFormsImporter(self.organization)

    def test_import_basic_form(self):
        """Test importing a basic Google Form"""
        gforms_data = {
            "info": {
                "title": "Test Google Form",
                "description": "A test form from Google Forms"
            },
            "items": [
                {
                    "id": "item1",
                    "type": 0,  # Short answer
                    "title": "What is your name?",
                    "required": True
                },
                {
                    "id": "item2", 
                    "type": 2,  # Multiple choice
                    "title": "Choose your favorite color",
                    "choices": [
                        {"value": "Red"},
                        {"value": "Blue"},
                        {"value": "Green"}
                    ]
                }
            ],
            "settings": {
                "submitText": "Submit",
                "confirmationMessage": "Thank you for your response"
            }
        }

        form, report = self.importer.import_form(gforms_data, self.user)

        self.assertEqual(form.title, "Test Google Form")
        self.assertEqual(form.description, "A test form from Google Forms")
        
        # Check blocks
        page = form.pages.first()
        blocks = page.blocks.all()
        
        self.assertEqual(blocks[0].data['type'], 'text')
        self.assertEqual(blocks[0].data['question'], 'What is your name?')
        self.assertEqual(blocks[0].data['required'], True)
        
        self.assertEqual(blocks[1].data['type'], 'single_select')
        self.assertEqual(len(blocks[1].data['options']), 3)

        # Check settings
        self.assertIn('settings', form.data)
        self.assertEqual(form.data['settings']['submitText'], 'Submit')

    def test_import_with_sections(self):
        """Test importing form with page breaks/sections"""
        gforms_data = {
            "info": {"title": "Sectioned Form"},
            "items": [
                {
                    "type": 6,  # Page break
                    "title": "Personal Information"
                },
                {
                    "id": "item1",
                    "type": 0,
                    "title": "Name"
                },
                {
                    "type": 6,  # Another page break
                    "title": "Preferences"
                },
                {
                    "id": "item2",
                    "type": 0,
                    "title": "Favorite color"
                }
            ]
        }

        form, report = self.importer.import_form(gforms_data, self.user)
        
        self.assertEqual(form.pages.count(), 2)
        self.assertEqual(form.pages.first().title, "Personal Information")
        self.assertEqual(form.pages.last().title, "Preferences")

    def test_import_linear_scale(self):
        """Test importing linear scale questions"""
        gforms_data = {
            "info": {"title": "Scale Form"},
            "items": [
                {
                    "id": "item1",
                    "type": 5,  # Linear scale
                    "title": "Rate this product",
                    "scaleData": {
                        "low": 1,
                        "high": 10,
                        "lowLabel": "Poor",
                        "highLabel": "Excellent"
                    }
                }
            ]
        }

        form, report = self.importer.import_form(gforms_data, self.user)
        
        block = form.pages.first().blocks.first()
        self.assertEqual(block.data['type'], 'scale')
        self.assertEqual(block.data['properties']['min'], 1)
        self.assertEqual(block.data['properties']['max'], 10)
        self.assertEqual(block.data['properties']['min_label'], 'Poor')
        self.assertEqual(block.data['properties']['max_label'], 'Excellent')

    def test_import_with_validation(self):
        """Test importing text fields with validation"""
        gforms_data = {
            "info": {"title": "Validation Form"},
            "items": [
                {
                    "id": "item1",
                    "type": 0,  # Short text
                    "title": "Enter your email",
                    "textValidation": {
                        "type": "EMAIL",
                        "minLength": 5,
                        "maxLength": 100
                    }
                }
            ]
        }

        form, report = self.importer.import_form(gforms_data, self.user)
        
        block = form.pages.first().blocks.first()
        self.assertEqual(block.data['type'], 'email')
        self.assertEqual(len(block.data['validation']), 2)

    def test_parse_google_forms_url(self):
        """Test URL parsing for Google Forms"""
        url1 = "https://forms.google.com/d/abc123/edit"
        url2 = "https://docs.google.com/forms/d/xyz789/viewform"
        
        self.assertEqual(GoogleFormsImporter.parse_google_forms_url(url1), "abc123")
        self.assertEqual(GoogleFormsImporter.parse_google_forms_url(url2), "xyz789")
        self.assertIsNone(GoogleFormsImporter.parse_google_forms_url("invalid-url"))