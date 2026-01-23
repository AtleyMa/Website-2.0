# SodaKid API Backend
# Refactored Flask application with modern architecture

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import timedelta
import os

# Load environment variables
load_dotenv(dotenv_path='config.env')

def create_app():
    """Application factory pattern for Flask app"""
    app = Flask(__name__)
    
    # Security Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY'))
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_COOKIE_SECURE'] = True  # Only send cookies over HTTPS
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    
    # Session security
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    # Determine environment
    is_production = os.getenv('FLASK_ENV', 'development') == 'production'
    
    # CORS - restrict origins in production
    allowed_origins = ['https://sodakid.ca', 'https://www.sodakid.ca']
    if not is_production:
        allowed_origins.append('http://localhost:3000')
    
    CORS(app, origins=allowed_origins, supports_credentials=True)
    JWTManager(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.orders import orders_bp
    from routes.contact import contact_bp
    from routes.account import account_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(contact_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api/account')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'version': '2.0.0'}
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
