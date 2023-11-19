from peewee import *
from peewee import SqliteDatabase
from pathlib import Path
from datetime import datetime
import logging
import random

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

DB_FILE = Path('/tree105/db/tree105.sqlite')
database = SqliteDatabase(DB_FILE)

class TreeModel(Model):
    class Meta:
        database = database

class Pickup(TreeModel):
    lookup=CharField()

class Address(TreeModel):
    lookup=ForeignKeyField(Pickup, backref='address')
    name=CharField()
    address1=CharField()
    address2=CharField()
    town=CharField()
    state=CharField()

class Order(TreeModel):
    lookup=ForeignKeyField(Pickup, backref='Order')
    comment=CharField()
    trees=IntegerField()
    extra=IntegerField()

def random_id():
    alphabet='ABCDEFGHJKMNPQRTUVWXYZ'
    return ''.join([alphabet[random.randint(0,len(alphabet)-1)] for i in range(4)])

def new_lookup_id():
    for i in range(100):
        id = random_id()
        if not Pickup.select().where(Pickup.lookup==id).exists():
            return id
    raise Exception("Could not generate a unique id")

def init_or_connect():
    print("db init_or_connect")
    if not DB_FILE.exists():
        print('initializing database')
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        database.connect()
        database.create_tables([Pickup, Address, Order])
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
    logger.debug('get_pickups')
    return Pickup.select().dicts()

def get_pickup(lookup):
    logger.debug(f'get_pickup {lookup}')
    return Pickup.select().where(Pickup.lookup == lookup).dicts().get()

def create_pickup():
    logger.debug('create_pickup')
    lookup = new_lookup_id()
    Pickup.create(lookup=lookup)
    return lookup

def update_pickup(lookup):
    logger.debug(f'update_pickup {lookup}')
    Pickup.update(updated=datetime.now()).where(Pickup.lookup == lookup).execute()
    return lookup
