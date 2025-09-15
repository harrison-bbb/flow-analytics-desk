-- Change time_saved_month column from integer to numeric to support decimal values
ALTER TABLE user_metrics 
ALTER COLUMN time_saved_month TYPE numeric;