import os
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from skill_extractor import process_resume, ROLE_SKILLS_MAP

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-super-secret-key")
app.config['SECRET_KEY'] = SECRET_KEY

# Configure SQLite Database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'analyzer_v2.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AnalysisHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # None for guests
    role = db.Column(db.String(100), nullable=False)
    match_percentage = db.Column(db.Integer, nullable=False)
    matched_skills = db.Column(db.Text, nullable=False) # stored as json
    missing_skills = db.Column(db.Text, nullable=False) # stored as json
    recommendations = db.Column(db.Text, nullable=True) # stored as json
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Ensure DB is created
with app.app_context():
    db.create_all()

# Auth Middleware
def bg_check_token(token):
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user = User.query.filter_by(id=data['user_id']).first()
        return user
    except:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
            
        user = bg_check_token(token)
        if not user:
            return jsonify({'error': 'Token is invalid or expired!'}), 401
            
        return f(user, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    hashed_password = generate_password_hash(data.get('password'))
    new_user = User(
        username=data.get('username'), 
        email=data.get('email'), 
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Auto login after register
    token = jwt.encode({
        'user_id': new_user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'message': 'Registered successfully',
        'token': token,
        'user': {'id': new_user.id, 'username': new_user.username, 'email': new_user.email}
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    }), 200

@app.route('/api/user/profile', methods=['GET'])
@token_required
def profile(current_user):
    histories = AnalysisHistory.query.filter_by(user_id=current_user.id).order_by(AnalysisHistory.created_at.desc()).all()
    history_data = []
    for h in histories:
        history_data.append({
            "id": h.id,
            "role": h.role,
            "match_percentage": h.match_percentage,
            "created_at": h.created_at.strftime('%Y-%m-%d %H:%M'),
            "matched_count": len(json.loads(h.matched_skills)) if h.matched_skills else 0,
            "missing_count": len(json.loads(h.missing_skills)) if h.missing_skills else 0
        })
        
    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'created_at': current_user.created_at.strftime('%Y-%m-%d')
        },
        'history': history_data
    })

@app.route('/api/upload', methods=['POST'])
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    role = request.form.get('role', '')

    if not role:
        return jsonify({"error": "No target role provided"}), 400

    # Optional Auth check to associate with user
    user = None
    if 'Authorization' in request.headers:
        parts = request.headers['Authorization'].split()
        if len(parts) == 2 and parts[0] == 'Bearer':
            user = bg_check_token(parts[1])

    try:
        results = process_resume(file, role)
        
        # Save to Database
        new_analysis = AnalysisHistory(
            user_id=user.id if user else None,
            role=role,
            match_percentage=results.get('match_percentage', 0),
            matched_skills=json.dumps(results.get('matched_skills', [])),
            missing_skills=json.dumps(results.get('missing_skills', [])),
            recommendations=json.dumps(results.get('recommendations', []))
        )
        db.session.add(new_analysis)
        db.session.commit()
        
        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/roles', methods=['GET'])
def get_roles():
    return jsonify({"roles": list(ROLE_SKILLS_MAP.keys())})

@app.route('/api/history', methods=['GET'])
def get_history():
    user = None
    if 'Authorization' in request.headers:
        parts = request.headers['Authorization'].split()
        if len(parts) == 2 and parts[0] == 'Bearer':
            user = bg_check_token(parts[1])
            
    try:
        if user:
            histories = AnalysisHistory.query.filter_by(user_id=user.id).order_by(AnalysisHistory.created_at.desc()).limit(10).all()
        else:
            histories = []
            
        data = []
        for h in histories:
            data.append({
                "id": h.id,
                "role": h.role,
                "match_percentage": h.match_percentage,
                "created_at": h.created_at.strftime('%Y-%m-%d %H:%M'),
                "matched_count": len(json.loads(h.matched_skills)) if h.matched_skills else 0,
                "missing_count": len(json.loads(h.missing_skills)) if h.missing_skills else 0
            })
        return jsonify({"history": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
