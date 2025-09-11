"""
Form importers for various platforms
"""

__all__ = ["TypeformImporter", "GoogleFormsImporter"]

# Lazy imports to avoid Django app registry issues
def __getattr__(name):
    if name == "TypeformImporter":
        from .typeform_importer import TypeformImporter
        return TypeformImporter
    elif name == "GoogleFormsImporter":
        from .google_forms_importer import GoogleFormsImporter
        return GoogleFormsImporter
    raise AttributeError(f"module {__name__} has no attribute {name}")