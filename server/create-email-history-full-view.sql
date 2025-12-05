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