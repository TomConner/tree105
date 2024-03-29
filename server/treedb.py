from peewee import *
from peewee import SqliteDatabase
from pathlib import Path
from datetime import datetime
import logging
import random
from playhouse.shortcuts import model_to_dict

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

DB_FILE = Path('/tree105/db/tree105.sqlite')
database = SqliteDatabase(DB_FILE)

class TreeModel(Model):
    class Meta:
        database = database

class Lookup(TreeModel):
    code=CharField(max_length=4, unique=True)

class Address(TreeModel):
    lookup=ForeignKeyField(Lookup, backref='addresses')
    created=DateTimeField(default=datetime.now)
    city=CharField()
    country=CharField(null=True)
    line1=CharField()
    line2=CharField(null=True)
    postal_code=CharField(null=True)
    state=CharField(null=True)

    email=CharField()
    name=CharField()
    phone=CharField()

class Order(TreeModel):
    lookup=ForeignKeyField(Lookup, backref='orders')
    created=DateTimeField(default=datetime.now)
    comment=CharField()
    numtrees=IntegerField()
    extra=IntegerField()

class Intent(TreeModel):
    lookup=ForeignKeyField(Lookup, backref='orders')
    created=DateTimeField(default=datetime.now)
    method=CharField()

def random_code():
    alphabet='ABCDEFGHJKMNPQRTUVWXYZ'
    return ''.join([alphabet[random.randint(0,len(alphabet)-1)] for i in range(4)])

def new_lookup():
    for i in range(100):
        id = random_code()
        if not Lookup.select().where(Lookup.code==id).exists():
            code = id
            break
    Lookup.create(code=code)
    return code

def init_or_connect():
    print("db init_or_connect")
    if not DB_FILE.exists():
        print('initializing database')
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        database.connect()
        database.create_tables([Lookup, Order, Address])
        database.close()
    else:
        print('connecting to database')
        database.connect()
        database.create_tables([Intent], safe=True)
        database.close()
    print("db init_or_connect done")

def before_request():
    logger.debug('db_before_request')
    database.connect()

def teardown_request():
    if not database.is_closed():
        database.close()

def create_intent(lookup_code, method):
    logger.debug(f"create_intent: {lookup_code}, {method}")
    try:
        # Retrieve the Lookup instance by the provided code
        lookup, created = Lookup.get_or_create(code=lookup_code)

        # Create a new Intent and link it to the Lookup instance
        new_intent = Intent.create(
            lookup=lookup,
            method=method
        )
        logger.debug(f"Lookup: {lookup.id} (Created: {created}) ; Intent: {new_intent.id}")
        return model_to_dict(new_intent)

    except Exception as e:
        # Handle other potential exceptions
        print(f"Error creating intent: {e}")
        return None


def create_order(lookup_code, comment, numtrees, extra):
    logger.debug(f"create_order: {lookup_code}, {comment}, {numtrees}, {extra}")
    try:
        # Retrieve the Lookup instance by the provided code
        lookup, created = Lookup.get_or_create(code=lookup_code)

        # Create a new Order and link it to the Lookup instance
        new_order = Order.create(
            lookup=lookup,
            comment=comment,
            numtrees=numtrees,
            extra=extra
        )
        logger.debug(f"Lookup: {lookup.id} (Created: {created}) ; Order: {new_order.id}")
        return model_to_dict(new_order)

    except Exception as e:
        # Handle other potential exceptions
        print(f"Error creating order: {e}")
        return None


def create_address(lookup_code, city, country, line1, line2, postal_code, state, email, name, phone):
    try:
        # Retrieve the Lookup instance by the provided code
        lookup, created = Lookup.get_or_create(code=lookup_code)

        # Create a new Address and link it to the Lookup instance
        new_address = Address.create(
            lookup=lookup,
            city=city,
            country=country,
            line1=line1,
            line2=line2,
            postal_code=postal_code,
            state=state,
            email=email,
            name=name,
            phone=phone
        )

        logger.debug(f"Lookup: {lookup.id} (Created: {created}) ; Address: {new_address.id}")

        return model_to_dict(new_address)
    except Exception as e:
        # Handle other potential exceptions
        return f"Error creating address: {e}"
def get_last_address(lookup_code):
    try:
        last_address = (Address
                        .select()
                        .join(Lookup)
                        .where(Lookup.code == lookup_code)
                        .order_by(Address.created.desc())
                        .get())
        return model_to_dict(last_address)
    except Address.DoesNotExist:
        return None

def get_last_order(lookup_code):
    try:
        last_order = (Order
                      .select()
                      .join(Lookup)
                      .where(Lookup.code == lookup_code)
                      .order_by(Order.created.desc())
                      .get())
        return model_to_dict(last_order)
    except Order.DoesNotExist:
        return None
