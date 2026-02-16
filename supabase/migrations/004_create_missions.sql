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
