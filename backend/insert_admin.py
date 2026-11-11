import mysql.connector
from config import Config

c = mysql.connector.connect(
    host=Config.DB_HOST,
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME,
    port=Config.DB_PORT
)
cur = c.cursor()
cur.execute("INSERT IGNORE INTO users (full_name, email, password_hash, role) VALUES ('System Admin', 'admin@123', 'hash_sqlproject', 'admin')")
c.commit()
print('Admin inserted')
