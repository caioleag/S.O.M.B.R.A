# S.O.M.B.R.A - Product Requirements Document (PRD)

**Serviço Operacional de Missões Bizarras, Ridículas e Absurdamente Inúteis**

---

## 1. Visão Geral do Produto

### 1.1 Conceito
S.O.M.B.R.A é uma aplicação web mobile (PWA) que transforma desafios cotidianos em missões secretas absurdas. Inspirado em GymRats, o app permite que grupos de amigos criem "operações" com duração determinada, onde competem completando missões fotográficas temáticas de agentes secretos.

### 1.2 Público-Alvo
- **Primário:** Jovens adultos (18-25 anos)
- **Características:** Buscam diversão, humor, interação social leve e criatividade

### 1.3 Proposta de Valor
- **Diversão e riso entre amigos** como foco principal
- Competição saudável através de ranking
- Missões criativas que estimulam sair da rotina
- Interação social através de feed compartilhado

### 1.4 Plataforma Técnica
- **Frontend:** Web app responsiva (PWA) otimizada para mobile
- **Backend:** Supabase
- **Autenticação:** Google OAuth
- **Deployment:** PWA instalável

---

## 2. Mecânica Core

### 2.1 Estrutura de Jogo

#### Operações
- **Definição:** Competição fechada entre 3-5 amigos
- **Duração:** 7, 14 ou 30 dias (escolha do criador)
- **Privacidade:** Totalmente privada entre participantes
- **Limite:** 1 operação ativa por usuário por vez

#### Missões
- **Validação:** Foto como prova de conclusão
- **Categorias:** 5 tipos diferentes de operações secretas
- **Dificuldades:** Fácil (10 pts), Média (20 pts), Difícil (30 pts)
- **Temática:** Alegoria humorística de agentes secretos

### 2.2 Categorias de Missões

1. **Vigilância** (Categoria com mais missões)
   - Fotografar pessoas/situações sem ser notado
   - Capturar momentos específicos
   - Documentar comportamentos

2. **Coleta de Provas**
   - Encontrar objetos específicos
   - Capturar coisas nunca vistas antes
   - Coletar evidências visuais

3. **Infiltração**
   - Estar em locais incomuns
   - Participar de atividades fora do comum
   - Acessar espaços de forma criativa

4. **Disfarce**
   - Usar roupas/acessórios específicos
   - Combinar elementos visuais
   - Transformar aparência

5. **Reconhecimento** (Categoria com menos missões)
   - Mapear/contar elementos
   - Encontrar locais secretos
   - Descobrir informações ocultas

### 2.3 Sistema de Pontuação

#### Pontos por Missão
- **Fácil:** 10 pontos
- **Média:** 20 pontos
- **Difícil:** 30 pontos

#### Bônus e Badges
- **Badges Especiais:** Determinados por reações acumuladas
  - Mais Engraçado (😂)
  - Mais Criativo (🎨)
  - Mais Preciso (🎯)
  - Mais Ousado (😳)
  - Mais Nojento (🤢)

---

## 3. Fluxo de Usuário

### 3.1 Criação de Conta
1. Usuário acessa o app
2. Login com Google OAuth
3. Cria username/nome de agente
4. Acesso imediato a todas funcionalidades

### 3.2 Criação de Operação

#### Passo 1: Configuração
O criador define:
- Nome da operação
- Duração (7, 14 ou 30 dias)
- Horário de virada diária (quando novos desafios aparecem)

#### Passo 2: Convite de Agentes
Sistema gera:
- Código alfanumérico
- Link direto
- QR Code

Agentes entram na operação (status: INATIVA)

#### Passo 3: Início
- Criador pressiona "Iniciar Operação"
- Status muda para ATIVA
- Primeiro ciclo de missões é gerado

### 3.3 Ciclo Diário de Missão

#### Momento da Virada (horário definido pelo criador)
```
Para cada agente:
1. Sistema sorteia categoria aleatória
2. Sistema sorteia 9 missões daquela categoria
   - 3 Fáceis
   - 3 Médias
   - 3 Difíceis
3. Missões ficam disponíveis em pool compartilhado
```

#### Seleção de Missão
```
Agente:
1. Visualiza seu pool de 9 missões
2. Escolhe 1 missão
3. Missão sai do pool (outros não podem pegar)
4. Tem até próxima virada para completar
```

#### Pool Compartilhado
- Total de missões no pool = (número de agentes × 9) + 5
- Exemplo: 4 agentes = 36 + 5 = 41 missões disponíveis
- Missão desaparece quando alguém a escolhe

#### Execução
- Agente completa missão
- Tira foto como prova
- Adiciona legenda (opcional)
- Submete para validação

### 3.4 Sistema de Validação

#### Postagem
- Foto entra imediatamente no feed da operação
- Visível para todos os agentes
- Aguarda votação

#### Votação
- **Botões principais:**
  - ✓ Aprovar
  - ✗ Rejeitar
- **Critérios de julgamento:**
  - Criatividade na execução
  - Dificuldade superada
  - Qualidade da foto
  - Veracidade
- **Reações extras (não afetam aprovação):**
  - 😂 Engraçado
  - 🎨 Criativo
  - 🎯 Preciso
  - 😳 Ousado
  - 🤢 Nojento

#### Regras de Validação
- Agente não pode votar na própria missão
- Necessário maioria simples (50% + 1) para aprovar
- Prazo para votar: até fim da operação
- Penalidade por não votar (a definir)

#### Resultado
- **Se aprovada:** Agente ganha os pontos
- **Se rejeitada:** Fica marcada como "Missão Falhada" no histórico, sem pontos

### 3.5 Encerramento da Operação

#### Cerimônia Automática
Ao fim da duração, sistema gera cerimônia mostrando:
- Vencedores de cada badge especial
- Estatísticas engraçadas (quem falhou mais, etc)
- Galeria das melhores fotos
- Reconhecimentos especiais (último lugar, etc)
- **Nota:** Top 3 do ranking geral NÃO é mostrado (baseado em feedback)

#### Pós-Operação
- Operação fica visível por 7 dias
- Agentes podem:
  - Salvar fotos favoritas
  - Criar nova operação com mesmos membros
- Após 7 dias: operação é deletada permanentemente

---

## 4. Estrutura de Dados

### 4.1 Banco de Missões

#### Distribuição Total
- **500 missões** no banco inicial
- 100 missões por categoria

#### Distribuição por Dificuldade (em cada categoria)
- 40 Fáceis (40%)
- 40 Médias (40%)
- 20 Difíceis (20%)

#### Estrutura de Cada Missão
```javascript
{
  id: string,
  categoria: "vigilancia" | "coleta" | "infiltracao" | "disfarce" | "reconhecimento",
  titulo: string,              // Ex: "Operação Café Clandestino"
  objetivo: string,            // Ex: "Capture alguém tomando café sem ser notado"
  dificuldade: "facil" | "media" | "dificil",
  pontos: 10 | 20 | 30
}
```

#### Exemplos de Missões Selecionadas

**VIGILÂNCIA (9 missões base)**

Fáceis:
- Operação Café Clandestino - Capture alguém tomando café sem ser notado
- Operação Sapato Suspeito - Fotografe discretamente um sapato incomum/interessante
- Operação Janela Indiscreta - Capture alguém através de uma janela

Médias:
- Operação Conversa Paralela - Fotografe duas pessoas conversando sem que nenhuma perceba
- Operação Leitura Clandestina - Capture alguém lendo com o conteúdo visível
- Operação Reunião Secreta - Fotografe um grupo de 4+ pessoas reunidas

Difíceis:
- Operação Emoção Capturada - Capture alguém em momento emocional (rindo muito, chorando, surpreso)
- Operação Sincronização Total - Capture 5+ pessoas fazendo exatamente a mesma coisa
- Operação Confluência - Fotografe 3 conversas diferentes acontecendo simultaneamente

**COLETA DE PROVAS (9 missões base)**

Fáceis:
- Operação Objeto Inédito - Fotografe objeto que nenhum agente da operação tenha visto antes
- Operação Cor Dominante - Capture algo completamente vermelho
- Operação Relíquia - Capture algo claramente antigo/vintage

Médias:
- Operação Elementos Naturais - Capture água, fogo, terra e ar na mesma foto
- Operação Alfabeto Oculto - Fotografe objeto/lugar que forme uma letra clara (V, T, X, etc)
- Operação Fora do Lugar - Fotografe algo que não deveria estar onde está

Difíceis:
- Operação Impossibilidade - Fotografe algo que desafie a lógica/gravidade/expectativa
- Operação Milagre Urbano - Encontre natureza prosperando em concreto/ambiente artificial
- Operação Achado Arqueológico - Encontre objeto de pelo menos 50 anos em uso ativo

**INFILTRAÇÃO (9 missões base)**

Fáceis:
- Operação Fila Infiltrada - Tire foto sua em uma fila com 5+ pessoas
- Operação Pós-horário - Fotografe-se em local público após 22h
- Operação Espelho Alheio - Tire selfie em espelho/vitrine de estabelecimento

Médias:
- Operação Teto Alto - Tire foto sua dentro de prédio com pé-direito altíssimo
- Operação Horário Vazio - Fotografe-se em lugar normalmente cheio, mas vazio
- Operação Natureza Urbana - Fotografe-se em área verde dentro da cidade

Difíceis:
- Operação Amanhecer Urbano - Fotografe-se em local público entre 5h-6h da manhã
- Operação Atividade Incomum - Participe e fotografe-se fazendo atividade que nunca fez
- Operação Marco Zero - Fotografe-se em monumento/ponto turístico da sua cidade

**DISFARCE (9 missões base)**

Fáceis:
- Operação Acessório Inusitado - Tire foto sua usando chapéu, óculos ou lenço que não usa normalmente
- Operação Contraste - Use duas peças de estilos totalmente opostos juntas
- Operação Listras Verticais - Fotografe-se usando algo listrado

Médias:
- Operação Monocromático - Vista-se todo de uma cor só (head to toe)
- Operação Época Errada - Use roupa formal em contexto casual (ou vice-versa)
- Operação Excesso - Use algo exageradamente grande ou pequeno demais

Difíceis:
- Operação Transformação Total - Mude completamente visual (cabelo, roupa, maquiagem, postura)
- Operação Subcultural - Adote visual de subcultura que não é a sua
- Operação Invisibilidade Social - Vista-se tão genérico que ninguém te notaria

**RECONHECIMENTO (9 missões base)**

Fáceis:
- Operação Detalhe Arquitetônico - Fotografe detalhe de construção que a maioria não nota
- Operação Grafite Secreto - Fotografe arte de rua/grafite em local inesperado
- Operação Vista Privilegiada - Encontre local com vista única e fotografe

Médias:
- Operação Simetria Urbana - Encontre construção/local perfeitamente simétrico
- Operação Evidência Histórica - Encontre marca/vestígio de que algo existiu ali antes
- Operação Ponto de Encontro - Identifique local perfeito para reunião secreta

Difíceis:
- Operação Marca Secreta - Encontre símbolo/marca deixado propositalmente
- Operação Código Visual - Descubra padrão/mensagem escondida em fachada/construção
- Operação Tempo Esquecido - Fotografe relógio/marca de tempo parado/errado

### 4.2 Modelos de Dados

#### User
```javascript
{
  id: uuid,
  google_id: string,
  username: string,
  avatar_url: string,
  created_at: timestamp,
  // Stats persistentes
  total_missions_completed: number,
  total_operations: number,
  badges_earned: array,
  rank: string // Patente do agente
}
```

#### Operation
```javascript
{
  id: uuid,
  name: string,
  creator_id: uuid,
  duration_days: 7 | 14 | 30,
  daily_reset_hour: number, // 0-23
  status: "inactive" | "active" | "completed",
  started_at: timestamp,
  ends_at: timestamp,
  created_at: timestamp
}
```

#### OperationMember
```javascript
{
  id: uuid,
  operation_id: uuid,
  user_id: uuid,
  role: "creator" | "member",
  joined_at: timestamp,
  total_points: number
}
```

#### Mission (Template)
```javascript
{
  id: uuid,
  category: string,
  title: string,
  objective: string,
  difficulty: "easy" | "medium" | "hard",
  points: number
}
```

#### DailyMissionPool
```javascript
{
  id: uuid,
  operation_id: uuid,
  day_number: number,
  missions: array, // IDs das missões sorteadas
  created_at: timestamp
}
```

#### AssignedMission
```javascript
{
  id: uuid,
  operation_id: uuid,
  user_id: uuid,
  mission_id: uuid,
  day_number: number,
  category_assigned: string, // Categoria sorteada para o agente
  status: "available" | "selected" | "completed" | "failed" | "rejected",
  selected_at: timestamp,
  submitted_at: timestamp,
  photo_url: string,
  caption: string
}
```

#### Vote
```javascript
{
  id: uuid,
  mission_submission_id: uuid,
  voter_id: uuid,
  vote: "approve" | "reject",
  created_at: timestamp
}
```

#### Reaction
```javascript
{
  id: uuid,
  mission_submission_id: uuid,
  user_id: uuid,
  reaction_type: "funny" | "creative" | "precise" | "bold" | "gross",
  created_at: timestamp
}
```

---

## 5. Funcionalidades Detalhadas

### 5.1 Telas Principais

#### Home/Feed
- Lista de operações ativas do usuário (max 1)
- Botão "Criar Nova Operação"
- Botão "Entrar em Operação" (via código/link)

#### Tela da Operação (durante atividade)
Seções:
- **Missão do Dia:** Pool de 9 missões disponíveis
- **Feed:** Missões submetidas pelos agentes
- **Ranking:** Pontuação ao vivo
- **Badges:** Liderança de cada badge

#### Perfil Pessoal
- Avatar e username
- Patente/nível
- Stats gerais:
  - Total de operações completadas
  - Total de missões completadas
  - Taxa de sucesso
- Badges permanentes acumulados
- Galeria de fotos favoritas salvas

### 5.2 Notificações

Sistema deve enviar:
- **Diária:** Nova missão disponível (no horário da virada)
- **Lembrete:** Missão não feita (X horas antes da virada)
- **Social:** Quando alguém posta missão na operação
- **Validação:** Quando sua missão é aprovada/rejeitada

### 5.3 Ações de Moderação

#### Criador da Operação pode:
- Expulsar agente inativo
- Transferir liderança
- Cancelar operação (requer confirmação)

#### Todos os Agentes podem:
- Sair da operação a qualquer momento
- Reportar missão como inapropriada (vai para criador)

### 5.4 Sistema de Patentes (Progressão Persistente)

Baseado em missões completadas totais:
- **Recruta:** 0-10 missões
- **Agente:** 11-30 missões
- **Agente Sênior:** 31-60 missões
- **Operador:** 61-100 missões
- **Veterano:** 101-200 missões
- **Lenda:** 201+ missões

Patente é visível no perfil e persiste entre operações.

---

## 6. Regras e Políticas

### 6.1 Regras de Convivência
- Missões devem ser divertidas, não prejudiciais
- Proibido conteúdo ofensivo, sexual ou ilegal
- Respeitar privacidade de terceiros nas fotos
- Validação deve ser justa e baseada nos critérios

### 6.2 Política de Fotos
- Foto deve mostrar claramente o cumprimento da missão
- Não pode ser editada significativamente (filtros leves ok)
- Deve ter sido tirada durante o período da operação
- Não pode ser reaproveitada de missões anteriores

### 6.3 Consequências
- Missão rejeitada: sem pontos, marca no histórico
- Comportamento abusivo: expulsão da operação (decisão do criador)
- Reincidência grave: potencial ban da conta (moderação futura)

---

## 7. Identidade Visual e Tom

### 7.1 Estética
- **Inspiração:** Filmes de espião anos 60/70 (estética retrô)
- **Paleta:** Tons escuros com acentos vibrantes
- **Tipografia:** Mix de clássica (títulos) e moderna (corpo)

### 7.2 Tom de Voz
- **Mix de sério + engraçado**
- Usa termos de espião clássico (agente, operação, missão, intel)
- Adiciona humor absurdo em descrições
- Exemplos:
  - ✓ "Missão aceita, agente. O relógio está correndo."
  - ✓ "Intel confirmada. Sua evidência fotográfica foi aprovada pela central."
  - ✓ "Operação falhou. Melhor sorte na próxima infiltração."

### 7.3 Elementos Sonoros
- Sons de código morse/rádio para notificações
- Efeitos discretos (modo stealth)

---

## 8. Roadmap de Desenvolvimento

### 8.1 MVP (Fase 1)
**Funcionalidades Essenciais:**
- Autenticação com Google
- Criação e entrada em operações
- Sistema de missões diárias com sorteio
- Pool compartilhado de missões
- Postagem de fotos
- Sistema de votação (aprovar/rejeitar)
- Ranking ao vivo
- Perfil básico
- Notificações push

### 8.2 Fase 2
**Aprimoramentos:**
- Sistema de reações e badges
- Cerimônia de encerramento automática
- Galeria de fotos favoritas
- Stats detalhadas no perfil
- Sistema de patentes

### 8.3 Fase 3
**Expansão:**
- Mais missões no banco (1000+)
- Temas/modos especiais de operação
- Compartilhamento externo limitado
- Achievements e conquistas extras

### 8.4 Futuro (Ideias)
- Missões geradas por IA personalizadas
- Modo público/competições abertas
- Integração com redes sociais
- Missões em vídeo curto

---

## 9. Métricas de Sucesso

### 9.1 Engagement
- Taxa de conclusão de missões por dia
- Tempo médio em operação ativa
- Taxa de retorno (operações subsequentes)

### 9.2 Social
- Número médio de votos por missão
- Taxa de aprovação de missões
- Engajamento com reações

### 9.3 Retenção
- D1, D7, D30 retention
- Número de operações por usuário
- Taxa de conclusão de operações

---

## 10. Considerações Técnicas

### 10.1 Stack Tecnológico
- **Frontend:** React/Next.js (PWA)
- **Backend:** Supabase
  - Database: PostgreSQL
  - Auth: Google OAuth
  - Storage: Fotos de missões
  - Realtime: Feed updates
- **Hospedagem:** Vercel ou similar

### 10.2 Funcionalidades PWA
- Instalável no home screen
- Notificações push
- Funcionamento offline básico (visualização)
- Cache de imagens

### 10.3 Otimizações Mobile
- Compressão de imagens
- Lazy loading
- Infinite scroll no feed
- Gestos touch-friendly

### 10.4 Segurança
- Row Level Security (Supabase)
- Validação de upload de imagens
- Rate limiting em ações sensíveis
- Moderação de conteúdo (futuro)

---

## 11. FAQ Técnico

**Q: Como funciona o sorteio de missões?**
A: A cada virada do dia, para cada agente: (1) sorteia categoria aleatória, (2) busca 3 missões fáceis + 3 médias + 3 difíceis daquela categoria, (3) adiciona ao pool compartilhado da operação.

**Q: O que acontece se o pool esvaziar antes da virada?**
A: Improvável com a fórmula (agentes × 9) + 5. Se ocorrer, pool é reabastecido automaticamente.

**Q: Missões podem repetir entre dias?**
A: Sim, cada dia é um sorteio independente.

**Q: Como evitar que agentes colem fotos antigas?**
A: Validação social + futuro: verificação de metadata de foto (timestamp).

**Q: E se alguém entrar na operação depois de iniciada?**
A: Entra normalmente mas perde os dias anteriores (sem missões retroativas).

---

## 12. Glossário

- **Agente:** Usuário/jogador
- **Operação:** Competição entre grupo de amigos
- **Missão:** Desafio fotográfico individual
- **Pool:** Conjunto de missões disponíveis para escolha
- **Virada:** Momento diário de reset (novo pool)
- **Feed:** Lista de missões submetidas
- **Badge:** Conquista especial baseada em reações
- **Patente:** Nível persistente do usuário

---

## 13. Anexos

### 13.1 Wireframes
[A serem desenvolvidos]

### 13.2 Fluxogramas
[A serem desenvolvidos]

### 13.3 Banco Completo de Missões
[500 missões a serem geradas baseadas nos 45 exemplos aprovados]

---

**Versão:** 1.0  
**Data:** Fevereiro 2026  
**Status:** Aprovado para desenvolvimento
