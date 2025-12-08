Quero que você atue como um desenvolvedor especialista em ESP32, HTTP e Arduino IDE.  
Já existe um projeto funcional com ESP32 + RFID RC522 + display OLED + Wi-Fi conectado.

**Primeiro passo obrigatório:**

1. Analise cuidadosamente o código já existente no arquivo principal (por exemplo, `main.ino` ou `esp32_rfid_oled_wifi.ino`) que está na mesma pasta do servidor/arquivo de backend.
2. Descreva, em poucas linhas, como o código atual está organizado (funções principais, onde o UID é lido, onde o Wi-Fi é conectado, etc.).

**Objetivo agora:**  
Adicionar a **comunicação com um servidor HTTP** que está na mesma pasta do projeto (por exemplo, um servidor simples em Node.js, Python ou outro, rodando em uma máquina na mesma rede). Esse servidor deve receber o UID lido pelo ESP32 via requisição HTTP.

### Requisitos gerais

- Use o **protocolo HTTP** (não precisa ser HTTPS por enquanto).[2][4]
- Utilize a biblioteca padrão de cliente HTTP do ESP32 (por exemplo, `HTTPClient.h`).[3][4][2]
- O ESP32 deve fazer **requisições HTTP** para o servidor sempre que um cartão RFID for lido com sucesso.[4][2]

### 1. Análise do código existente

Peça para a IA:

- Ler o código atual e identificar:
  - Onde o UID é obtido (função ou trecho específico).
  - Onde o Wi-Fi é conectado.
  - Como o display OLED mostra as mensagens.
- Sugerir o melhor ponto para chamar uma função do tipo `enviarUIDParaServidor(uid)` sem quebrar a lógica atual.

### 2. Estrutura da função de envio HTTP

Quero que você crie e integre uma função parecida com:

- `void enviarUIDParaServidor(String uid)`
  - Essa função deve:
    - Montar a URL do servidor (por exemplo, `http://<IP_DO_SERVIDOR>:<PORTA>/registro` ou similar, usando `String`).[2][4]
    - Enviar o UID por **HTTP** usando um dos formatos:
      - GET: `http://servidor/registro?uid=<UID>`
      - ou POST com corpo simples em JSON ou texto
    - Usar `HTTPClient` para abrir a conexão, enviar a requisição e ler o código de resposta (status HTTP).[4][2]
    - Imprimir na Serial o status (código de resposta e, se possível, o corpo da resposta).[2][4]
    - Opcional: mostrar no display uma mensagem rápida como “Enviando UID...” e depois “Servidor OK” ou “Falha no servidor”.

### 3. Configuração do servidor e da URL

- Considerar que o servidor está na **mesma pasta do projeto**, ou seja:
  - Existe um arquivo de servidor (por exemplo, `server.js`, `app.py`, etc.) que você deve **mencionar claramente** na explicação, orientando o usuário a configurar o IP e a porta corretos.
  - A IA deve explicar como o usuário pode descobrir o IP da máquina que está rodando o servidor e como colocar esse IP/porta no código do ESP32 (em uma constante, por exemplo `const char* serverURL = "http://192.168.0.10:3000/registro";`).[4][2]

### 4. Integração com o fluxo RFID

- No ponto em que o UID é lido com sucesso (já existente no código), a IA deve:
  - Adicionar a chamada `enviarUIDParaServidor(uidString);`.
  - Garantir que, se o Wi-Fi estiver desconectado, o código não trave; apenas não tenta enviar e mostra uma mensagem de erro na Serial ou no display.[2][4]

### 5. Boas práticas

- Manter o código organizado e legível, com:
  - Constantes para URL/IP do servidor e porta.[2]
  - Função isolada para envio HTTP.[4][2]
- Usar `http.end()` ao final da requisição para liberar recursos.[4][2]
- Evitar `delay()` longos durante a comunicação com o servidor.[2][4]

### 6. Entregáveis esperados

- Código atualizado e completo, com:
  - Inclusão da biblioteca HTTP do ESP32.[3][2]
  - Função `enviarUIDParaServidor(...)` implementada.[4][2]
  - Chamada dessa função integrada ao ponto de leitura de UID.
- Explicação curta após o código, abordando:
  - Onde configurar o IP/porta do servidor.[2][4]
  - Qual tipo de requisição foi usada (GET ou POST) e exemplo de URL ou corpo enviado.[4][2]
  - Como adaptar para outro endpoint ou formato no futuro.

Use comentários em português e nomes de variáveis autoexplicativos, pensando em facilitar manutenção e expansão futura.
