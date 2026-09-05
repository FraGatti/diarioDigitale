# Diario Digitale Accessibile

Applicazione web sviluppata come progetto di tesi per supportare persone con disabilità cognitive nella tenuta di un diario personale, tramite interfacce semplificate, supporto vocale e integrazione di Google Gemini per l'elaborazione del testo.

---

## Struttura del Progetto

* `index.html` - Punto di ingresso dell'applicazione (struttura a pagina singola).
* `css/` - Fogli di stile per layout ad alto contrasto e accessibilità visiva.
* `javascript/` - Logica modulare dell'applicazione:
  * `app.js` - Gestione degli eventi dell'interfaccia e navigazione.
  * `gemini_service.js` - Chiamate asincrone alle API di Google Gemini.
  * `speech.js` - Gestione sintesi vocale (TTS) e riconoscimento vocale (STT).
  * `storage.js` - Operazioni di lettura, scrittura e normalizzazione su Local Storage.
  * `theme.js` - Gestione e commutazione del tema ad alto contrasto.
* `resources/` - Icone, immagini e asset grafici.

---

## Configurazione della Chiave API

Per motivi di sicurezza, la chiave personale per le API di Google Gemini è esclusa dal repository tramite `.gitignore`.

Per abilitare le funzionalità AI:
1. Entrare nella cartella `javascript/`.
2. Duplicare il file `config.example.js` e rinominarlo in `config.js`.
3. Aprire `config.js` e inserire una chiave API valida:
   ```javascript
   export const GEMINI_API_KEY = "INSERISCI_QUI_LA_TUA_CHIAVE";
