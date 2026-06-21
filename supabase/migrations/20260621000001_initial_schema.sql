-- =============================================================================
-- Bullet Heaven — initial schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, mirrors the M2 SaveData shape.
-- Created automatically when a user signs up via the trigger below.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins              integer     NOT NULL DEFAULT 0,
  gems               integer     NOT NULL DEFAULT 0,
  equipped_character text        NOT NULL DEFAULT 'ranger',
  owned_characters   text[]      NOT NULL DEFAULT '{ranger}',
  -- Skill levels stored as JSONB to match the SaveData.upgrades shape exactly.
  upgrades           jsonb       NOT NULL DEFAULT '{
    "vitality":0,"power":0,"swiftness":0,"magnetism":0,
    "greed":0,"headStart":0,"secondWind":0
  }',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- runs: one row per completed run — drives the leaderboard.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name    text        NOT NULL DEFAULT 'Anonymous',
  score          integer     NOT NULL DEFAULT 0 CHECK (score >= 0),
  survived_ms    bigint      NOT NULL DEFAULT 0 CHECK (survived_ms >= 0),
  kills          integer     NOT NULL DEFAULT 0 CHECK (kills >= 0),
  level          integer     NOT NULL DEFAULT 1 CHECK (level >= 1),
  coins_earned   integer     NOT NULL DEFAULT 0 CHECK (coins_earned >= 0),
  character_id   text        NOT NULL DEFAULT 'ranger',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Leaderboard is public read.
CREATE POLICY "runs_select_public" ON public.runs
  FOR SELECT USING (true);

-- Users can only insert runs attributed to themselves (or anonymous).
CREATE POLICY "runs_insert_own" ON public.runs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row the moment a user signs up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Leaderboard view (top 100 all-time, no PII exposed).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT
    r.id,
    r.player_name,
    r.score,
    r.survived_ms,
    r.kills,
    r.level,
    r.character_id,
    r.created_at
  FROM public.runs r
  ORDER BY r.score DESC
  LIMIT 100;
