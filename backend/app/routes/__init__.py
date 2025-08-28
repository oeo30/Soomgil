from flask import Blueprint

# API 블루프린트 생성
api_bp = Blueprint('api', __name__)

# 라우트 모듈들 import
from . import routes
