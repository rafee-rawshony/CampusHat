import os

# Create dummy test files
with open("test.jpg", "wb") as f:
    f.write(b"\xFF\xD8\xFF\xDB\x00\x43\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01" + b"\x00" * 1024)  # ~1KB valid JPG

with open("test_large.jpg", "wb") as f:
    f.write(b"\xFF\xD8\xFF\xDB\x00\x43\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01" + b"\x00" * (6 * 1024 * 1024))  # 6MB valid JPG header

with open("test.php", "w") as f:
    f.write("<?php echo 'Test'; ?>")

from django.core.files.uploadedfile import SimpleUploadedFile
from core.validators import validate_image_file, validate_document_file
from django.core.exceptions import ValidationError

tests = [
    {"name": "1. 6MB JPEG Image", "file": "test_large.jpg", "func": validate_image_file, "expect_error": True, "error_text": "under 5MB"},
    {"name": "2. PHP script disguised as JPG", "file": "test.php", "func": validate_image_file, "expect_error": True, "error_text": "Invalid file type"},
    {"name": "3. Valid 1KB JPEG", "file": "test.jpg", "func": validate_image_file, "expect_error": False, "error_text": ""},
    {"name": "4. 6MB document in document field", "file": "test_large.jpg", "func": validate_document_file, "expect_error": False, "error_text": ""},
]

for t in tests:
    try:
        with open(t["file"], "rb") as f:
            uploaded = SimpleUploadedFile(name=t["file"], content=f.read(), content_type="image/jpeg")
            t["func"](uploaded)
            if t["expect_error"]:
                print(f"FAILED: {t['name']} should have raised ValidationError.")
            else:
                print(f"PASSED: {t['name']} correctly accepted.")
    except ValidationError as e:
        if t["expect_error"] and t["error_text"] in str(e):
            print(f"PASSED: {t['name']} rejected correctly with: {e}")
        elif t["expect_error"]:
            print(f"FAILED/UNEXPECTED ERROR: {t['name']} Error: {e}")
        else:
            print(f"FAILED: {t['name']} incorrectly raised error: {e}")

os.remove("test.jpg")
os.remove("test_large.jpg")
os.remove("test.php")
