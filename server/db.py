from peewee import *
from peewee import SqliteDatabase
from pathlib import Path
from datetime import datetime
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

DB_FILE = Path('/tree105/db/tree105.sqlite')
database = SqliteDatabase(DB_FILE)

class TreeModel(Model):
    class Meta:
        database = database

class Pickup(TreeModel):
    name=CharField()
    address1=CharField()
    address2=CharField()
    town=CharField()
    state=CharField()

class Order(TreeModel):
    pass

alphabet='ABCDEFGHJKMNPQRTUVWXYZ'
alen=len(alphabet)

def init_or_connect():
    print("db init_or_connect")
    if not DB_FILE.exists():
        print('initializing database')
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        database.connect()
        database.create_tables([Pickup, Order])
        database.close()
    else:
        print('connecting to database')
        database.connect()
        database.close()
    print("db init_or_connect done")

def before_request():
    logger.debug('db_before_request')
    database.connect()

def teardown_request():
    if not database.is_closed():
        database.close()

def get_pickups():
    return [p for p in Pickup.select()]