import urllib.request
import urllib.parse
import time

BASE_URL = "http://127.0.0.1:5001/api"
MOCK_URL = "http://127.0.0.1:5001/mock"

def req(url, data=None, method='GET'):
    if data:
        data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

# Register a user to be deleted
status, text = req(f"{BASE_URL}/register", {"name": "Delete Me", "email": "deleteme@example.com", "password": "pw"}, 'POST')
user_id = text.split("::")[0]
req(f"{BASE_URL}/endpoints", {"user_id": user_id, "title": "EP", "response_text": "resp", "status_code": 200}, 'POST')

# Login as admin to delete them
req(f"{BASE_URL}/login", {"email": "admin@snapapi.com", "password": "admin123"}, 'POST')

# Admin deletes user via delete-account route
status, text = req(f"{BASE_URL}/delete-account", {"user_id": user_id}, 'POST')
if status == 200:
    print("PASS: Admin deleted user successfully")
else:
    print("FAIL: Admin delete user", text)

# Verify user is gone from admin data
status, text = req(f"{BASE_URL}/admin/data")
if "deleteme@example.com" not in text:
    print("PASS: User is missing from admin data")
else:
    print("FAIL: User still in admin data")

