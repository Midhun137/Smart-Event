import mysql.connector
from mysql.connector import errorcode
from config import Config

def get_db_connection():
    try:
        return mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            port=Config.DB_PORT,
            autocommit=True
        )
    except mysql.connector.Error as err:
        # If access denied with default password, try empty password as common local fallback
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR and Config.DB_PASSWORD != "":
            try:
                return mysql.connector.connect(
                    host=Config.DB_HOST,
                    user=Config.DB_USER,
                    password="",
                    database=Config.DB_NAME,
                    port=Config.DB_PORT,
                    autocommit=True
                )
            except Exception:
                pass
        raise err

def execute_query(query, params=None, fetchall=True, fetchone=False, commit=False):
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        result = None
        if fetchone:
            result = cur.fetchone()
        elif fetchall:
            result = cur.fetchall()
        if commit:
            conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if 'cur' in locals():
            cur.close()
        conn.close()
