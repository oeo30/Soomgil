from app import db
from geoalchemy2 import Geometry
from datetime import datetime

class TreeCharacteristic(db.Model):
    """나무 특성 모델 (계절별)"""
    __tablename__ = 'tree_characteristics'
    
    id = db.Column(db.Integer, primary_key=True)
    tree_name = db.Column(db.String(100), nullable=False)
    diameter_breast_height = db.Column(db.Numeric(5, 2))
    spring_characteristic = db.Column(db.Boolean, default=False)
    summer_characteristic = db.Column(db.Boolean, default=False)
    autumn_characteristic = db.Column(db.Boolean, default=False)
    winter_characteristic = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NetworkNode(db.Model):
    """네트워크 노드 모델"""
    __tablename__ = 'network_nodes'
    
    id = db.Column(db.Integer, primary_key=True)
    node_id = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(Geometry('POINT', srid=4326), nullable=False)
    latitude = db.Column(db.Numeric(10, 8))
    longitude = db.Column(db.Numeric(11, 8))
    node_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NetworkEdge(db.Model):
    """네트워크 엣지 모델 (보행 경로)"""
    __tablename__ = 'network_edges'
    
    id = db.Column(db.Integer, primary_key=True)
    edge_id = db.Column(db.String(50), unique=True, nullable=False)
    start_node_id = db.Column(db.String(50))
    end_node_id = db.Column(db.String(50))
    geometry = db.Column(Geometry('LINESTRING', srid=4326), nullable=False)
    length = db.Column(db.Numeric(10, 2))
    highway_type = db.Column(db.String(50))
    name = db.Column(db.String(200))
    tree_weight = db.Column(db.Numeric(10, 2))
    park_tree_weight = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class GeographicArea(db.Model):
    """지리적 영역 모델"""
    __tablename__ = 'geographic_areas'
    
    id = db.Column(db.Integer, primary_key=True)
    area_name = db.Column(db.String(100), nullable=False)
    area_type = db.Column(db.String(50), nullable=False)
    geometry = db.Column(Geometry('POLYGON', srid=4326), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class RecommendedRoute(db.Model):
    """추천 경로 모델"""
    __tablename__ = 'recommended_routes'
    
    id = db.Column(db.Integer, primary_key=True)
    route_name = db.Column(db.String(200))
    total_length = db.Column(db.Numeric(10, 2))
    estimated_duration = db.Column(db.Integer)
    difficulty_level = db.Column(db.String(20))
    route_geometry = db.Column(Geometry('LINESTRING', srid=4326))
    tree_count = db.Column(db.Integer)
    park_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
