select a.created, code, numtrees, extra, name, line1, email, phone, comment
from address a, 'order' o, active v, lookup l
where l.id=v.lookup_id and a.lookup_id=l.id and o.lookup_id=l.id and is_active!=0
order by a.created;
