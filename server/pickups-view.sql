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
from 'lookup'
inner join latest_addresses on lookup.id=a_lid
inner join latest_orders on lookup.id=o_lid
left outer join latest_intents on lookup.id= i_lid
;
select count() from pickups;
select code, name, email, line1, comment from pickups limit 20;

drop view if exists pickupstripe;
create view pickupstripe as
select
    code,
    order_created, 
    intent_created,
    address_created,
    pickups.name,
    pickups.email,
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
    method,
    stripe2025
from pickups
left outer join email_history on pickups.email=email_history.email;

select count() from pickupstripe;
select code, email, line1, comment, stripe2025 from pickupstripe limit 20;
