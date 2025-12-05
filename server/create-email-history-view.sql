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