from flask import Flask
from flask_cors import CORS
import os

def create_app(config_name='default'):
    """Flask 애플리케이션 팩토리"""
    app = Flask(__name__)
    
    # 기본 설정
    app.config['SECRET_KEY'] = 'dev-secret-key'
    
    # CORS 설정 (프론트엔드와의 통신을 위해)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # 블루프린트 등록
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
