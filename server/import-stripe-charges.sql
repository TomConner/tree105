drop table if exists stripe_charges;

.mode csv
.headers on
.import stripe_charges.csv stripe_charges

.mode table
select count() from stripe_charges;
select "Customer Email" from stripe_charges limit 10;

