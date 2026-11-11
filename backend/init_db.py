import os
import psycopg2

DB_CONFIG = {
    'dbname': 'smartevent',
    'user': 'postgres',
    'host': '127.0.0.1',
    'port': 5433
}

def init_database():
    print("Connecting to PostgreSQL database 'smartevent' on port 5433...")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sql_files = [
        os.path.join(base_dir, 'sql', '01_schema.sql'),
        os.path.join(base_dir, 'sql', '02_procedures.sql'),
        os.path.join(base_dir, 'sql', '03_seed_data.sql')
    ]

    for full_path in sql_files:
        print(f"Executing DDL/DML script: {full_path}")
        with open(full_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        cur.execute(sql_content)
        print(f"Successfully applied {full_path}")

    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
    tables = [row[0] for row in cur.fetchall()]
    print(f"\n[SUCCESS] Total Deployed Base Tables ({len(tables)}): {sorted(tables)}")

    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='VIEW';")
    views = [row[0] for row in cur.fetchall()]
    print(f"[SUCCESS] Total Deployed Views ({len(views)}): {sorted(views)}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    init_database()
