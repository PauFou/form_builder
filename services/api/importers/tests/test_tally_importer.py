import pytest
from unittest.mock import Mock, patch

from importers.tally import TallyImporter
from importers.base import ImportStatus


class TestTallyImporter:
    """Test suite for Tally form importer"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.importer = TallyImporter()
    
    def test_extract_form_id_from_url(self):
        """Test extracting form ID from various Tally URL formats"""
        # Test standard URLs
        assert self.importer._extract_form_id("https://tally.so/r/ABC123") == "ABC123"
        assert self.importer._extract_form_id("https://tally.so/embed/XYZ789") == "XYZ789"
        assert self.importer._extract_form_id("https://ABC123.tally.so") == "abc123"  # URLs are lowercase
        assert self.importer._extract_form_id("https://myform.tally.so") == "myform"
        
        # Test direct ID
        assert self.importer._extract_form_id("FORM123") == "FORM123"
        
        # Test invalid URLs
        with pytest.raises(ValueError):
            self.importer._extract_form_id("https://invalid.com/form")
        
        with pytest.raises(ValueError):
            self.importer._extract_form_id("https://tally.so")
    
    @patch('requests.get')
    def test_fetch_form_data_success(self, mock_get):
        """Test successful form data fetching"""
        # Mock responses
        form_response = Mock()
        form_response.status_code = 200
        form_response.json.return_value = {
            "id": "ABC123",
            "name": "Test Form",
            "description": "Test Description",
            "url": "https://tally.so/r/ABC123"
        }
        
        fields_response = Mock()
        fields_response.status_code = 200
        fields_response.json.return_value = {
            "data": [
                {"id": "field1", "type": "INPUT_TEXT", "label": "Name"},
                {"id": "field2", "type": "INPUT_EMAIL", "label": "Email"}
            ]
        }
        
        mock_get.side_effect = [form_response, fields_response]
        
        result = self.importer.fetch_form_data("ABC123", {"api_key": "test-key"})
        
        assert result["id"] == "ABC123"
        assert result["name"] == "Test Form"
        assert len(result["fields"]) == 2
    
    @patch('requests.get')
    def test_fetch_form_data_missing_api_key(self, mock_get):
        """Test fetching without API key"""
        with pytest.raises(ValueError, match="Tally API key is required"):
            self.importer.fetch_form_data("ABC123", {})
    
    @patch('requests.get')
    def test_fetch_form_data_invalid_key(self, mock_get):
        """Test fetching with invalid API key"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response
        
        with pytest.raises(ValueError, match="Invalid API key"):
            self.importer.fetch_form_data("ABC123", {"api_key": "invalid"})
    
    def test_transform_field_types(self):
        """Test field type transformations"""
        # Test basic text fields
        assert self.importer.map_field_type("INPUT_TEXT") == ("text", None)
        assert self.importer.map_field_type("INPUT_EMAIL") == ("email", None)
        assert self.importer.map_field_type("INPUT_NUMBER") == ("number", None)
        assert self.importer.map_field_type("TEXTAREA") == ("long_text", None)
        
        # Test choice fields
        assert self.importer.map_field_type("MULTIPLE_CHOICE") == ("single_select", None)
        assert self.importer.map_field_type("CHECKBOXES") == ("multi_select", None)
        assert self.importer.map_field_type("DROPDOWN") == ("dropdown", None)
        
        # Test special fields
        assert self.importer.map_field_type("FILE_UPLOAD") == ("file_upload", None)
        assert self.importer.map_field_type("PAYMENT") == ("payment", None)
        assert self.importer.map_field_type("SIGNATURE") == ("signature", None)
        assert self.importer.map_field_type("NPS") == ("nps", None)
        
        # Test unsupported field
        field_type, notes = self.importer.map_field_type("UNKNOWN_FIELD")
        assert field_type == "text"
        assert notes is not None
    
    def test_transform_to_internal_format(self):
        """Test complete form transformation"""
        source_data = {
            "id": "ABC123",
            "name": "Customer Feedback",
            "description": "Tell us what you think",
            "url": "https://tally.so/r/ABC123",
            "settings": {
                "showProgressBar": True,
                "language": "en",
                "redirectUrl": "https://example.com/thanks"
            },
            "customization": {
                "primaryColor": "#FF0000",
                "fontFamily": "Arial"
            },
            "fields": [
                {
                    "id": "field1",
                    "type": "INPUT_TEXT",
                    "label": "Your Name",
                    "required": True
                },
                {
                    "id": "field2",
                    "type": "MULTIPLE_CHOICE",
                    "label": "How satisfied are you?",
                    "options": {
                        "choices": [
                            {"text": "Very satisfied"},
                            {"text": "Satisfied"},
                            {"text": "Neutral"},
                            {"text": "Dissatisfied"}
                        ]
                    }
                }
            ]
        }
        
        result = self.importer.transform_to_internal_format(source_data)
        
        assert result["title"] == "Customer Feedback"
        assert result["description"] == "Tell us what you think"
        assert result["settings"]["show_progress_bar"]
        assert result["settings"]["redirect_after_submit_url"] == "https://example.com/thanks"
        assert result["theme"]["primary_color"] == "#FF0000"
        assert result["theme"]["font_family"] == "Arial"
        
        # Check pages
        assert len(result["pages"]) == 1
        assert len(result["pages"][0]["blocks"]) == 2
        
        # Check first block
        block1 = result["pages"][0]["blocks"][0]
        assert block1["type"] == "text"
        assert block1["question"] == "Your Name"
        assert block1["required"]
        
        # Check second block
        block2 = result["pages"][0]["blocks"][1]
        assert block2["type"] == "single_select"
        assert block2["question"] == "How satisfied are you?"
        assert len(block2["options"]) == 4
    
    def test_transform_page_breaks(self):
        """Test handling of page breaks"""
        fields = [
            {"id": "1", "type": "INPUT_TEXT", "label": "Name"},
            {"id": "2", "type": "PAGE_BREAK", "label": "Page 2"},
            {"id": "3", "type": "INPUT_EMAIL", "label": "Email"},
            {"id": "4", "type": "PAGE_BREAK", "label": "Page 3"},
            {"id": "5", "type": "TEXTAREA", "label": "Comments"}
        ]
        
        pages = self.importer._transform_fields_to_pages(fields)
        
        assert len(pages) == 3
        assert len(pages[0]["blocks"]) == 1
        assert len(pages[1]["blocks"]) == 1
        assert len(pages[2]["blocks"]) == 1
        assert pages[0]["blocks"][0]["question"] == "Name"
        assert pages[1]["blocks"][0]["question"] == "Email"
        assert pages[2]["blocks"][0]["question"] == "Comments"
    
    def test_transform_payment_field(self):
        """Test payment field transformation"""
        field = {
            "id": "payment1",
            "type": "PAYMENT",
            "label": "Purchase Product",
            "options": {
                "payment": {
                    "amount": 2999,
                    "currency": "USD",
                    "type": "one_time",
                    "products": [
                        {
                            "id": "prod1",
                            "name": "Premium Plan",
                            "price": 2999,
                            "description": "Full access"
                        }
                    ]
                }
            }
        }
        
        block = self.importer._transform_field_to_block(field)
        
        assert block["type"] == "payment"
        assert block["amount"] == 2999
        assert block["currency"] == "USD"
        assert block["payment_type"] == "one_time"
        assert len(block["products"]) == 1
        assert block["products"][0]["name"] == "Premium Plan"
    
    def test_transform_matrix_field(self):
        """Test matrix field transformation"""
        field = {
            "id": "matrix1",
            "type": "MATRIX",
            "label": "Rate our services",
            "options": {
                "rows": ["Service A", "Service B", "Service C"],
                "columns": ["Excellent", "Good", "Fair", "Poor"],
                "multipleSelection": False
            }
        }
        
        block = self.importer._transform_field_to_block(field)
        
        assert block["type"] == "matrix"
        assert len(block["rows"]) == 3
        assert len(block["columns"]) == 4
        assert not block["multiple_selection"]
    
    def test_transform_conditional_logic(self):
        """Test conditional logic transformation"""
        logic_rules = [
            {
                "conditions": [
                    {
                        "fieldId": "field1",
                        "operator": "EQUALS",
                        "value": "Yes"
                    }
                ],
                "actions": [
                    {
                        "type": "SHOW_FIELD",
                        "fieldId": "field2"
                    }
                ],
                "operator": "AND"
            }
        ]
        
        result = self.importer._transform_logic(logic_rules)
        
        assert len(result["rules"]) == 1
        rule = result["rules"][0]
        assert len(rule["conditions"]) == 1
        assert rule["conditions"][0]["field"] == "field1"
        assert rule["conditions"][0]["operator"] == "equals"
        assert rule["action"]["type"] == "show_field"
        assert rule["action"]["target"] == "field2"
    
    def test_transform_validation(self):
        """Test field validation transformation"""
        field = {
            "id": "field1",
            "type": "INPUT_TEXT",
            "label": "Name",
            "validation": {
                "minLength": 3,
                "maxLength": 50,
                "pattern": "^[A-Za-z ]+$",
                "customError": "Please enter a valid name"
            }
        }
        
        block = self.importer._transform_field_to_block(field)
        
        assert len(block["validation"]) == 3
        
        # Check min length validation
        min_val = next(v for v in block["validation"] if v["type"] == "min_length")
        assert min_val["value"] == 3
        
        # Check max length validation
        max_val = next(v for v in block["validation"] if v["type"] == "max_length")
        assert max_val["value"] == 50
        
        # Check pattern validation
        pattern_val = next(v for v in block["validation"] if v["type"] == "pattern")
        assert pattern_val["value"] == "^[A-Za-z ]+$"
        
        assert block["error_message"] == "Please enter a valid name"
    
    @patch('requests.get')
    def test_import_form_complete_flow(self, mock_get):
        """Test complete import flow"""
        # Mock form response
        form_response = Mock()
        form_response.status_code = 200
        form_response.json.return_value = {
            "id": "ABC123",
            "name": "Test Form",
            "fields": []
        }
        
        fields_response = Mock()
        fields_response.status_code = 200
        fields_response.json.return_value = {
            "data": [
                {
                    "id": "field1",
                    "type": "INPUT_TEXT",
                    "label": "Name",
                    "required": True
                }
            ]
        }
        
        mock_get.side_effect = [form_response, fields_response]
        
        result = self.importer.import_form("ABC123", {"api_key": "test-key"})
        
        assert result.success
        assert result.status == ImportStatus.SUCCESS
        assert result.form_data["title"] == "Test Form"
        assert len(result.mapping_report["field_mappings"]) > 0
    
    def test_generate_parity_report(self):
        """Test parity report generation"""
        # Add some field mappings
        self.importer.create_field_mapping(
            source_type="INPUT_TEXT",
            source_id="field1", 
            target_type="text",
            target_id="field1"
        )
        
        self.importer.create_field_mapping(
            source_type="UNKNOWN_TYPE",
            source_id="field2",
            target_type="text",
            target_id="field2",
            notes="Field type not directly supported, mapped to text"
        )
        
        report = self.importer.generate_parity_report()
        
        assert report["total_fields"] == 2
        assert report["supported_fields"] == 1
        assert report["partially_supported_fields"] == 1
        assert "platform_specific" in report
        assert "tally" in report["platform_specific"]
        
        # Check Tally-specific features
        tally_report = report["platform_specific"]["tally"]
        assert len(tally_report["features_preserved"]) > 0
        assert len(tally_report["features_requiring_adjustment"]) > 0
        assert len(tally_report["features_not_supported"]) > 0