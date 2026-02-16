-- Corrige encoding dos títulos e objetivos das missões
-- Resolve problema de caracteres bugados (á, é, ã, ç, etc)

-- VIGILÂNCIA
UPDATE public.missions SET title = 'Operação Café Clandestino', objective = 'Capture alguém tomando café sem ser notado' WHERE category = 'vigilancia' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Caf%';
UPDATE public.missions SET title = 'Operação Sapato Suspeito' WHERE category = 'vigilancia' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Sapato%';
UPDATE public.missions SET title = 'Operação Janela Indiscreta', objective = 'Capture alguém através de uma janela' WHERE category = 'vigilancia' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Janela%';
UPDATE public.missions SET objective = 'Fotografe duas pessoas conversando sem que nenhuma perceba' WHERE category = 'vigilancia' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Conversa%';
UPDATE public.missions SET title = 'Operação Leitura Clandestina', objective = 'Capture alguém lendo com o conteúdo visível' WHERE category = 'vigilancia' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Leitura%';
UPDATE public.missions SET title = 'Operação Reunião Secreta' WHERE category = 'vigilancia' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Reuni%';
UPDATE public.missions SET title = 'Operação Emoção Capturada', objective = 'Capture alguém em momento emocional (rindo muito, chorando, surpreso)' WHERE category = 'vigilancia' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Emo%';
UPDATE public.missions SET title = 'Operação Sincronização Total' WHERE category = 'vigilancia' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Sincroniza%';
UPDATE public.missions SET title = 'Operação Confluência' WHERE category = 'vigilancia' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Confl%';

-- COLETA
UPDATE public.missions SET title = 'Operação Objeto Inédito', objective = 'Fotografe objeto que nenhum agente da operação tenha visto antes' WHERE category = 'coleta' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Objeto%';
UPDATE public.missions SET title = 'Operação Relíquia' WHERE category = 'coleta' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Rel%';
UPDATE public.missions SET title = 'Operação Elementos Naturais', objective = 'Capture água, fogo, terra e ar na mesma foto' WHERE category = 'coleta' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Elementos%';
UPDATE public.missions SET title = 'Operação Alfabeto Oculto' WHERE category = 'coleta' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Alfabeto%';
UPDATE public.missions SET title = 'Operação Fora do Lugar', objective = 'Fotografe algo que não deveria estar onde está' WHERE category = 'coleta' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Fora%';
UPDATE public.missions SET objective = 'Fotografe algo que desafie a lógica/gravidade/expectativa' WHERE category = 'coleta' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Impossibilidade%';
UPDATE public.missions SET title = 'Operação Milagre Urbano' WHERE category = 'coleta' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Milagre%';
UPDATE public.missions SET title = 'Operação Achado Arqueológico' WHERE category = 'coleta' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Achado%';

-- INFILTRAÇÃO
UPDATE public.missions SET title = 'Operação Fila Infiltrada' WHERE category = 'infiltracao' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Fila%';
UPDATE public.missions SET title = 'Operação Pós-horário', objective = 'Fotografe-se em local público após 22h' WHERE category = 'infiltracao' AND difficulty = 'easy' AND points = 10 AND title LIKE '%horário%';
UPDATE public.missions SET title = 'Operação Teto Alto', objective = 'Tire foto sua dentro de prédio com pé-direito altíssimo' WHERE category = 'infiltracao' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Teto%';
UPDATE public.missions SET title = 'Operação Horário Vazio' WHERE category = 'infiltracao' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Vazio%';
UPDATE public.missions SET title = 'Operação Natureza Urbana', objective = 'Fotografe-se em área verde dentro da cidade' WHERE category = 'infiltracao' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Natureza%';
UPDATE public.missions SET title = 'Operação Amanhecer Urbano', objective = 'Fotografe-se em local público entre 5h-6h da manhã' WHERE category = 'infiltracao' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Amanhecer%';
UPDATE public.missions SET objective = 'Participe e fotografe-se fazendo atividade que nunca fez' WHERE category = 'infiltracao' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Atividade%';
UPDATE public.missions SET title = 'Operação Marco Zero', objective = 'Fotografe-se em monumento/ponto turístico da sua cidade' WHERE category = 'infiltracao' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Marco%';

-- DISFARCE
UPDATE public.missions SET title = 'Operação Acessório Inusitado', objective = 'Tire foto sua usando chapéu, óculos ou lenço que não usa normalmente' WHERE category = 'disfarce' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Acess%';
UPDATE public.missions SET title = 'Operação Monocromático', objective = 'Vista-se todo de uma cor só (head to toe)' WHERE category = 'disfarce' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Monocrom%';
UPDATE public.missions SET title = 'Operação Época Errada' WHERE category = 'disfarce' AND difficulty = 'medium' AND points = 20 AND title LIKE '%poca%';
UPDATE public.missions SET title = 'Operação Transformação Total' WHERE category = 'disfarce' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Transforma%';
UPDATE public.missions SET title = 'Operação Subcultural', objective = 'Adote visual de subcultura que não é a sua' WHERE category = 'disfarce' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Subcultural%';
UPDATE public.missions SET title = 'Operação Invisibilidade Social', objective = 'Vista-se tão genérico que ninguém te notaria' WHERE category = 'disfarce' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Invisibilidade%';

-- RECONHECIMENTO
UPDATE public.missions SET title = 'Operação Detalhe Arquitetônico' WHERE category = 'reconhecimento' AND difficulty = 'easy' AND points = 10 AND title LIKE '%Arquitet%';
UPDATE public.missions SET title = 'Operação Evidência Histórica', objective = 'Encontre marca/vestígio de que algo existiu ali antes' WHERE category = 'reconhecimento' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Hist%';
UPDATE public.missions SET title = 'Operação Ponto de Encontro', objective = 'Identifique local perfeito para reunião secreta e fotografe' WHERE category = 'reconhecimento' AND difficulty = 'medium' AND points = 20 AND title LIKE '%Ponto%';
UPDATE public.missions SET title = 'Operação Código Visual', objective = 'Descubra padrão/mensagem escondida em fachada/construção' WHERE category = 'reconhecimento' AND difficulty = 'hard' AND points = 30 AND title LIKE '%digo%';
UPDATE public.missions SET title = 'Operação Tempo Esquecido', objective = 'Fotografe relógio/marca de tempo parado/errado' WHERE category = 'reconhecimento' AND difficulty = 'hard' AND points = 30 AND title LIKE '%Tempo%';
