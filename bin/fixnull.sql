select * from address where lookup_id=3;
select * from 'order' where lookup_id=3;select * from 'active' where lookup_id=3;select * from 'intent' where lookup_id=3;
select * from 'intent';
select * from lookup where code='null' or code like 'WW%';
select * from address where lookup_id=135;
select * from 'order' where lookup_id=135;
select * from 'active' where lookup_id=135;
select * from 'intent' where lookup_id=135;
update address set lookup_id=135 where ksjdf skjdf sdf ;


select a.id "address.id", a.lookup_id, code, a.created, email, name,line1 from 'address' a, 'lookup' l where a.lookup_id=l.id and (l.code='null' or l.code like 'WW%');
select o.id "order.id", o.lookup_id, code, o.created, o.numtrees, o.extra, o.comment from 'order' o, 'lookup' l where o.lookup_id=l.id and (l.code='null' or l.code like 'WW%');
select l.code, v.lookup_id, v.address_id, v.order_id, v.is_active from 'active' v, 'lookup' l where v.lookup_id=l.id and (
    l.code='null' or l.code like 'WW%'
    or v.address_id in (176)
    or v.order_id in ()
);
select * from address a, 'order' o
where a.id>(select max_address_id from prev_rows)
and o.id>(select max_order_id from prev_rows)
and a.lookup_id=o.lookup_id
order by a.created;select * from lookup where code='null' or code like 'WW%';
select * from address where id>(select max_address_id from prev_rows) order by created;
select * from 'order' where id>(select max_order_id from prev_rows) order by created;



delete from address where email in ('tomconner46@gmail.com','tconner8@gatech.edu');
update 'address' set lookup_id=135 where id=172;
update 'order' set lookup_id=135 where id=207;
--insert into 'active' (lookup_id, address_id, order_id, is_active) values (135, 172, 207, 1);
update 'address' set lookup_id=136 where id=176;
update 'order' set lookup_id=136 where id=216;
--insert into 'active' (lookup_id, address_id, order_id, is_active) values (136, 176, 216, 1);
update 'address' set lookup_id=137 where id=183;
update 'order' set lookup_id=137 where id=225;
--insert into 'active' (lookup_id, address_id, order_id, is_active) values (137, 183, 225, 1);
delete from 'address' where id=186;
update 'address' set lookup_id=277 where id=195;
update active set address_id=181 where lookup_id=3;
update active set order_id=222 where lookup_id=3;
