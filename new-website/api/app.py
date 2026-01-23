# SodaKid API Backend
# Refactored Flask application with modern architecture

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(dotenv_path='config.env')

def create_app():
    """Application factory pattern for Flask app"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY'))
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
    
    # Initialize extensions
    CORS(app, origins=['http://localhost:3000', 'https://sodakid.ca'], supports_credentials=True)
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
