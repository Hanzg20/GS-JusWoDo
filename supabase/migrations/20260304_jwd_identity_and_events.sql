-- Migration: JWD Identity and Neighborhood Events
-- Description: Adds jwd_code to users and creates RSVP system for events
-- Date: 2026-03-04

-- 1. Add jwd_code to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS jwd_code TEXT UNIQUE;

-- Function to generate a unique JWD code (e.g. JWD-XXXX-XXXX)
CREATE OR REPLACE FUNCTION public.generate_jwd_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'JWD-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 5 for 4));
    SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE jwd_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate jwd_code on creation if missing
CREATE OR REPLACE FUNCTION public.maybe_assign_jwd_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.jwd_code IS NULL THEN
    NEW.jwd_code := public.generate_jwd_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_profile_assign_jwd_code ON public.user_profiles;
CREATE TRIGGER on_user_profile_assign_jwd_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_assign_jwd_code();

-- Update existing users with jwd_code
UPDATE public.user_profiles SET jwd_code = public.generate_jwd_code() WHERE jwd_code IS NULL;

-- 2. Event RSVP Table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.listing_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ATTENDED', 'NO_SHOW', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS for event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policies for event_rsvps
CREATE POLICY "RSVPs are viewable by everyone" 
  ON public.event_rsvps FOR SELECT TO public 
  USING (true);

CREATE POLICY "Users can create their own RSVPs" 
  ON public.event_rsvps FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs" 
  ON public.event_rsvps FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- 3. Automated Bean Lock Logic for RSVP
-- This logic will be triggered when a new RSVP is created with a commitment_amount > 0
CREATE OR REPLACE FUNCTION public.process_event_rsvp_bean_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_event_title TEXT;
BEGIN
    IF NEW.commitment_amount > 0 THEN
        -- Get event title for the reason
        SELECT title INTO v_event_title FROM public.listing_masters WHERE id = NEW.event_id;

        PERFORM public.record_bean_transaction(
            NEW.user_id,
            -NEW.commitment_amount,
            'EVENT_RSVP',
            '参与活动邻里承诺金：' || COALESCE(v_event_title, ''),
            'Event RSVP commitment: ' || COALESCE(v_event_title, ''),
            NEW.event_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_rsvp_created_lock_beans ON public.event_rsvps;
CREATE TRIGGER on_event_rsvp_created_lock_beans
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.process_event_rsvp_bean_lock();

-- 4. Attendance Check-in Logic
-- When status moves to ATTENDED, we might want to return beans or give bonus
-- This can be handled via a RPC called during QR scan at venue
CREATE OR REPLACE FUNCTION public.check_in_to_event(p_rsvp_id UUID)
RETURNS VOID AS $$
DECLARE
    v_rsvp RECORD;
    v_host_id UUID;
    v_event_title TEXT;
BEGIN
    SELECT r.*, m.provider_id, m.title INTO v_rsvp 
    FROM public.event_rsvps r
    JOIN public.listing_masters m ON r.event_id = m.id
    WHERE r.id = p_rsvp_id;

    IF v_rsvp.status = 'PENDING' THEN
        -- Update status to ATTENDED
        UPDATE public.event_rsvps SET status = 'ATTENDED', updated_at = now() WHERE id = p_rsvp_id;

        -- Return the commitment beans
        IF v_rsvp.commitment_amount > 0 THEN
            PERFORM public.record_bean_transaction(
                v_rsvp.user_id,
                v_rsvp.commitment_amount,
                'EVENT_RSVP_REFUND',
                '活动如约参加回退承诺金：' || v_rsvp.title,
                'Event attendance commitment refund: ' || v_rsvp.title,
                v_rsvp.event_id
            );
        END IF;

        -- Check if we should reward the host (Node Spark)
        -- Logic: If this is the 3rd person to check in, give host 20 beans
        -- Wait, better logic: For every check-in, or after a threshold?
        -- Let's do after 3 check-ins as per design
        IF (SELECT count(*) FROM public.event_rsvps WHERE event_id = v_rsvp.event_id AND status = 'ATTENDED') = 3 THEN
            -- Get host user_id (provider_id links to provider_profiles)
            SELECT user_id INTO v_host_id FROM public.provider_profiles WHERE id = v_rsvp.provider_id;
            
            PERFORM public.record_bean_transaction(
                v_host_id,
                public.get_bean_rule_amount('NODE_SPARK_REWARD'),
                'NODE_SPARK',
                '成功组织邻里活动奖励：' || v_rsvp.title,
                'Successful neighborhood event hosting: ' || v_rsvp.title,
                v_rsvp.event_id
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
