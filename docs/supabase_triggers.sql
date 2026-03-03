-- ==========================================
-- AUTO-PROFILE CREATION TRIGGER
-- Executed when a new user registers via Supabase Auth
-- ==========================================

-- Function: Create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    node_id,
    beans_balance,
    verification_level,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Neighbor'),
    COALESCE(NEW.raw_user_meta_data->>'nodeId', 'NODE_LEES'), -- Default to Lees pilot
    0, -- Start with 0 beans
    1, -- Level 1 (Email Verified)
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- 删除旧 trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_oauth_user();
-- 重新创建函数（使用 postgres 角色）
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, avatar, node_id, beans_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'NODE_LEES',
    100
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar = COALESCE(user_profiles.avatar, EXCLUDED.avatar),
    name = COALESCE(user_profiles.name, EXCLUDED.name);
  
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'BUYER'
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 重新创建 trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_oauth_user();


-- ==========================================
-- VECTOR EMBEDDING TRIGGER (For AI Search)
-- ==========================================

-- Function: Generate embedding placeholder
CREATE OR REPLACE FUNCTION public.generate_embedding_for_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For MVP: Set to zero vector, will be populated by Edge Function
  -- In production: This calls the Edge Function or queues a background job
  IF NEW.embedding IS NULL THEN
    NEW.embedding = array_fill(0, ARRAY[384])::vector; -- 384-dim zero vector
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Execute on listing insert/update
DROP TRIGGER IF EXISTS generate_listing_embedding ON public.listing_masters;
CREATE TRIGGER generate_listing_embedding
  BEFORE INSERT OR UPDATE OF title_zh, title_en, description_zh
  ON public.listing_masters
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_embedding_for_listing();

-- ==========================================
-- SEMANTIC SEARCH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.search_listings(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_node_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title_zh text,
  title_en text,
  description_zh text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lm.id,
    lm.title_zh,
    lm.title_en,
    lm.description_zh,
    1 - (lm.embedding <=> query_embedding) AS similarity
  FROM listing_masters lm
  WHERE 
    (filter_node_id IS NULL OR lm.node_id = filter_node_id)
    AND lm.status = 'PUBLISHED'
    AND 1 - (lm.embedding <=> query_embedding) > match_threshold
  ORDER BY lm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ==========================================
-- JINBEAN TRANSACTION HELPERS
-- ==========================================

-- Function: Award beans and record transaction
CREATE OR REPLACE FUNCTION public.award_beans(
  user_id_param uuid,
  amount_param integer,
  reason_param text,
  order_id_param uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user balance
  UPDATE public.user_profiles
  SET beans_balance = beans_balance + amount_param,
      updated_at = NOW()
  WHERE id = user_id_param;
  
  -- Record transaction
  INSERT INTO public.bean_transactions (
    user_id,
    amount,
    type,
    reason,
    related_order_id,
    created_at
  )
  VALUES (
    user_id_param,
    amount_param,
    'EARNED',
    reason_param,
    order_id_param,
    NOW()
  );
END;
$$;

-- Function: Deduct beans for order
CREATE OR REPLACE FUNCTION public.spend_beans(
  user_id_param uuid,
  amount_param integer,
  reason_param text,
  order_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Check balance
  SELECT beans_balance INTO current_balance
  FROM public.user_profiles
  WHERE id = user_id_param;
  
  IF current_balance < amount_param THEN
    RETURN FALSE; -- Insufficient beans
  END IF;
  
  -- Deduct beans
  UPDATE public.user_profiles
  SET beans_balance = beans_balance - amount_param,
      updated_at = NOW()
  WHERE id = user_id_param;
  
  -- Record transaction
  INSERT INTO public.bean_transactions (
    user_id,
    amount,
    type,
    reason,
    related_order_id,
    created_at
  )
  VALUES (
    user_id_param,
    -amount_param,
    'SPENT',
    reason_param,
    order_id_param,
    NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- ==========================================
-- ORDER STATE MACHINE VALIDATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Define valid transitions
  IF OLD.status = 'PENDING_PAYMENT' AND NEW.status NOT IN ('PENDING_CONFIRMATION', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid status transition from PENDING_PAYMENT to %', NEW.status;
  END IF;
  
  IF OLD.status = 'PENDING_CONFIRMATION' AND NEW.status NOT IN ('ACCEPTED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid status transition from PENDING_CONFIRMATION to %', NEW.status;
  END IF;
  
  IF OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('IN_PROGRESS', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid status transition from ACCEPTED to %', NEW.status;
  END IF;
  
  IF OLD.status = 'IN_PROGRESS' AND NEW.status NOT IN ('COMPLETED', 'DISPUTED') THEN
    RAISE EXCEPTION 'Invalid status transition from IN_PROGRESS to %', NEW.status;
  END IF;
  
  IF OLD.status IN ('COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot change status from terminal state %', OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Validate order status changes
DROP TRIGGER IF EXISTS validate_order_status ON public.orders;
CREATE TRIGGER validate_order_status
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_status_transition();
