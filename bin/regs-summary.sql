select a.created, code, numtrees, extra, name, line1, email, (select method from intent where intent.lookup_id=v.lookup_id), comment
from address a, 'order' o, active v, lookup l
where l.id=v.lookup_id and v.address_id=a.id and v.order_id=o.id and is_active!=0
order by a.created;

