Para adicionar internet ao seu projeto atual com ESP32, RFID RC522 e OLED, você pode usar o prompt abaixo em outra IA para gerar o código atualizado.

---

## Prompt sugerido para adicionar internet

Quero que você atualize um projeto já existente em ESP32 (Arduino IDE) que usa:

- ESP32
- Leitor RFID RC522 (SPI)
- Display OLED 0.96" 128x64 SSD1306 via I2C

O código atual já:

- Inicializa o RC522
- Lê o UID do cartão
- Mostra mensagens e o UID no display OLED
- Imprime o UID na Serial

Agora preciso que você **adicione conexão com a internet (Wi-Fi)** e prepare o código para, no futuro, enviar os dados do cartão para um servidor.

**Requisitos para a conexão com a internet:**

1. Usar o Wi-Fi do próprio ESP32.
   - Incluir as bibliotecas adequadas para Wi-Fi da ESP32.
   - Criar constantes para `WIFI_SSID` e `WIFI_PASSWORD`, de forma que seja fácil trocar depois.

2. Estrutura de conexão Wi-Fi:
   - Criar uma função separada, por exemplo `void conectarWiFi()` ou similar, que:
     - Inicie o Wi-Fi em modo estação.
     - Tente conectar ao roteador, com tentativas e timeout razoáveis.
     - Mostre no display OLED o status da conexão, por exemplo:
       - “Conectando ao Wi-Fi...”
       - “Wi-Fi OK” com o IP obtido, se couber.
       - “Falha no Wi-Fi” em caso de erro.
   - Imprimir também na Serial o status da conexão (tentando conectar, conectado, IP, falha).

3. Integração com a lógica RFID já existente:
   - Garantir que o sistema:
     - Conecte ao Wi-Fi no `setup()`, antes de começar o loop principal de leitura RFID.
     - Continue funcionando normalmente mesmo que o Wi-Fi falhe (ou seja, ainda leia o cartão e mostre no display).
   - Preparar uma função, por exemplo `void enviarUIDParaServidor(String uid)`, que por enquanto apenas:
     - Receba o UID em formato `String`.
     - Simule o envio (por exemplo, imprimindo na Serial e no display uma mensagem “Enviando UID...” ou “Pronto para enviar UID”).
     - Deixe comentários explicando onde, no futuro, será feita a requisição HTTP real (GET/POST) para uma API ou servidor.

4. Boas práticas e organização:
   - Manter o código modular, com as seguintes partes bem separadas:
     - Inicialização do display
     - Inicialização do RFID
     - Conexão Wi-Fi
     - Leitura do cartão
     - Exibição no OLED
     - Função de envio/simulação de envio do UID
   - Evitar bloquear o loop com `delay()` muito longos durante a conexão Wi-Fi. Se usar `delay()`, justificar e manter o tempo razoável.
   - Usar comentários claros em português explicando cada bloco novo relacionado à internet.

5. Comportamento desejado após a integração:
   - Ao ligar o dispositivo:
     - Mostrar no OLED algo como:
       - “Iniciando sistema...”
       - “Conectando ao Wi-Fi...”
       - Depois, “Wi-Fi OK” ou “Wi-Fi falhou”.
   - Quando aproximar um cartão RFID:
     - Continuar mostrando “Cartão detectado” e o UID no OLED.
     - Imprimir o UID na Serial.
     - Chamar a função de envio (`enviarUIDParaServidor(uid)`), que por enquanto apenas registra/loga o envio e mostra uma mensagem breve no display.

6. Entregáveis:
   - Código completo atualizado, pronto para substituir o código antigo, mantendo toda a funcionalidade anterior e adicionando a parte de Wi-Fi.
   - Explicação breve, após o código, descrevendo:
     - Como configurar SSID e senha do Wi-Fi.
     - Como, no futuro, implementar o envio real do UID usando HTTP (por exemplo, apontando em comentários para onde entraria um `HTTPClient` ou similar).

Use um estilo de código organizado, com identação clara, nomes de funções e variáveis autoexplicativos, e comentários em português para facilitar a manutenção e expansão futura.
