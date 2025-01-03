drop table if exists contacts;

.mode csv
.headers on
.import contacts.csv contacts

.mode table
select count() from contacts;
select email from contacts limit 10;

