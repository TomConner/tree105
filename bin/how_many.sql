.mode box

select count(*) from active;

select count(*) as new_addresses
from (
   select lookup_id, id as "address_id", max(created)
   from address
   where id > (select max(address_id) from active)
   group by lookup_id
   order by id
);

select count(*) as new_orders from (
   select lookup_id, id as "order_id", max(created)
   from 'order'
   where id > (select max(order_id) from active)
   group by lookup_id
   order by id
);
