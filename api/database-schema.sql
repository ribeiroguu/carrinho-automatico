-- =====================================================
-- CARRINHO AUTOMÁTICO RFID - BIBLIOTECA IFNMG
-- Schema do Banco de Dados (Supabase/PostgreSQL)
-- =====================================================

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
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
-- =====================================================
CREATE TABLE IF NOT EXISTS livros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  rfid_tag VARCHAR(50) UNIQUE NOT NULL,
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
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  livro_id UUID REFERENCES livros(id) ON DELETE CASCADE,
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
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  livro_id UUID REFERENCES livros(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, livro_id)
);

-- =====================================================
-- TABELA: carrinho_sessao
-- =====================================================
CREATE TABLE IF NOT EXISTS carrinho_sessao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  livro_id UUID REFERENCES livros(id) ON DELETE CASCADE,
  sessao_id VARCHAR(100) NOT NULL,
  data_leitura TIMESTAMP DEFAULT NOW(),
  finalizado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_emprestimos_usuario ON emprestimos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_livro ON emprestimos(livro_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_ativo ON emprestimos(usuario_id, data_devolucao) WHERE data_devolucao IS NULL;
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_sessao ON carrinho_sessao(sessao_id);
CREATE INDEX IF NOT EXISTS idx_livros_rfid ON livros(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_livros_status ON livros(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);
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
    WHERE id = NEW.usuario_id;
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
      UPDATE livros SET status = 'emprestado' WHERE id = NEW.livro_id;
    -- Livro devolvido
    ELSE
      UPDATE livros SET status = 'disponivel' WHERE id = NEW.livro_id;
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
INSERT INTO livros (titulo, autor, rfid_tag, capa_url, categoria, sinopse, status) VALUES
('Dom Casmurro', 'Machado de Assis', 'RF001A2B3C4D', 'https://m.media-amazon.com/images/I/81XpG2iKTlL._AC_UF1000,1000_QL80_.jpg', 'Literatura Brasileira', 'Bento Santiago, conhecido como Dom Casmurro, narra em primeira pessoa sua história de amor com Capitu, amiga de infância que se torna sua esposa. Atormentado pelo ciúme e pela suspeita de uma possível traição envolvendo seu melhor amigo Escobar, Bentinho reconstrói suas memórias tentando provar a culpa de Capitu.', 'disponivel'),
('1984', 'George Orwell', 'RF002B3C4D5E', 'https://www3.unicentro.br/petfisica/wp-content/uploads/sites/54/2015/07/1984-e1660882586968.jpg', 'Ficção Distópica', 'Em um futuro sombrio, Winston Smith vive em Oceânia, um estado totalitário governado pelo Partido e seu líder onipresente, o Grande Irmão. Toda a sociedade é vigiada por teletelas, a história é constantemente reescrita e até os pensamentos são controlados pela Polícia do Pensamento.', 'disponivel'),
('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'RF003C4D5E6F', 'https://m.media-amazon.com/images/I/71LJ4k-k9hL.jpg', 'Infantojuvenil', 'Um piloto cai com seu avião no deserto do Saara e encontra um pequeno príncipe vindo de um asteroide distante. O menino conta sobre sua jornada por diversos planetas, onde conheceu personagens peculiares.', 'disponivel'),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'RF004D5E6F7G', 'https://static.wixstatic.com/media/742ca6_feaa7d7894b0460cb61e93ea47684b8a~mv2.png/v1/fill/w_568,h_816,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/742ca6_feaa7d7894b0460cb61e93ea47684b8a~mv2.png', 'Fantasia', 'Harry Potter vive uma vida miserável com seus tios trouxas, os Dursley, até descobrir em seu décimo primeiro aniversário que é um bruxo famoso no mundo mágico.', 'disponivel'),
('O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', 'RF005E6F7G8H', 'https://br.web.img3.acsta.net/medias/nmedia/18/92/91/32/20224832.jpg', 'Fantasia', 'Frodo Bolseiro herda de seu tio Bilbo um anel mágico que se revela ser o Um Anel, forjado pelo Senhor do Escuro Sauron para dominar todos os povos da Terra Média.', 'disponivel'),
('Fundamentos de Programação', 'Ana Fernandes, Leila Figueiredo', 'RF006F7G8H9I', 'https://0.academia-photos.com/attachment_thumbnails/62182717/mini_magick20200224-2903-10xovdy.png?1582547469', 'Informática', 'Livro didático sobre os fundamentos da programação de computadores, abordando lógica, algoritmos e estruturas de dados básicas.', 'disponivel'),
('Cálculo Vol. 1', 'James Stewart', 'RF007G8H9I0J', 'https://m.media-amazon.com/images/I/719faYrlEdL._AC_UF1000,1000_QL80_.jpg', 'Matemática', 'Apresenta os conceitos fundamentais do cálculo diferencial e integral de forma clara e acessível, com inúmeros exemplos e exercícios.', 'disponivel'),
('Física I: Mecânica', 'Hugh D. Young, Roger A. Freedman', 'RF008H9I0J1K', 'https://m.media-amazon.com/images/I/91E17iFn6VL._UF1000,1000_QL80_.jpg', 'Física', 'Aborda os princípios fundamentais da mecânica clássica, incluindo cinemática, dinâmica, trabalho e energia, e conservação do momento.', 'disponivel'),
('Introdução à Administração', 'Idalberto Chiavenato', 'RF009I0J1K2L', 'https://cdn.awsli.com.br/600x1000/2554/2554148/produto/199536624/introducao_a_teoria_geral_da_administracao-campus-euskwg.jpg', 'Administração', 'Visão geral dos conceitos e práticas da administração moderna, abrangendo planejamento, organização, direção e controle.', 'disponivel'),
('História do Brasil', 'Boris Fausto', 'RF010J1K2L3M', 'https://m.media-amazon.com/images/I/81ahmH7CueL._AC_UF1000,1000_QL80_.jpg', 'História', 'Uma análise abrangente da história do Brasil, desde o período colonial até os dias atuais, explorando aspectos políticos, econômicos e sociais.', 'disponivel'),
('Química Geral', 'John C. Kotz, Paul M. Treichel', 'RF011K2L3M4N', 'https://image.isu.pub/160608135708-995fd8ccdb9d4007b47ebd16252e747f/jpg/page_1_social_preview.jpg', 'Química', 'Fundamentos da química geral, incluindo estrutura atômica, ligações químicas, estequiometria e termoquímica.', 'disponivel'),
('Algoritmos e Estruturas de Dados', 'Thomas H. Cormen', 'RF012L3M4N5O', 'https://m.media-amazon.com/images/I/817pJNbxSXL._AC_UF1000,1000_QL80_.jpg', 'Informática', 'Referência completa sobre algoritmos e estruturas de dados, com análise de complexidade e implementações práticas.', 'disponivel'),
('Clean Code', 'Robert C. Martin', 'RF013M4N5O6P', 'https://m.media-amazon.com/images/I/71nj3JM-igL.jpg', 'Informática', 'Guia prático para escrever código limpo, legível e manutenível, com princípios e técnicas de desenvolvimento de software.', 'disponivel'),
('O Cortiço', 'Aluísio Azevedo', 'RF014N5O6P7Q', 'https://m.media-amazon.com/images/I/91UuA2jnZDL._UF1000,1000_QL80_.jpg', 'Literatura Brasileira', 'Romance naturalista que retrata a vida em um cortiço no Rio de Janeiro do século XIX, explorando temas sociais e humanos.', 'disponivel'),
('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'RF015O6P7Q8R', 'https://imgv2-2-f.scribdassets.com/img/word_document/464258747/original/216x287/13a049c62a/1763673414?v=1', 'Literatura Brasileira', 'Narrado por um defunto autor, este romance revolucionou a literatura brasileira com sua estrutura inovadora e crítica social mordaz.', 'disponivel')
ON CONFLICT (rfid_tag) DO NOTHING;

-- =====================================================
-- DADOS DE TESTE - USUÁRIO EXEMPLO
-- =====================================================
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, matricula, email, senha_hash, curso) VALUES
('João da Silva', '2023001', 'joao.silva@ifnmg.edu.br', '$2b$10$rjCxZXqKf8dY9ZPNmXnz5.VkF9YPZr8XkU0nYNzHvMQGYhWxYNMFu', 'Técnico em Informática')
ON CONFLICT (matricula) DO NOTHING;

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
