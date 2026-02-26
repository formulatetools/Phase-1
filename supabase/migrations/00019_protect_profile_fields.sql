-- ============================================================================
-- 00019: Protect Profile Fields from Client-Side Escalation
-- Prevents authenticated users from self-modifying subscription, role, or
-- download counter via the Supabase JS client (browser console exploit).
-- Only service_role (admin client, webhooks, crons) can change these fields.
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role to change anything (webhooks, crons, admin actions)
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For authenticated (anon key) callers, silently revert protected columns
  NEW.role := OLD.role;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.subscription_status := OLD.subscription_status;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.monthly_download_count := OLD.monthly_download_count;
  NEW.download_count_reset_at := OLD.download_count_reset_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_fields();
