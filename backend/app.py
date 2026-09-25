import sqlite3
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify, g
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
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            )
        ''')
        
        # Create mock_endpoints table
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
            cursor.execute('''
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            ''', (admin_id, 'System Admin', 'admin@snapapi.com', admin_password, 'admin'))
        
        db.commit()

# --- Auth Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"error": "Missing fields"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Check if email exists
    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email already exists"}), 400
        
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    # Check if this should be admin (first user could be admin, but let's just make 'admin@snapapi.com' an admin)
    role = 'admin' if email == 'admin@snapapi.com' else 'user'
    
    cursor.execute('''
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, name, email, password_hash, role))
    db.commit()
    
    return jsonify({"message": "User registered successfully", "id": user_id, "role": role}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401

# --- Endpoint Management Routes ---

@app.route('/api/endpoints', methods=['GET', 'POST'])
def manage_endpoints():
    db = get_db()
    cursor = db.cursor()
    
    if request.method == 'POST':
        data = request.json
        user_id = data.get('user_id')
        title = data.get('title')
        json_payload = data.get('json_payload')
        status_code = data.get('status_code', 200)
        
        if not user_id or not title or not json_payload:
            return jsonify({"error": "Missing fields"}), 400
            
        # Basic validation of JSON
        try:
            json.loads(json_payload)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format"}), 400
            
        endpoint_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO mock_endpoints (id, user_id, title, json_payload, status_code, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (endpoint_id, user_id, title, json_payload, status_code, created_at))
        db.commit()
        
        return jsonify({"message": "Endpoint created", "id": endpoint_id}), 201
        
    else:
        # GET request to list endpoints for a user
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id required"}), 400
            
        cursor.execute('SELECT * FROM mock_endpoints WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        rows = cursor.fetchall()
        endpoints = [dict(row) for row in rows]
        return jsonify(endpoints), 200

@app.route('/api/endpoints/<endpoint_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_single_endpoint(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT * FROM mock_endpoints WHERE id = ?', (endpoint_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Endpoint not found"}), 404
        return jsonify(dict(row)), 200
        
    elif request.method == 'PUT':
        data = request.json
        title = data.get('title')
        json_payload = data.get('json_payload')
        status_code = data.get('status_code', 200)
        
        if not title or not json_payload:
            return jsonify({"error": "Missing fields"}), 400
            
        try:
            json.loads(json_payload)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format"}), 400
            
        cursor.execute('''
            UPDATE mock_endpoints 
            SET title = ?, json_payload = ?, status_code = ? 
            WHERE id = ?
        ''', (title, json_payload, status_code, endpoint_id))
        db.commit()
        return jsonify({"message": "Endpoint updated"}), 200
        
    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM mock_endpoints WHERE id = ?', (endpoint_id,))
        db.commit()
        return jsonify({"message": "Endpoint deleted"}), 200

# --- Admin Routes ---

@app.route('/api/admin/data', methods=['GET'])
def admin_data():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id, name, email, role FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('SELECT e.*, u.email as user_email FROM mock_endpoints e JOIN users u ON e.user_id = u.id')
    endpoints = [dict(row) for row in cursor.fetchall()]
    
    return jsonify({"users": users, "endpoints": endpoints}), 200

# --- The Mock Serving Route ---

@app.route('/mock/<endpoint_id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def serve_mock(endpoint_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT json_payload, status_code FROM mock_endpoints WHERE id = ?', (endpoint_id,))
    endpoint = cursor.fetchone()
    
    if not endpoint:
        return jsonify({"error": "Mock endpoint not found"}), 404
        
    try:
        response_data = json.loads(endpoint['json_payload'])
    except:
        response_data = endpoint['json_payload']
        
    return jsonify(response_data), endpoint['status_code']

if __name__ == '__main__':
    init_db()
    print("Database initialized!")
    app.run(debug=True, port=5001, host='0.0.0.0')
