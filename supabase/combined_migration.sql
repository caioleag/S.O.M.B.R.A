-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  total_missions_completed int DEFAULT 0,
  total_operations int DEFAULT 0,
  badges_earned jsonb DEFAULT '[]'::jsonb,
  rank text DEFAULT 'RECRUTA',
  created_at timestamptz DEFAULT now()
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES public.profiles(id),
  duration_days int NOT NULL CHECK (duration_days IN (7, 14, 30)),
  daily_reset_hour int NOT NULL DEFAULT 0 CHECK (daily_reset_hour BETWEEN 0 AND 23),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'completed')),
  invite_code text UNIQUE NOT NULL,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator can update their operations"
  ON public.operations FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Authenticated users can create operations"
  ON public.operations FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());


CREATE TABLE public.operation_members (
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  total_points int DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (operation_id, user_id)
);

ALTER TABLE public.operation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members of same operation can view members"
  ON public.operation_members FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own membership"
  ON public.operation_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can join operations"
  ON public.operation_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('vigilancia', 'coleta', 'infiltracao', 'disfarce', 'reconhecimento')),
  title text NOT NULL,
  objective text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points int NOT NULL CHECK (points IN (10, 20, 30))
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read missions"
  ON public.missions FOR SELECT
  TO authenticated
  USING (true);


INSERT INTO public.missions (category, title, objective, difficulty, points) VALUES
-- VIGILÃ‚NCIA (9)
('vigilancia', 'OperaÃ§Ã£o CafÃ© Clandestino', 'Capture alguÃ©m tomando cafÃ© sem ser notado', 'easy', 10),
('vigilancia', 'OperaÃ§Ã£o Sapato Suspeito', 'Fotografe discretamente um sapato incomum/interessante', 'easy', 10),
('vigilancia', 'OperaÃ§Ã£o Janela Indiscreta', 'Capture alguÃ©m atravÃ©s de uma janela', 'easy', 10),
('vigilancia', 'OperaÃ§Ã£o Conversa Paralela', 'Fotografe duas pessoas conversando sem que nenhuma perceba', 'medium', 20),
('vigilancia', 'OperaÃ§Ã£o Leitura Clandestina', 'Capture alguÃ©m lendo com o conteÃºdo visÃ­vel', 'medium', 20),
('vigilancia', 'OperaÃ§Ã£o ReuniÃ£o Secreta', 'Fotografe um grupo de 4+ pessoas reunidas', 'medium', 20),
('vigilancia', 'OperaÃ§Ã£o EmoÃ§Ã£o Capturada', 'Capture alguÃ©m em momento emocional (rindo muito, chorando, surpreso)', 'hard', 30),
('vigilancia', 'OperaÃ§Ã£o SincronizaÃ§Ã£o Total', 'Capture 5+ pessoas fazendo exatamente a mesma coisa', 'hard', 30),
('vigilancia', 'OperaÃ§Ã£o ConfluÃªncia', 'Fotografe 3 conversas diferentes acontecendo simultaneamente', 'hard', 30),
-- COLETA DE PROVAS (9)
('coleta', 'OperaÃ§Ã£o Objeto InÃ©dito', 'Fotografe objeto que nenhum agente da operaÃ§Ã£o tenha visto antes', 'easy', 10),
('coleta', 'OperaÃ§Ã£o Cor Dominante', 'Capture algo completamente vermelho', 'easy', 10),
('coleta', 'OperaÃ§Ã£o RelÃ­quia', 'Capture algo claramente antigo/vintage', 'easy', 10),
('coleta', 'OperaÃ§Ã£o Elementos Naturais', 'Capture Ã¡gua, fogo, terra e ar na mesma foto', 'medium', 20),
('coleta', 'OperaÃ§Ã£o Alfabeto Oculto', 'Fotografe objeto/lugar que forme uma letra clara (V, T, X, etc)', 'medium', 20),
('coleta', 'OperaÃ§Ã£o Fora do Lugar', 'Fotografe algo que nÃ£o deveria estar onde estÃ¡', 'medium', 20),
('coleta', 'OperaÃ§Ã£o Impossibilidade', 'Fotografe algo que desafie a lÃ³gica/gravidade/expectativa', 'hard', 30),
('coleta', 'OperaÃ§Ã£o Milagre Urbano', 'Encontre natureza prosperando em concreto/ambiente artificial', 'hard', 30),
('coleta', 'OperaÃ§Ã£o Achado ArqueolÃ³gico', 'Encontre objeto de pelo menos 50 anos em uso ativo', 'hard', 30),
-- INFILTRAÃ‡ÃƒO (9)
('infiltracao', 'OperaÃ§Ã£o Fila Infiltrada', 'Tire foto sua em uma fila com 5+ pessoas', 'easy', 10),
('infiltracao', 'OperaÃ§Ã£o PÃ³s-horÃ¡rio', 'Fotografe-se em local pÃºblico apÃ³s 22h', 'easy', 10),
('infiltracao', 'OperaÃ§Ã£o Espelho Alheio', 'Tire selfie em espelho/vitrine de estabelecimento', 'easy', 10),
('infiltracao', 'OperaÃ§Ã£o Teto Alto', 'Tire foto sua dentro de prÃ©dio com pÃ©-direito altÃ­ssimo', 'medium', 20),
('infiltracao', 'OperaÃ§Ã£o HorÃ¡rio Vazio', 'Fotografe-se em lugar normalmente cheio, mas vazio', 'medium', 20),
('infiltracao', 'OperaÃ§Ã£o Natureza Urbana', 'Fotografe-se em Ã¡rea verde dentro da cidade', 'medium', 20),
('infiltracao', 'OperaÃ§Ã£o Amanhecer Urbano', 'Fotografe-se em local pÃºblico entre 5h-6h da manhÃ£', 'hard', 30),
('infiltracao', 'OperaÃ§Ã£o Atividade Incomum', 'Participe e fotografe-se fazendo atividade que nunca fez', 'hard', 30),
('infiltracao', 'OperaÃ§Ã£o Marco Zero', 'Fotografe-se em monumento/ponto turÃ­stico da sua cidade', 'hard', 30),
-- DISFARCE (9)
('disfarce', 'OperaÃ§Ã£o AcessÃ³rio Inusitado', 'Tire foto sua usando chapÃ©u, Ã³culos ou lenÃ§o que nÃ£o usa normalmente', 'easy', 10),
('disfarce', 'OperaÃ§Ã£o Contraste', 'Use duas peÃ§as de estilos totalmente opostos juntas', 'easy', 10),
('disfarce', 'OperaÃ§Ã£o Listras Verticais', 'Fotografe-se usando algo listrado', 'easy', 10),
('disfarce', 'OperaÃ§Ã£o MonocromÃ¡tico', 'Vista-se todo de uma cor sÃ³ (head to toe)', 'medium', 20),
('disfarce', 'OperaÃ§Ã£o Ã‰poca Errada', 'Use roupa formal em contexto casual (ou vice-versa)', 'medium', 20),
('disfarce', 'OperaÃ§Ã£o Excesso', 'Use algo exageradamente grande ou pequeno demais', 'medium', 20),
('disfarce', 'OperaÃ§Ã£o TransformaÃ§Ã£o Total', 'Mude completamente visual (cabelo, roupa, maquiagem, postura)', 'hard', 30),
('disfarce', 'OperaÃ§Ã£o Subcultural', 'Adote visual de subcultura que nÃ£o Ã© a sua', 'hard', 30),
('disfarce', 'OperaÃ§Ã£o Invisibilidade Social', 'Vista-se tÃ£o genÃ©rico que ninguÃ©m te notaria', 'hard', 30),
-- RECONHECIMENTO (9)
('reconhecimento', 'OperaÃ§Ã£o Detalhe ArquitetÃ´nico', 'Fotografe detalhe de construÃ§Ã£o que a maioria nÃ£o nota', 'easy', 10),
('reconhecimento', 'OperaÃ§Ã£o Grafite Secreto', 'Fotografe arte de rua/grafite em local inesperado', 'easy', 10),
('reconhecimento', 'OperaÃ§Ã£o Vista Privilegiada', 'Encontre local com vista Ãºnica e fotografe', 'easy', 10),
('reconhecimento', 'OperaÃ§Ã£o Simetria Urbana', 'Encontre construÃ§Ã£o/local perfeitamente simÃ©trico', 'medium', 20),
('reconhecimento', 'OperaÃ§Ã£o EvidÃªncia HistÃ³rica', 'Encontre marca/vestÃ­gio de que algo existiu ali antes', 'medium', 20),
('reconhecimento', 'OperaÃ§Ã£o Ponto de Encontro', 'Identifique local perfeito para reuniÃ£o secreta e fotografe', 'medium', 20),
('reconhecimento', 'OperaÃ§Ã£o Marca Secreta', 'Encontre sÃ­mbolo/marca deixado propositalmente', 'hard', 30),
('reconhecimento', 'OperaÃ§Ã£o CÃ³digo Visual', 'Descubra padrÃ£o/mensagem escondida em fachada/construÃ§Ã£o', 'hard', 30),
('reconhecimento', 'OperaÃ§Ã£o Tempo Esquecido', 'Fotografe relÃ³gio/marca de tempo parado/errado', 'hard', 30);


CREATE TABLE public.daily_mission_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  mission_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (operation_id, day_number)
);

ALTER TABLE public.daily_mission_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pools of their operations"
  ON public.daily_mission_pools FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );


CREATE TABLE public.assigned_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id),
  day_number int NOT NULL,
  category_assigned text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'selected', 'completed', 'failed', 'rejected')),
  photo_url text,
  caption text,
  selected_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.assigned_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view assigned missions in their operations"
  ON public.assigned_missions FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own assigned missions"
  ON public.assigned_missions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assigned missions"
  ON public.assigned_missions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


CREATE TABLE public.votes (
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (assigned_mission_id, voter_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes in their operations"
  ON public.votes FOR SELECT
  TO authenticated
  USING (
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote on missions in their operations"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = auth.uid() AND
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );


CREATE TABLE public.reactions (
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('funny', 'creative', 'precise', 'bold', 'gross')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (assigned_mission_id, user_id, reaction_type)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions in their operations"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can react to missions in their operations"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- Function to generate a random 6-char invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rank based on missions completed
CREATE OR REPLACE FUNCTION public.calculate_rank(missions_count int)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN missions_count >= 201 THEN 'LENDA'
    WHEN missions_count >= 101 THEN 'VETERANO'
    WHEN missions_count >= 61 THEN 'OPERADOR'
    WHEN missions_count >= 31 THEN 'SÃŠNIOR'
    WHEN missions_count >= 11 THEN 'AGENTE'
    ELSE 'RECRUTA'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update rank when missions completed changes
CREATE OR REPLACE FUNCTION public.update_rank_on_missions()
RETURNS trigger AS $$
BEGIN
  NEW.rank := public.calculate_rank(NEW.total_missions_completed);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profile_rank
  BEFORE UPDATE OF total_missions_completed ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_rank_on_missions();

-- Function to check vote result for an assigned mission
CREATE OR REPLACE FUNCTION public.check_vote_result(mission_id uuid)
RETURNS text AS $$
DECLARE
  total_members int;
  approve_count int;
  reject_count int;
  majority int;
BEGIN
  -- Get total members in the operation
  SELECT COUNT(*) INTO total_members
  FROM public.operation_members om
  JOIN public.assigned_missions am ON am.operation_id = om.operation_id
  WHERE am.id = mission_id;
  
  -- Get vote counts
  SELECT 
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*) FILTER (WHERE vote = 'reject')
  INTO approve_count, reject_count
  FROM public.votes
  WHERE assigned_mission_id = mission_id;
  
  majority := CEIL(total_members::float / 2);
  
  IF approve_count >= majority THEN RETURN 'approved';
  ELSIF reject_count >= majority THEN RETURN 'rejected';
  ELSE RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Push subscriptions table for notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Favorite photos table
CREATE TABLE IF NOT EXISTS public.favorite_photos (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, assigned_mission_id)
);

ALTER TABLE public.favorite_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.favorite_photos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC helper to atomically add points to an operation member
CREATE OR REPLACE FUNCTION public.add_points_to_member(
  p_operation_id uuid,
  p_user_id uuid,
  p_points int
)
RETURNS void AS $$
BEGIN
  UPDATE public.operation_members
  SET total_points = total_points + COALESCE(p_points, 0)
  WHERE operation_id = p_operation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_points_to_member(uuid, uuid, int) TO authenticated;

-- RPC helper to increment profile counters used by API routes
CREATE OR REPLACE FUNCTION public.increment_profile_stat(uid uuid, stat text)
RETURNS void AS $$
BEGIN
  IF stat = 'total_operations' THEN
    UPDATE public.profiles
    SET total_operations = total_operations + 1
    WHERE id = uid;
  ELSIF stat = 'total_missions_completed' THEN
    UPDATE public.profiles
    SET total_missions_completed = total_missions_completed + 1
    WHERE id = uid;
  ELSE
    RAISE EXCEPTION 'Unsupported profile stat: %', stat;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_profile_stat(uuid, text) TO authenticated;

-- Storage bucket used by mission submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-photos',
  'mission-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mission photos are publicly readable'
  ) THEN
    CREATE POLICY "Mission photos are publicly readable"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'mission-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own mission photos'
  ) THEN
    CREATE POLICY "Users can upload own mission photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own mission photos'
  ) THEN
    CREATE POLICY "Users can update own mission photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own mission photos'
  ) THEN
    CREATE POLICY "Users can delete own mission photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

