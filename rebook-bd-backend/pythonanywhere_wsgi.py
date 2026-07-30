import sys
import os

path = '/home/mbsupto/rebook-bd/rebook-bd-backend'
if path not in sys.path:
    sys.path.insert(0, path)

# ── MySQL connection (PythonAnywhere internal — no TCP block) ─────────────────
# Format: mysql+pymysql://PA_USERNAME:MYSQL_PASSWORD@PA_USERNAME.mysql.pythonanywhere-services.com/PA_USERNAME$rebook_bd
os.environ.setdefault(
    'DATABASE_URL',
    'mysql+pymysql://mbsupto:YOUR_MYSQL_PASSWORD@mbsupto.mysql.pythonanywhere-services.com/mbsupto$rebook_bd'
)
os.environ.setdefault('SECRET_KEY', 'replace-with-a-long-random-string')

from app import create_app
application = create_app()
