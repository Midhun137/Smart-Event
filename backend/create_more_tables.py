import mysql.connector
from config import Config

def create_more_tables():
    c = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT
    )
    cur = c.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS event_ticket_types (
        ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        name VARCHAR(50) NOT NULL,
        base_price DECIMAL(10,2) NOT NULL,
        total_quantity INT NOT NULL,
        available_quantity INT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS seats (
        seat_id INT AUTO_INCREMENT PRIMARY KEY,
        venue_id INT,
        section VARCHAR(50) NOT NULL,
        row_label VARCHAR(5) NOT NULL,
        seat_number INT NOT NULL,
        price_multiplier DECIMAL(3,2) DEFAULT 1.00,
        FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS event_seats (
        event_seat_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        seat_id INT,
        ticket_type_id INT,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'AVAILABLE',
        locked_until TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_type_id) REFERENCES event_ticket_types(ticket_type_id)
    )
    """)
    
    c.commit()
    print('More tables created')

if __name__ == '__main__':
    create_more_tables()
