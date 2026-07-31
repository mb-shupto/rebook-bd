from flask_bcrypt import Bcrypt  # type: ignore
from flask_migrate import Migrate  # type: ignore
from flask_sqlalchemy import SQLAlchemy  # type: ignore

db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
