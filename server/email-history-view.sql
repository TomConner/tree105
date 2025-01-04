drop view if exists email_history_full;

create view email_history_full as
with emails as (
    select lower(email) email from contacts 
    union 
    select lower(email) email from pickups 
),
stripe as (
    select 
        "Customer Email" email, 
        sum(Amount)-sum("Amount Refunded") stripe2025 
    from stripe_charges 
    group by "Customer Email"
)
select 
    emails.email, 
    
    first_name || ' ' || last_name sgname,
    address_line_1 address2024, 
    numtrees2024,

    name name,
    line1 address2025,
    numtrees numtrees2025,
    stripe2025

    from emails 
    left outer join contacts on emails.email=contacts.email and numtrees2024>0
    left outer join pickups on emails.email=pickups.email
    left outer join stripe on lower(emails.email)=lower(stripe.email)

    where numtrees2024>0 or numtrees2025>0 or stripe2025>0
;

drop view if exists email_history;
create view email_history as
WITH numbered_rows AS (
  SELECT 
    email,
    coalesce(name,sgname) name,
    address2024,
    address2025,
    numtrees2024,
    numtrees2025,
    stripe2025,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY numtrees2024 DESC, numtrees2025 DESC) as row_num
  FROM email_history_full
)
SELECT 
  email,
  name,
  address2024,
  numtrees2024,
  address2025,
  numtrees2025,
  stripe2025
FROM numbered_rows
WHERE row_num = 1;

.mode table
select count() from email_history;
select * from email_history limit 30;
