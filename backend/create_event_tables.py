import mysql.connector
from config import Config

def create_tables():
    c = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT
    )
    cur = c.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS organizers (
        organizer_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        organization_name VARCHAR(150) NOT NULL,
        contact_email VARCHAR(150) NOT NULL,
        phone VARCHAR(30),
        verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS event_categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(80) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'Calendar'
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS venues (
        venue_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(80) NOT NULL,
        total_capacity INT NOT NULL,
        gate_info JSON,
        map_url TEXT
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT,
        category_id INT,
        venue_id INT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        banner_url TEXT,
        status VARCHAR(20) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES event_categories(category_id),
        FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
    )
    """)
    
    # Insert some default categories and venues so we can select them
    cur.execute("INSERT IGNORE INTO event_categories (name) VALUES ('Concerts'), ('Sports'), ('Movies'), ('Technology'), ('Workshops'), ('Comedy'), ('College Events')")
    cur.execute("INSERT IGNORE INTO venues (name, address, city, total_capacity) VALUES ('Main Auditorium', '123 Tech Park', 'Chennai', 500), ('Open Ground', '456 Stadium Road', 'Chennai', 2000)")
    
    c.commit()
    print('Event tables created')

if __name__ == '__main__':
    create_tables()
