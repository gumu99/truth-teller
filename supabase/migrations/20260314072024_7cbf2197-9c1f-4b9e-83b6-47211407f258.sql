-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  profession TEXT,
  niche TEXT,
  followers TEXT,
  tone TEXT,
  self_claims JSONB DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expose_queue table
CREATE TABLE public.expose_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_username TEXT NOT NULL,
  claim TEXT NOT NULL,
  post_url TEXT,
  mode TEXT DEFAULT 'Auto',
  hook TEXT,
  facts TEXT,
  full_reply TEXT,
  evidence TEXT,
  witness_username TEXT,
  style_used TEXT,
  profession TEXT,
  niche TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create comeback_queue table
CREATE TABLE public.comeback_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  their_reply_text TEXT NOT NULL,
  detected_tone TEXT CHECK (detected_tone IN ('aggressive', 'sarcastic', 'nice', 'defensive')),
  comeback TEXT,
  style_used TEXT,
  target_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expose_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comeback_queue ENABLE ROW LEVEL SECURITY;

-- Since this is a single-user app (no auth), allow all operations
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expose_queue" ON public.expose_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comeback_queue" ON public.comeback_queue FOR ALL USING (true) WITH CHECK (true);