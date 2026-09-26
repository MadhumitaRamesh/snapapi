import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

DATABASE = 'snapapi.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mock_endpoints (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                json_payload TEXT NOT NULL,
                status_code INTEGER DEFAULT 200,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        
        # Seed default admin account
        cursor.execute('SELECT id FROM users WHERE email = ?', ('admin@snapapi.com',))
        if not cursor.fetchone():
            admin_id = str(uuid.uuid4())
            admin_password = generate_password_hash('admin123', method='pbkdf2:sha256')
            created_at = datetime.now().isoformat()
            cursor.execute('''
                INSERT INTO users (id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (admin_id, 'System Admin', 'admin@snapapi.com', admin_password, 'admin', created_at))
        
        db.commit()

# --- Auth Routes ---
# Register a new user
@app.route('/api/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    
    if not name or not email or not password:
        return 'Missing fields', 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        return 'Email already exists', 400
        
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    role = 'admin' if email == 'admin@snapapi.com' else 'user'
    created_at = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, name, email, password_hash, role, created_at))
    db.commit()
    
    # Returning a dict is automatically converted to JSON by Flask
    return {"message": "User registered successfully", "id": user_id, "role": role, "name": name, "email": email, "created_at": created_at}, 201

# Log in an existing user
@app.route('/api/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    
    if not email or not password:
        return 'Missing fields', 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        return {
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role'],
                "created_at": user['created_at']
            }
        }, 200
        
    return 'Invalid email or password', 401

# --- Profile Routes ---
# Get stats for a user's profile
@app.route('/api/profile-stats', methods=['GET'])
def profile_stats():
    user_id = request.args.get('user_id')
    if not user_id:
        return 'user_id required', 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM mock_endpoints WHERE user_id = ?', (user_id,))
    count_row = cursor.fetchone()
    
    cursor.execute('SELECT created_at, role, name, email FROM users WHERE id = ?', (user_id,))
    user_row = cursor.fetchone()
    
    return {
        "count": count_row['count'],
        "created_at": user_row['created_at'] if user_row else None,
        "role": user_row['role'] if user_row else 'user'
    }, 200

# Update a user's profile (name only)
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user_id = request.form.get('user_id')
    name = request.form.get('name')
    
    if not user_id or not name:
        return 'Missing fields', 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE users SET name = ? WHERE id = ?', (name, user_id))
    db.commit()
    
    return {"message": "Profile updated successfully"}, 200

# --- Endpoint Management Routes ---
# Create a new mock endpoint
@app.route('/api/endpoints', methods=['POST'])
def create_endpoint():
    db = get_db()
    cursor = db.cursor()
    
    user_id = request.form.get('user_id')
    title = request.form.get('title')
    json_payload = request.form.get('json_payload')
    status_code = request.form.get('status_code', 200)
    
    if not user_id or not title or not json_payload:
        return 'Missing fields', 400
        
    endpoint_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO mock_endpoints (id, user_id, title, json_payload, status_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (endpoint_id, user_id, title, json_payload, status_code, created_at))
    db.commit()
    
    return {"message": "Endpoint created", "id": endpoint_id}, 201

# Get all endpoints for a specific user
@app.route('/api/endpoints', methods=['GET'])
def get_user_endpoints():
    db = get_db()
    cursor = db.cursor()
    
    user_id = request.args.get('user_id')
    if not user_id:
        return 'user_id required', 400
        
    cursor.execute('SELECT * FROM mock_endpoints WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    rows = cursor.fetchall()
    endpoints = [dict(row) for row in rows]
    return endpoints, 200

# Get details of a single endpoint
@app.route('/api/endpoints/<endpoint_id>', methods=['GET'])
def get_single_endpoint(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    row = cursor.fetchone()
    if not row:
        return 'Endpoint not found', 404
    return dict(row), 200

# Update an existing endpoint
@app.route('/api/endpoints/<endpoint_id>', methods=['PUT'])
def update_endpoint(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    title = request.form.get('title')
    json_payload = request.form.get('json_payload')
    status_code = request.form.get('status_code', 200)
    
    if not title or not json_payload:
        return 'Missing fields', 400
        
    cursor.execute('''
        UPDATE mock_endpoints 
        SET title = ?, json_payload = ?, status_code = ? 
        WHERE id = ?
    ''', (title, json_payload, status_code, endpoint_id))
    db.commit()
    return {"message": "Endpoint updated"}, 200

# Delete an endpoint
@app.route('/api/endpoints/<endpoint_id>', methods=['DELETE'])
def delete_endpoint(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('DELETE FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    db.commit()
    return {"message": "Endpoint deleted"}, 200

# --- Admin Routes ---
# Get all users and endpoints for the admin panel
@app.route('/api/admin/data', methods=['GET'])
def admin_data():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id, name, email, role FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('SELECT e.*, u.email as user_email FROM mock_endpoints e JOIN users u ON e.user_id = u.id')
    endpoints = [dict(row) for row in cursor.fetchall()]
    
    return {"users": users, "endpoints": endpoints}, 200

# --- The Mock Serving Route ---
# Serve the custom JSON payload for an endpoint regardless of HTTP method
@app.route('/mock/<endpoint_id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def serve_mock(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT json_payload, status_code FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    endpoint = cursor.fetchone()
    
    if not endpoint:
        return 'Mock endpoint not found', 404
        
    # Return the stored text exactly as it is, but tell the browser it's JSON
    return endpoint['json_payload'], endpoint['status_code'], {"Content-Type": "application/json"}

if __name__ == '__main__':
    init_db()
    print("Database initialized!")
    app.run(debug=True, port=5001, host='0.0.0.0')
