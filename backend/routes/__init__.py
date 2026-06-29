from .antrian_routes import antrian_bp
from .auth_routes import auth_bp
from .dashboard_routes import dashboard_bp
from .jenis_pelayanan_routes import jenis_pelayanan_bp
from .laporan_routes import laporan_bp
from .pengunjung_routes import pengunjung_bp
from .user_routes import user_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(jenis_pelayanan_bp)
    app.register_blueprint(pengunjung_bp)
    app.register_blueprint(antrian_bp)
    app.register_blueprint(laporan_bp)
    app.register_blueprint(dashboard_bp)