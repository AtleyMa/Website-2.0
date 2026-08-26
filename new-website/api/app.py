# SodaKid API Backend
import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Load environment variables
load_dotenv(dotenv_path='config.env')

# Determine environment
IS_PRODUCTION = os.getenv('FLASK_ENV', 'development') == 'production'

if IS_PRODUCTION and os.getenv('SECRET_KEY', '') in ('', 'dev-secret-key'):
    raise RuntimeError('SECRET_KEY must be set to a strong value in production')


def create_app():
    """Application factory pattern for Flask app"""
    app = Flask(__name__)

    # Security Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY'))
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_COOKIE_SECURE'] = IS_PRODUCTION  # Only send cookies over HTTPS
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True

    # Session security
    app.config['SESSION_COOKIE_SECURE'] = IS_PRODUCTION
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

    # CORS - restrict origins in production
    allowed_origins = ['https://sodakid.ca', 'https://www.sodakid.ca']
    if not IS_PRODUCTION:
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

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        if IS_PRODUCTION:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    return app


app = create_app()

if __name__ == '__main__':
    # Start the daily SMS scheduler only in the serving process (not the
    # debug reloader's parent watcher) to avoid duplicate jobs.
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        from scheduler import init_scheduler
        init_scheduler()
    app.run(host='0.0.0.0', port=5000, debug=not IS_PRODUCTION)
