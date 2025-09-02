-- Update user subscription to Growth Engine plan
UPDATE user_subscriptions 
SET plan_id = '5d8cd913-a7da-4fb0-9aad-23ff5e0e94b5',
    updated_at = now()
WHERE user_id = 'e8727b67-2c5f-4f52-8cd1-616438128b07' 
AND is_active = true;