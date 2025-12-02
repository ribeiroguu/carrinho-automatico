-- =====================================================
-- CARRINHO AUTOMÁTICO RFID - BIBLIOTECA IFNMG
-- Schema do Banco de Dados (Supabase/PostgreSQL)
-- VERSÃO 2: matricula e rfid_tag como PRIMARY KEYS
-- =====================================================

-- =====================================================
-- TABELA: usuarios
-- PK: matricula (identificador único do aluno)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  matricula VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  curso VARCHAR(100),
  dias_bloqueado INTEGER DEFAULT 0,
  data_fim_bloqueio DATE,
  push_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA: livros
-- PK: rfid_tag (tag RFID única do livro físico)
-- =====================================================
CREATE TABLE IF NOT EXISTS livros (
  rfid_tag VARCHAR(50) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  capa_url TEXT,
  categoria VARCHAR(100),
  sinopse TEXT,
  status VARCHAR(20) DEFAULT 'disponivel',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA: emprestimos
-- =====================================================
CREATE TABLE IF NOT EXISTS emprestimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_matricula VARCHAR(50) REFERENCES usuarios(matricula) ON DELETE CASCADE,
  livro_rfid VARCHAR(50) REFERENCES livros(rfid_tag) ON DELETE CASCADE,
  data_retirada TIMESTAMP DEFAULT NOW(),
  data_prevista TIMESTAMP NOT NULL,
  data_devolucao TIMESTAMP,
  renovacoes INTEGER DEFAULT 0,
  atrasado BOOLEAN DEFAULT FALSE,
  dias_atraso INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA: favoritos
-- =====================================================
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_matricula VARCHAR(50) REFERENCES usuarios(matricula) ON DELETE CASCADE,
  livro_rfid VARCHAR(50) REFERENCES livros(rfid_tag) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_matricula, livro_rfid)
);

-- =====================================================
-- TABELA: carrinho_sessao
-- =====================================================
CREATE TABLE IF NOT EXISTS carrinho_sessao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_matricula VARCHAR(50) REFERENCES usuarios(matricula) ON DELETE CASCADE,
  livro_rfid VARCHAR(50) REFERENCES livros(rfid_tag) ON DELETE CASCADE,
  sessao_id VARCHAR(100) NOT NULL,
  data_leitura TIMESTAMP DEFAULT NOW(),
  finalizado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_emprestimos_usuario ON emprestimos(usuario_matricula);
CREATE INDEX IF NOT EXISTS idx_emprestimos_livro ON emprestimos(livro_rfid);
CREATE INDEX IF NOT EXISTS idx_emprestimos_ativo ON emprestimos(usuario_matricula, data_devolucao) WHERE data_devolucao IS NULL;
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_matricula);
CREATE INDEX IF NOT EXISTS idx_favoritos_livro ON favoritos(livro_rfid);
CREATE INDEX IF NOT EXISTS idx_carrinho_sessao ON carrinho_sessao(sessao_id);
CREATE INDEX IF NOT EXISTS idx_livros_status ON livros(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- =====================================================
-- FUNCTION: Calcular dias de atraso e aplicar multa
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_atraso_e_multa()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o empréstimo está atrasado
  IF NEW.data_devolucao IS NULL AND NOW() > NEW.data_prevista THEN
    NEW.atrasado := TRUE;
    NEW.dias_atraso := EXTRACT(DAY FROM (NOW() - NEW.data_prevista));
    
    -- Aplica multa no usuário (1 dia de bloqueio por dia de atraso)
    UPDATE usuarios 
    SET 
      dias_bloqueado = dias_bloqueado + NEW.dias_atraso,
      data_fim_bloqueio = NOW() + (NEW.dias_atraso || ' days')::INTERVAL
    WHERE matricula = NEW.usuario_matricula;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_atraso ON emprestimos;
CREATE TRIGGER trigger_calcular_atraso
BEFORE UPDATE ON emprestimos
FOR EACH ROW
EXECUTE FUNCTION calcular_atraso_e_multa();

-- =====================================================
-- FUNCTION: Atualizar status do livro
-- =====================================================
CREATE OR REPLACE FUNCTION atualizar_status_livro()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Livro emprestado
    IF NEW.data_devolucao IS NULL THEN
      UPDATE livros SET status = 'emprestado' WHERE rfid_tag = NEW.livro_rfid;
    -- Livro devolvido
    ELSE
      UPDATE livros SET status = 'disponivel' WHERE rfid_tag = NEW.livro_rfid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_status_livro ON emprestimos;
CREATE TRIGGER trigger_status_livro
AFTER INSERT OR UPDATE ON emprestimos
FOR EACH ROW
EXECUTE FUNCTION atualizar_status_livro();

-- =====================================================
-- DADOS DE TESTE - LIVROS
-- =====================================================
INSERT INTO livros (rfid_tag, titulo, autor, capa_url, categoria, sinopse, status) VALUES
('RF001A2B3C4D', 'Dom Casmurro', 'Machado de Assis', 'https://m.media-amazon.com/images/I/81XpG2iKTlL._AC_UF1000,1000_QL80_.jpg', 'Literatura Brasileira', 'Bento Santiago, conhecido como Dom Casmurro, narra em primeira pessoa sua história de amor com Capitu, amiga de infância que se torna sua esposa. Atormentado pelo ciúme e pela suspeita de uma possível traição envolvendo seu melhor amigo Escobar, Bentinho reconstrói suas memórias tentando provar a culpa de Capitu.', 'disponivel'),
('RF002B3C4D5E', '1984', 'George Orwell', 'https://www3.unicentro.br/petfisica/wp-content/uploads/sites/54/2015/07/1984-e1660882586968.jpg', 'Ficção Distópica', 'Em um futuro sombrio, Winston Smith vive em Oceânia, um estado totalitário governado pelo Partido e seu líder onipresente, o Grande Irmão. Toda a sociedade é vigiada por teletelas, a história é constantemente reescrita e até os pensamentos são controlados pela Polícia do Pensamento.', 'disponivel'),
('RF003C4D5E6F', 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'https://m.media-amazon.com/images/I/71LJ4k-k9hL.jpg', 'Infantojuvenil', 'Um piloto cai com seu avião no deserto do Saara e encontra um pequeno príncipe vindo de um asteroide distante. O menino conta sobre sua jornada por diversos planetas, onde conheceu personagens peculiares.', 'disponivel'),
('RF004D5E6F7G', 'Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'https://static.wixstatic.com/media/742ca6_feaa7d7894b0460cb61e93ea47684b8a~mv2.png/v1/fill/w_568,h_816,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/742ca6_feaa7d7894b0460cb61e93ea47684b8a~mv2.png', 'Fantasia', 'Harry Potter vive uma vida miserável com seus tios trouxas, os Dursley, até descobrir em seu décimo primeiro aniversário que é um bruxo famoso no mundo mágico.', 'disponivel'),
('RF005E6F7G8H', 'O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', 'https://br.web.img3.acsta.net/medias/nmedia/18/92/91/32/20224832.jpg', 'Fantasia', 'Frodo Bolseiro herda de seu tio Bilbo um anel mágico que se revela ser o Um Anel, forjado pelo Senhor do Escuro Sauron para dominar todos os povos da Terra Média.', 'disponivel'),
('RF006F7G8H9I', 'Fundamentos de Programação', 'Ana Fernandes, Leila Figueiredo', 'https://0.academia-photos.com/attachment_thumbnails/62182717/mini_magick20200224-2903-10xovdy.png?1582547469', 'Informática', 'Livro didático sobre os fundamentos da programação de computadores, abordando lógica, algoritmos e estruturas de dados básicas.', 'disponivel'),
('RF007G8H9I0J', 'Cálculo Vol. 1', 'James Stewart', 'https://m.media-amazon.com/images/I/719faYrlEdL._AC_UF1000,1000_QL80_.jpg', 'Matemática', 'Apresenta os conceitos fundamentais do cálculo diferencial e integral de forma clara e acessível, com inúmeros exemplos e exercícios.', 'disponivel'),
('RF008H9I0J1K', 'Física I: Mecânica', 'Hugh D. Young, Roger A. Freedman', 'https://m.media-amazon.com/images/I/91E17iFn6VL._UF1000,1000_QL80_.jpg', 'Física', 'Aborda os princípios fundamentais da mecânica clássica, incluindo cinemática, dinâmica, trabalho e energia, e conservação do momento.', 'disponivel'),
('RF009I0J1K2L', 'Introdução à Administração', 'Idalberto Chiavenato', 'https://cdn.awsli.com.br/600x1000/2554/2554148/produto/199536624/introducao_a_teoria_geral_da_administracao-campus-euskwg.jpg', 'Administração', 'Visão geral dos conceitos e práticas da administração moderna, abrangendo planejamento, organização, direção e controle.', 'disponivel'),
('RF010J1K2L3M', 'História do Brasil', 'Boris Fausto', 'https://m.media-amazon.com/images/I/81ahmH7CueL._AC_UF1000,1000_QL80_.jpg', 'História', 'Uma análise abrangente da história do Brasil, desde o período colonial até os dias atuais, explorando aspectos políticos, econômicos e sociais.', 'disponivel'),
('RF011K2L3M4N', 'Química Geral', 'John C. Kotz, Paul M. Treichel', 'https://image.isu.pub/160608135708-995fd8ccdb9d4007b47ebd16252e747f/jpg/page_1_social_preview.jpg', 'Química', 'Fundamentos da química geral, incluindo estrutura atômica, ligações químicas, estequiometria e termoquímica.', 'disponivel'),
('RF012L3M4N5O', 'Algoritmos e Estruturas de Dados', 'Thomas H. Cormen', 'https://m.media-amazon.com/images/I/817pJNbxSXL._AC_UF1000,1000_QL80_.jpg', 'Informática', 'Referência completa sobre algoritmos e estruturas de dados, com análise de complexidade e implementações práticas.', 'disponivel'),
('RF013M4N5O6P', 'Clean Code', 'Robert C. Martin', 'https://m.media-amazon.com/images/I/71nj3JM-igL.jpg', 'Informática', 'Guia prático para escrever código limpo, legível e manutenível, com princípios e técnicas de desenvolvimento de software.', 'disponivel'),
('RF014N5O6P7Q', 'O Cortiço', 'Aluísio Azevedo', 'https://m.media-amazon.com/images/I/91UuA2jnZDL._UF1000,1000_QL80_.jpg', 'Literatura Brasileira', 'Romance naturalista que retrata a vida em um cortiço no Rio de Janeiro do século XIX, explorando temas sociais e humanos.', 'disponivel'),
('RF015O6P7Q8R', 'Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'https://imgv2-2-f.scribdassets.com/img/word_document/464258747/original/216x287/13a049c62a/1763673414?v=1', 'Literatura Brasileira', 'Narrado por um defunto autor, este romance revolucionou a literatura brasileira com sua estrutura inovadora e crítica social mordaz.', 'disponivel')
ON CONFLICT (rfid_tag) DO NOTHING;

-- =====================================================
-- DADOS DE TESTE - USUÁRIO EXEMPLO
-- =====================================================
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (matricula, nome, email, senha_hash, curso) VALUES
('2023001', 'João da Silva', 'joao.silva@ifnmg.edu.br', '$2b$10$rjCxZXqKf8dY9ZPNmXnz5.VkF9YPZr8XkU0nYNzHvMQGYhWxYNMFu', 'Técnico em Informática')
ON CONFLICT (matricula) DO NOTHING;

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
