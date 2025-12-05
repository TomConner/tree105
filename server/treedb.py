from peewee import ForeignKeyField, Model, CharField, DateTimeField, IntegerField, fn
from peewee import SqliteDatabase
from pathlib import Path
from datetime import datetime
import logging
import random
from playhouse.shortcuts import model_to_dict
import os
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
TREE_DB = os.environ['TREE_DB']
TREE_DB_PATH = Path(TREE_DB)

database = SqliteDatabase(TREE_DB)

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
    lookup=ForeignKeyField(Lookup, backref='intents')
    created=DateTimeField(default=datetime.now)
    method=CharField()

def random_code():
    alphabet='ABCDEFGHJKMNPQRTVWXYZ'
    return ''.join([alphabet[random.randint(0,len(alphabet)-1)] for i in range(4)])

def new_lookup():
    for i in range(100):
        id = random_code()
        if not Lookup.select().where(Lookup.code==id).exists():
            code = id
            break
    Lookup.create(code=code)
    return code

def recreate_view(view_name: str, sql_file: str):
    database.execute_sql(f'drop view if exists {view_name};')
    with open(Path(__file__).parent / sql_file, 'r') as f:
        database.execute_sql(f.read())
    logger.debug(f'{view_name} view returns %s records', len(execute_sql(f'select * from {view_name};')))
    
def treedb_init(handler):
    logger.addHandler(handler)
    if not TREE_DB_PATH.exists():
        logger.info(f'initializing database {TREE_DB}')
        TREE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        database.connect()
        database.create_tables([Lookup, Order, Address])
        database.close()
    logger.info(f'connecting to database {TREE_DB}')
    
    database.connect()
    database.create_tables([Intent], safe=True)
    recreate_view('pickups', 'create-pickups-view.sql')
    #recreate_view('email_history_full', 'create-email-history-full-view.sql')
    #recreate_view('email_history', 'create-email-history-view.sql')
    database.close()

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

    except Exception:
        # Handle other potential exceptions
        logger.exception("Exception creating intent")
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

    except Exception:
        # Handle other potential exceptions
        logger.exception("Exception creating order")
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
    last_address = (Address
                    .select(
                        Address.name,
                        Address.line1,
                        Address.line2,
                        Address.city,
                        Address.state,
                        Address.postal_code,
                        Address.country,
                        Address.email,
                        Address.phone)
                    .join(Lookup, on(Address.lookup_id == Lookup.id))
                    .where(Lookup.code == lookup_code)
                    .order_by(Address.created.desc())
                    .first())
    return model_to_dict(last_address) if last_address else None

def get_last_order(lookup_code) -> Order | None:
    last_order = (Order
                .select()
                .join(Lookup, on=(Order.lookup_id == Lookup.id))
                .where(Lookup.code == lookup_code)
                .order_by(Order.created.desc())  # Order by created date descending
                .first())  # Get the first (most recent) result
    return model_to_dict(last_order) if last_order else None

def get_last_intent(lookup_code):
    last = (Intent
                  .select()
                  .join(Intent)
                  .where(Lookup.code == lookup_code)
                  .order_by(Intent.created.desc())
                  .get())
    return model_to_dict(last) if last else None

def get_pickups_peewee():
    latest_addresses = (Address
        .select(
            Address.lookup_id,
            fn.MAX(Address.created).alias('max_address_date')
        )
        .group_by(Address.lookup_id)
        .alias('latest_addresses'))

    latest_orders = (Order
        .select(
            Order.lookup_id,
            fn.MAX(Order.created).alias('max_order_date')
        )
        .group_by(Order.lookup_id)
        .alias('latest_orders'))

    latest_intents = (Intent
        .select(
            Intent.lookup_id,
            fn.MAX(Intent.created).alias('max_intent_date')
        )
        .group_by(Intent.lookup_id)
        .alias('latest_intents'))

    query = (Lookup
        .select(
            Lookup.code,

            Address.name,
            Address.email,
            Address.phone,
            Address.line1,
            Address.line2,
            Address.city,
            Address.state,
            Address.postal_code,
            Address.country,
            Address.created.alias('address_created'),
            
            Order.numtrees,
            Order.extra,
            Order.comment,
            Order.created.alias('order_created'),

            Intent.method,
            Intent.created.alias('intent_created')
        )
        .join(
            latest_addresses,
            on=(Address.lookup_id == latest_addresses.c.lookup_id)
        )
        .join(
            latest_orders,
            on=(latest_addresses.c.lookup_id == latest_orders.c.lookup_id)
        )
        .join(
            latest_intents,
            on=(latest_orders.c.lookup_id == latest_intents.c.lookup_id)
        )
    )

    return model_to_dict(query)


def execute_sql(query: str):
    #cursor = database.execute_sql(SQL_QUERY_PICKUPS)
    cursor = database.execute_sql(query)

    dicts = []
    for row in cursor.fetchall():
        record = {}

        for column, value in zip(cursor.description, row):
            column_name = column[0]
            #print(column_name, '=', value)
            record[column_name] = value

        dicts.append(record)

    return dicts


def get_email_history():
    return execute_sql('select * from email_history;')

def get_pickups():
    logger.info("get_pickups 2")
    return execute_sql('select * from pickups where date(address_created) > date("2025-07-01");')
