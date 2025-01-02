drop table if exists pickups;
drop view if exists pickups;
create view pickups as
with latest_orders as (
    select
        lookup_id o_lid,
        max(created) order_created,
        numtrees,
        extra,
        comment
    from 'order' 
    group by lookup_id
    order by lookup_id
),
latest_intents as (
    select
        lookup_id i_lid,
        max(created) intent_created, 
        method
    from 'intent' 
    group by lookup_id
    order by lookup_id
),
latest_addresses as (
    select
        lookup_id a_lid,
        max(created) address_created,
        name,
        email,
        phone,
        line1,
        line2,
        city,
        state,
        postal_code,
        country
    from 'address' 
    group by lookup_id
    order by lookup_id
)
select 
    code,
    latest_orders.order_created, 
    latest_intents.intent_created,
    latest_addresses.address_created,
    name,
    email,
    phone,
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
    numtrees,
    extra,
    comment,
    method 
from 'lookup', latest_addresses, latest_orders, latest_intents
where lookup.id = a_lid
and lookup.id = o_lid
and lookup.id = i_lid
;
