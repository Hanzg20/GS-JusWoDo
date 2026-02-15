-- ==========================================
-- AI EMBEDDING AUTOMATION (WEBHOOKS)
-- Purpose: Automatically trigger embedding generation on listing changes.
-- ==========================================

-- 1. Create a function to trigger the Edge Function via net.http
-- Note: This requires the 'pgnet' extension or similar, but for Supabase, 
-- we usually set this up in the Dashboard under "Database > Webhooks".
-- Below is the SQL-only way to describe it if using a custom trigger + function.

/*
  HOW TO SETUP VIA SUPABASE DASHBOARD:
  1. Go to "Database" -> "Webhooks"
  2. Create "Enable Webhooks" (if not already enabled)
  3. Create "New Webhook":
     - Name: 'generate_listing_embedding'
     - Table: 'listing_masters'
     - Events: INSERT, UPDATE
     - Type: HTTP Request
     - Method: POST
     - URL: [YOUR_PROJECT_URL]/functions/v1/generate-embedding
     - Headers: 
         Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]
         Content-Type: application/json
*/

-- Alternatively, we can use a Database Trigger that calls the function directly if pg_net is available:
CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION public.queue_listing_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if text fields changed or it's a new insert
  IF (TG_OP = 'INSERT') OR 
     (OLD.title_zh IS DISTINCT FROM NEW.title_zh OR 
      OLD.title_en IS DISTINCT FROM NEW.title_en OR 
      OLD.description_zh IS DISTINCT FROM NEW.description_zh OR 
      OLD.description_en IS DISTINCT FROM NEW.description_en) THEN
      
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/generate-embedding',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
        ),
        body := jsonb_build_object('record', row_to_json(NEW))
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The above pg_net approach is fragile in different environments. 
-- The recommended way is the Dashboard Webhook.

-- We WILL however add a "Trigger Placeholder" logic to the DB to ensure 
-- we have a clear manual path if needed.
