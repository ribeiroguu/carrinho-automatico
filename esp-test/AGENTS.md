Quero que você atue como um desenvolvedor especialista em ESP32, RFID RC522 e display OLED SSD1306 via I2C, utilizando Arduino IDE. Gere código limpo, comentado e seguindo boas práticas de programação, com foco em manutenção e expansão futura.

**Contexto do projeto:**

- Placa: ESP32.
- Leitor RFID: módulo RC522 utilizando interface SPI.
- Display: OLED 0.96", resolução 128x64, controlador SSD1306, interface I2C (endereço padrão 0x3C), fundo branco.[1][2][3]
- Objetivo:
  1. Ler o cartão/tag RFID com o RC522.[4][5][6]
  2. Obter o UID do cartão.[6][4]
  3. Exibir o UID (em hexadecimal ou decimal) no display OLED 128x64.[2][1]
  4. Mostrar mensagens claras no display, como “Aproxime o cartão”, “Cartão detectado” e o UID.

**Requisitos para o código:**

1. Usar as bibliotecas mais comuns e estáveis:
   - Para o RC522: `MFRC522.h` com SPI.[4][6]
   - Para o OLED: `Adafruit_GFX.h` e `Adafruit_SSD1306.h` com I2C (endereço 0x3C, mas deixe fácil de mudar).[7][1][2]

2. Estrutura do código:
   - Criar funções separadas para:
     - Inicializar o RFID.
     - Inicializar o display OLED.
     - Ler o cartão RFID e retornar o UID.
     - Mostrar mensagens e UID no display.
   - Incluir comentários explicando:
     - Ligações principais de pinos entre ESP32, RC522 (SPI) e OLED (I2C).[5][8][6]
     - Por que certas constantes ou endereços (como 0x3C) foram escolhidos.[1][2]

3. Boas práticas e expansibilidade:
   - Usar `const` e `#define` para pinos, endereço I2C do display e tamanho de buffer.
   - Evitar lógica “mágica” no `loop()`, mantendo o código organizado em funções reutilizáveis.
   - Deixar claro nos comentários onde, no futuro, será possível:
     - Salvar UIDs autorizados em um array ou estrutura.
     - Integrar com Wi-Fi ou MQTT.[9][10]
     - Adicionar lógica de controle de acesso (por exemplo, liberar uma fechadura).[11][12]

4. Comportamento esperado do programa:
   - Na inicialização, mostrar no OLED uma tela de boas-vindas com o texto “Sistema RFID ESP32” e “Aproxime o cartão”.[2][11][1]
   - No `loop()`:
     - Verificar continuamente se um cartão RFID foi aproximado.[6][4]
     - Quando detectar um cartão:
       - Ler o UID.
       - Imprimir o UID na Serial.[4][6]
       - Limpar o OLED e exibir o texto “Cartão detectado” e o UID embaixo.[11][1][2]
       - Após alguns segundos, voltar a exibir a tela “Aproxime o cartão”.

5. Entregáveis:
   - Código completo em C/C++ compatível com a Arduino IDE para ESP32, pronto para compilação.[9]
   - Comentários em português.
   - Explicação breve, após o código, descrevendo:
     - Quais bibliotecas precisam ser instaladas.[7][2][4]
     - Como ajustar pinos (SPI) e endereço I2C do display, se necessário.[5][1][6]

Use um estilo de código organizado, com identação clara e nomes de variáveis autoexplicativos. Evite textos muito longos no display para não quebrar o layout e use tamanhos de fonte adequados para que o UID fique legível no OLED 128x64.
