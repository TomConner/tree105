.mode box

create temp table pickup as
select a.created, code, numtrees, extra, name, line1, email
from address a, 'order' o, active v, lookup l
where l.id=v.lookup_id and v.address_id=a.id and v.order_id=o.id and is_active!=0
order by a.id;

create temp table dupe as
select *, count(code) dupes from pickup group by email;

select count(*) as num_duplicate_email_codes
from dupe
where dupes>1;

select * from dupe where dupes>1;

drop table pickup;
drop table dupe;


