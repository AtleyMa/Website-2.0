# Database configuration and connection management
import mariadb
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='config.env')

# Connection parameters
DB_CONFIG = {
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASSWORD'),
    "host": os.getenv('DB_HOST'),
    "database": os.getenv('DB_NAME')
}


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    connection = None
    try:
        connection = mariadb.connect(**DB_CONFIG)
        yield connection
    finally:
        if connection:
            connection.close()


@contextmanager
def get_db_cursor():
    """Context manager for database cursor with auto-commit"""
    with get_db_connection() as connection:
        cursor = connection.cursor(dictionary=True)
        try:
            yield cursor
            connection.commit()
        except Exception as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()


class Database:
    """Database helper class for common operations"""
    
    @staticmethod
    def execute_query(query, params=None, fetch_one=False):
        """Execute a SELECT query and return results"""
        with get_db_cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch_one:
                return cursor.fetchone()
            return cursor.fetchall()
    
    @staticmethod
    def execute_insert(query, params=None):
        """Execute an INSERT query and return the last inserted ID"""
        with get_db_cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.lastrowid
    
    @staticmethod
    def execute_update(query, params=None):
        """Execute an UPDATE query and return affected rows"""
        with get_db_cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.rowcount
