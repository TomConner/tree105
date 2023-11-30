.mode box

begin transaction;

create temp table active_address as
	select lookup_id, address_id 
	from (
		select lookup_id, id as "address_id", max(created) 
		from address 
        where id > (select max(address_id) from active)
        group by lookup_id 
        order by id
	);

create temp table active_order as 
	select lookup_id, order_id 
	from (
		select lookup_id, id as "order_id", max(created) 
		from 'order' 
        where id > (select max(order_id) from active)
        group by lookup_id 
        order by id
	);

CREATE TABLE if not exists "active" (
    lookup_id integer not null primary key,
    address_id INT,
    order_id INT,
    is_active INT,
    FOREIGN KEY ("lookup_id") REFERENCES "lookup" ("id")
);

drop table if exists prev_rows;
create table prev_rows as 
select count(*) active_rows, max(id) max_id 
from active;

insert into active
    select aa.lookup_id, address_id, order_id, 1 as is_active
    from active_address aa, active_order ao 
    where aa.lookup_id=ao.lookup_id order by aa.lookup_id;

select count(*)-(select active_rows from prev_rows) as "rows_added" from active;

drop table active_address;
drop table active_order;

commit transaction;

