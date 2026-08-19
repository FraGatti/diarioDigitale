// ==========================================
// MODULO SERVIZI VOCALI (WEB SPEECH API)
// ==========================================

/**
 * Riproduce un testo tramite sintesi vocale (Text-To-Speech)
 */
export function ascoltaTesto(testo) {
  if (!('speechSynthesis' in window)) {
    alert("La sintesi vocale non è supportata dal tuo browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(testo);
  utterance.lang = 'it-IT';
  utterance.rate = 0.85; // Velocità calibrata per facilitare la comprensione
  window.speechSynthesis.speak(utterance);
}

/**
 * Avvia il riconoscimento vocale e inserisce il testo nel campo specificato
 */
export function avviaDettaturaVocale(targetInput, onStartCallback, onEndCallback) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Il riconoscimento vocale non è supportato da questo browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'it-IT';
  recognition.interimResults = false;

  if (typeof onStartCallback === 'function') onStartCallback();

  recognition.start();

  recognition.onresult = (event) => {
    const trascrizione = event.results[0][0].transcript;
    if (targetInput) {
      targetInput.value = targetInput.value ? `${targetInput.value} ${trascrizione}` : trascrizione;
    }
  };

  recognition.onend = () => {
    if (typeof onEndCallback === 'function') onEndCallback();
  };

  recognition.onerror = (err) => {
    console.error("Errore riconoscimento vocale:", err);
    if (typeof onEndCallback === 'function') onEndCallback();
  };
}