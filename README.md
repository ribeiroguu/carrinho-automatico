# Carrinho automático com RFID

## 1. Introdução

### 1.1. Propósito do Documento
Este DRP descreve os requisitos do sistema para o desenvolvimento de um Carrinho de Compras Eletrônico com Identificação por Radiofrequência (RFID). O objetivo principal do projeto é criar um protótipo de carrinho que, ao ser preenchido com livros marcados com etiquetas RFID, os identifique automaticamente, adicione-os a uma lista de compras e exiba as informações em uma tela.

## 2. Requisitos do Sistema

### 2.1. Requisitos Funcionais
- RF1: O sistema deve ser capaz de ler as etiquetas RFID de cada livro adicionado ao carrinho.
- RF2: O sistema deve adicionar um livro à lista de compras.
- RF3: O sistema deve ser capaz de remover um livro da lista de compras quando ele for retirado do carrinho.
- RF4: O sistema deve enviar os dados dos livros lidos (UID da etiqueta) via Wi-Fi para o servidor externo.
- RF5: O sistema deve receber dados do servidor (nome e preço do livro) com base no UID enviado.
- RF6: O sistema deve exibir na tela o nome do livro e o preço.
- RF7: O sistema deve atualizar o subtotal da compra na interface web em tempo real à medida que os livros são adicionados ou removidos.
- RF8: A interface web deve ser capaz de exibir a lista completa de livros no carrinho e o valor total.
- RF9: O sistema deve exibir uma mensagem de erro na tela do carrinho caso a conexão Wi-Fi seja perdida ou a leitura da etiqueta falhe.
- RF10: O sistema deve incluir um botão de "reset" para limpar a lista de compras no carrinho e no sistema externo.

### 2.2. Requisitos Não-Funcionais
- Desempenho:
  - RNF1: O tempo de resposta entre a leitura de uma etiqueta e a atualização da interface web deve ser inferior a 3 segundos.
  - RNF2: O leitor RFID deve ter um alcance de leitura de, no mínimo, 5 cm.
- Usabilidade:
  - RNF3: A interface web deve ser intuitiva e responsiva, exibindo as informações de forma clara em diferentes dispositivos.
  - RNF4: A tela do carrinho deve ser simples, exibindo o status da conexão Wi-Fi e as informações básicas dos livros.
- Confiabilidade:
  - RNF5: O sistema deve ser capaz de operar por, no mínimo, 4 horas com uma única carga da bateria.
  - RNF6: A conexão Wi-Fi entre o ESP32 e o roteador deve ser estável e segura.
- Segurança:
  - RNF7: A comunicação entre o ESP32 e o servidor externo deve ser protegida por protocolos básicos de segurança (por exemplo, HTTPs, se possível).

## 3. Arquitetura do Sistema

### 3.1. Visão Geral da Arquitetura
A arquitetura do sistema será composta por quatro módulos principais, que se comunicarão via Wi-Fi:
- Módulo de Entrada (Hardware - Carrinho): Inclui o carrinho, o leitor RFID e a placa de processamento ESP32.
- Módulo de Saída (Hardware - Carrinho): A tela LCD que exibirá as informações básicas.
- Módulo de Processamento (Sistema Externo): O servidor web que gerenciará a lógica da aplicação e a comunicação com o banco de dados.
- Módulo de Armazenamento e Interface (Sistema Externo): O banco de dados para registro de livros e a interface web para visualização dos dados.

### 3.2. Componentes de Hardware
- Placa de Processamento: O ESP32 será a placa principal, escolhida por sua capacidade de processamento e, principalmente, por sua integração nativa com Wi-Fi.
- Leitor RFID: Um módulo leitor-gravador que se comunicará com o ESP32.
- Tela LCD: Um display para a interface do carrinho, como uma tela LCD 16x2.
- Fonte de Energia: Bateria recarregável.

### 3.3. Componentes de Software
- Firmware (ESP32): O código, provavelmente em C++ (usando o framework do Arduino) ou MicroPython, incluirá:
  - Conexão Wi-Fi: Funções para conectar e manter a conexão com uma rede Wi-Fi.
  - Comunicação HTTP: Funções para enviar e receber dados do servidor externo (endpoints da API).
  - Lógica de RFID: Leitura dos UIDs das etiquetas.
  - Gerenciamento da Tela: Funções para atualizar o display LCD.
- Servidor Externo: O servidor receberá as requisições do ESP32, consultará e atualizará o banco de dados e fornecerá os dados para a interface web.
- Banco de Dados: Um banco de dados simples (ex: SQLite, MongoDB local) para armazenar os registros dos livros (UID, nome, preço).
- Interface Web: A interface, desenvolvida com Vite e React, será responsável por:
  - Exibir a lista de itens no carrinho em tempo real.
  - Mostrar o valor total da compra.
  - Oferecer uma interface amigável para visualização dos dados.
