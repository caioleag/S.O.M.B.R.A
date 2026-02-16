-- Deleta e recria todas as missões com encoding UTF-8 correto
-- Resolve definitivamente problema de caracteres acentuados

-- Limpa missões existentes e dados relacionados (CASCADE remove assigned_missions, votes, reactions, etc)
TRUNCATE TABLE public.missions CASCADE;

-- Recria todas as 45 missões com encoding correto
INSERT INTO public.missions (category, title, objective, difficulty, points) VALUES
-- VIGILÂNCIA (9)
('vigilancia', 'Operação Café Clandestino', 'Capture alguém tomando café sem ser notado', 'easy', 10),
('vigilancia', 'Operação Sapato Suspeito', 'Fotografe discretamente um sapato incomum/interessante', 'easy', 10),
('vigilancia', 'Operação Janela Indiscreta', 'Capture alguém através de uma janela', 'easy', 10),
('vigilancia', 'Operação Conversa Paralela', 'Fotografe duas pessoas conversando sem que nenhuma perceba', 'medium', 20),
('vigilancia', 'Operação Leitura Clandestina', 'Capture alguém lendo com o conteúdo visível', 'medium', 20),
('vigilancia', 'Operação Reunião Secreta', 'Fotografe um grupo de 4+ pessoas reunidas', 'medium', 20),
('vigilancia', 'Operação Emoção Capturada', 'Capture alguém em momento emocional (rindo muito, chorando, surpreso)', 'hard', 30),
('vigilancia', 'Operação Sincronização Total', 'Capture 5+ pessoas fazendo exatamente a mesma coisa', 'hard', 30),
('vigilancia', 'Operação Confluência', 'Fotografe 3 conversas diferentes acontecendo simultaneamente', 'hard', 30),

-- COLETA DE PROVAS (9)
('coleta', 'Operação Objeto Inédito', 'Fotografe objeto que nenhum agente da operação tenha visto antes', 'easy', 10),
('coleta', 'Operação Cor Dominante', 'Capture algo completamente vermelho', 'easy', 10),
('coleta', 'Operação Relíquia', 'Capture algo claramente antigo/vintage', 'easy', 10),
('coleta', 'Operação Elementos Naturais', 'Capture água, fogo, terra e ar na mesma foto', 'medium', 20),
('coleta', 'Operação Alfabeto Oculto', 'Fotografe objeto/lugar que forme uma letra clara (V, T, X, etc)', 'medium', 20),
('coleta', 'Operação Fora do Lugar', 'Fotografe algo que não deveria estar onde está', 'medium', 20),
('coleta', 'Operação Impossibilidade', 'Fotografe algo que desafie a lógica/gravidade/expectativa', 'hard', 30),
('coleta', 'Operação Milagre Urbano', 'Encontre natureza prosperando em concreto/ambiente artificial', 'hard', 30),
('coleta', 'Operação Achado Arqueológico', 'Encontre objeto de pelo menos 50 anos em uso ativo', 'hard', 30),

-- INFILTRAÇÃO (9)
('infiltracao', 'Operação Fila Infiltrada', 'Tire foto sua em uma fila com 5+ pessoas', 'easy', 10),
('infiltracao', 'Operação Pós-horário', 'Fotografe-se em local público após 22h', 'easy', 10),
('infiltracao', 'Operação Espelho Alheio', 'Tire selfie em espelho/vitrine de estabelecimento', 'easy', 10),
('infiltracao', 'Operação Teto Alto', 'Tire foto sua dentro de prédio com pé-direito altíssimo', 'medium', 20),
('infiltracao', 'Operação Horário Vazio', 'Fotografe-se em lugar normalmente cheio, mas vazio', 'medium', 20),
('infiltracao', 'Operação Natureza Urbana', 'Fotografe-se em área verde dentro da cidade', 'medium', 20),
('infiltracao', 'Operação Amanhecer Urbano', 'Fotografe-se em local público entre 5h-6h da manhã', 'hard', 30),
('infiltracao', 'Operação Atividade Incomum', 'Participe e fotografe-se fazendo atividade que nunca fez', 'hard', 30),
('infiltracao', 'Operação Marco Zero', 'Fotografe-se em monumento/ponto turístico da sua cidade', 'hard', 30),

-- DISFARCE (9)
('disfarce', 'Operação Acessório Inusitado', 'Tire foto sua usando chapéu, óculos ou lenço que não usa normalmente', 'easy', 10),
('disfarce', 'Operação Contraste', 'Use duas peças de estilos totalmente opostos juntas', 'easy', 10),
('disfarce', 'Operação Listras Verticais', 'Fotografe-se usando algo listrado', 'easy', 10),
('disfarce', 'Operação Monocromático', 'Vista-se todo de uma cor só (head to toe)', 'medium', 20),
('disfarce', 'Operação Época Errada', 'Use roupa formal em contexto casual (ou vice-versa)', 'medium', 20),
('disfarce', 'Operação Excesso', 'Use algo exageradamente grande ou pequeno demais', 'medium', 20),
('disfarce', 'Operação Transformação Total', 'Mude completamente visual (cabelo, roupa, maquiagem, postura)', 'hard', 30),
('disfarce', 'Operação Subcultural', 'Adote visual de subcultura que não é a sua', 'hard', 30),
('disfarce', 'Operação Invisibilidade Social', 'Vista-se tão genérico que ninguém te notaria', 'hard', 30),

-- RECONHECIMENTO (9)
('reconhecimento', 'Operação Detalhe Arquitetônico', 'Fotografe detalhe de construção que a maioria não nota', 'easy', 10),
('reconhecimento', 'Operação Grafite Secreto', 'Fotografe arte de rua/grafite em local inesperado', 'easy', 10),
('reconhecimento', 'Operação Vista Privilegiada', 'Encontre local com vista única e fotografe', 'easy', 10),
('reconhecimento', 'Operação Simetria Urbana', 'Encontre construção/local perfeitamente simétrico', 'medium', 20),
('reconhecimento', 'Operação Evidência Histórica', 'Encontre marca/vestígio de que algo existiu ali antes', 'medium', 20),
('reconhecimento', 'Operação Ponto de Encontro', 'Identifique local perfeito para reunião secreta e fotografe', 'medium', 20),
('reconhecimento', 'Operação Marca Secreta', 'Encontre símbolo/marca deixado propositalmente', 'hard', 30),
('reconhecimento', 'Operação Código Visual', 'Descubra padrão/mensagem escondida em fachada/construção', 'hard', 30),
('reconhecimento', 'Operação Tempo Esquecido', 'Fotografe relógio/marca de tempo parado/errado', 'hard', 30);
