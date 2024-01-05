select 
    (select count(*) from active) -
    (select active_rows from prev_rows)
    "new_rows";
