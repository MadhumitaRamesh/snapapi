import sqlite3
from datetime import datetime
from flask import Flask, request, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mock_endpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            response_text TEXT NOT NULL,
            status_code INTEGER DEFAULT 200,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # Seed default admin account
    cursor.execute('SELECT id FROM users WHERE email = ?', ('admin@snapapi.com',))
    if not cursor.fetchone():
        admin_password = generate_password_hash('admin123', method='pbkdf2:sha256')
        created_at = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', ('System Admin', 'admin@snapapi.com', admin_password, 'admin', created_at))
    
    conn.commit()
    conn.close()

init_db()

# --- Auth Routes ---
@app.route('/api/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    
    if not name or not email or not password:
        return 'Missing fields', 400
        
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return 'Email already exists', 400
        
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    role = 'admin' if email == 'admin@snapapi.com' else 'user'
    created_at = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, email, password_hash, role, created_at))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return f"{user_id}::{role}::{name}::{email}::{created_at}", 201

@app.route('/api/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user[3], password):
        return f"{user[0]}::{user[1]}::{user[2]}::{user[4]}::{user[5]}", 200
        
    return 'Invalid email or password', 401

# --- Profile Routes ---
@app.route('/api/profile-stats', methods=['GET'])
def profile_stats():
    user_id = request.args.get('user_id')
    if not user_id:
        return 'user_id required', 400
        
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM mock_endpoints WHERE user_id = ?', (user_id,))
    count = cursor.fetchone()[0]
    
    cursor.execute('SELECT created_at, role, name, email FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return f"{count}::{user[0]}::{user[1]}", 200
    return f"{count}::none::user", 200

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user_id = request.form.get('user_id')
    name = request.form.get('name')
    
    if not user_id or not name:
        return 'Missing fields', 400
        
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET name = ? WHERE id = ?', (name, user_id))
    conn.commit()
    conn.close()
    
    return "Profile updated successfully", 200

@app.route('/api/change-password', methods=['POST'])
def change_password():
    user_id = request.form.get('user_id')
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    if not user_id or not current_password or not new_password or not confirm_password:
        return 'Missing fields', 400

    if new_password != confirm_password:
        return 'New passwords do not match', 400

    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT password_hash FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user or not check_password_hash(user[0], current_password):
        conn.close()
        return 'Current password is incorrect', 400

    new_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, user_id))
    conn.commit()
    conn.close()

    return 'Password updated successfully', 200

@app.route('/api/export-endpoints/<user_id>', methods=['GET'])
def export_endpoints(user_id):
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT title, status_code, id, created_at FROM mock_endpoints WHERE user_id = ?', (user_id,))
    endpoints = cursor.fetchall()
    conn.close()

    text = "SnapAPI - My Endpoints\n"
    text += "------------------------\n\n"

    for ep in endpoints:
        text += f"Title: {ep[0]}\n"
        text += f"Status Code: {ep[1]}\n"
        text += f"URL: http://127.0.0.1:5001/mock/{ep[2]}\n"
        text += f"Created: {ep[3]}\n\n"

    return Response(
        text, 
        mimetype="text/plain", 
        headers={"Content-Disposition": "attachment; filename=my-endpoints.txt"}
    )

@app.route('/api/delete-account', methods=['POST'])
def delete_account():
    user_id = request.form.get('user_id')
    if not user_id:
        return 'Missing fields', 400

    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM mock_endpoints WHERE user_id = ?', (user_id,))
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    return 'Account deleted successfully', 200

# --- Endpoint Management Routes ---
@app.route('/api/endpoints', methods=['POST'])
def create_endpoint():
    user_id = request.form.get('user_id')
    title = request.form.get('title')
    response_text = request.form.get('response_text')
    status_code = request.form.get('status_code')
    
    if not user_id or not title or not response_text:
        return 'Missing required fields', 400
        
    created_at = datetime.now().isoformat()
    
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO mock_endpoints (user_id, title, response_text, status_code, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, title, response_text, status_code, created_at))
    
    endpoint_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return str(endpoint_id), 201

@app.route('/api/endpoints', methods=['GET'])
def get_user_endpoints():
    user_id = request.args.get('user_id')
    if not user_id:
        return 'User ID is required', 400
        
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, status_code, created_at 
        FROM mock_endpoints 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ''', (user_id,))
    endpoints = cursor.fetchall()
    conn.close()
    
    result = ""
    for ep in endpoints:
        result += f"{ep[0]}::{ep[1]}::{ep[2]}::{ep[3]}\n"
    return result, 200

@app.route('/api/endpoints/<endpoint_id>', methods=['GET'])
def get_single_endpoint(endpoint_id):
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, user_id, title, response_text, status_code, created_at FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    ep = cursor.fetchone()
    conn.close()
    
    if not ep:
        return 'Endpoint not found', 404
        
    return f"{ep[0]}::{ep[1]}::{ep[2]}::{ep[3]}::{ep[4]}::{ep[5]}", 200

@app.route('/api/endpoints/<endpoint_id>', methods=['PUT'])
def update_endpoint(endpoint_id):
    title = request.form.get('title')
    response_text = request.form.get('response_text')
    status_code = request.form.get('status_code')
    
    if not title or not response_text:
        return 'Missing required fields', 400
        
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE mock_endpoints 
        SET title = ?, response_text = ?, status_code = ?
        WHERE id = ?
    ''', (title, response_text, status_code, endpoint_id))
    conn.commit()
    conn.close()
    
    return 'Endpoint updated successfully', 200

@app.route('/api/endpoints/<endpoint_id>', methods=['DELETE'])
def delete_endpoint(endpoint_id):
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    conn.commit()
    conn.close()
    
    return 'Endpoint deleted successfully', 200

# --- Admin Routes ---
@app.route('/api/admin/data', methods=['GET'])
def get_admin_data():
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, role FROM users ORDER BY name')
    users = cursor.fetchall()
    
    cursor.execute('SELECT id, user_id, title, status_code FROM mock_endpoints ORDER BY created_at DESC')
    endpoints = cursor.fetchall()
    conn.close()
    
    user_lines = ""
    for u in users:
        user_lines += f"{u[0]}::{u[1]}::{u[2]}::{u[3]}\n"
        
    endpoint_lines = ""
    for ep in endpoints:
        endpoint_lines += f"{ep[0]}::{ep[1]}::{ep[2]}::{ep[3]}\n"
        
    return f"USERS\n{user_lines}ENDPOINTS\n{endpoint_lines}", 200

# --- The Mock Serving Route ---
@app.route('/mock/<endpoint_id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def serve_mock(endpoint_id):
    conn = sqlite3.connect('snapapi.db')
    cursor = conn.cursor()
    cursor.execute('SELECT response_text, status_code FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    ep = cursor.fetchone()
    conn.close()
    
    if not ep:
        return 'Mock endpoint not found', 404
        
    return ep[0], ep[1], {"Content-Type": "text/plain"}

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
