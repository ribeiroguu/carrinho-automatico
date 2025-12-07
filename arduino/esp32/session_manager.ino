extern String sessaoCodigo;
extern String sessaoId;
extern String usuarioNome;
extern unsigned long sessionStartTime;
extern unsigned long lastSessionCheck;
extern SystemState currentState;

void setSession(const String& codigo) {
  sessaoCodigo = codigo;
  sessaoId.clear();
  usuarioNome.clear();
  sessionStartTime = 0;
  lastSessionCheck = 0;
  currentState = STATE_WAITING_SESSION;
}

void clearSession() {
  sessaoCodigo.clear();
  sessaoId.clear();
  usuarioNome.clear();
  sessionStartTime = 0;
  lastSessionCheck = 0;
  currentState = STATE_WAITING_SESSION;
}