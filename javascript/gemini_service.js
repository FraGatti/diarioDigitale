const GEMINI_API_KEY = "AQ.Ab8RN6KctNn5lMwYgZ3XnhdgXUBsBW1KoVVrM22G6FJm8clIRw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Analizza il testo, corregge errori, estrae persone/passioni, genera l'alert emotivo e consiglia la palette
 */
export async function elaboraRicordoCompleto(testoGrezzo, emozioneUtente = '😊') {
  if (!testoGrezzo || !testoGrezzo.trim()) {
    return { 
      testoCorretto: testoGrezzo || "", 
      persone: [], 
      passioni: [], 
      messaggioAlert: "Ricordo salvato con successo! ✨",
      paletteConsigliata: "theme-blu"
    };
  }

  const prompt = `
Sei un assistente per un diario accessibile.
L'emozione attuale dell'utente è: "${emozioneUtente}".
Analizza questa frase: "${testoGrezzo}"

1. Riscrivi la frase in italiano corretto e semplice. Correggi gli errori grammaticali e di sintassi. Non aggiungere pensieri, commenti o elaborazioni. Non cambiare il significato della frase. Se la frase è già corretta, lasciala uguale.
2. Trova le PERSONE citate (es. mamma, papà, Marco) con un'emoji adatta. Attenzione: non aggiungere persone che non sono presenti nel testo originale. Se non è presente il nome della persona (esempio scrive solo mamma o papà) allora non aggiungere la persona. Se la persona è presente nel testo originale, ma non è chiaro il ruolo (es. scrive "sono andato a trovare Marco") allora non aggiungere la persona. Se la persona è presente nel testo originale e il ruolo è chiaro (es. scrive "sono andato a trovare Marco, il mio amico") allora aggiungi la persona con il ruolo e l'emoji adatta. 
3. Trova le PASSIONI o HOBBY citati (es. nuoto, pizza, disegno, calcio) con un'emoji adatta. Attenzione: non aggiungere passioni o persone che non sono presenti nel testo originale e per passione si intende quando l'utente inserisce parole come "mi piace", "adoro", "amo", "sono appassionato di", ecc. Se scrive "ho cucinato la pizza" non significa che la pizza è una passione, ma che ha cucinato la pizza. Se scrive "mi piace cucinare la pizza" allora la pizza è una passione. Se scrive "ho fatto una torta al cioccolato. Odio cucinare le torte" non devi aggiugere la passione perchè c'è una parola come "odio", "non mi piace" ecc che indica che non è una passione. 
4. Genera un messaggio breve per un ALERT/NOTIFICA di conferma salvataggio (massimo 1 frase breve e rassicurante), calibrato sull'emozione "${emozioneUtente}":
   - Se felice/positivo (😊, 😍, 😌, 🧘): conferma con tono gioioso (es: "Ricordo salvato! Che bella giornata, continua così! 🌟").
   - Se triste/stanco/annoiato (😢, 😴, 🥱): conferma con tono dolce e motivazionale (es: "Ricordo salvato con cura. Sei bravissimo, riposati e andrà tutto bene! 💛").
   - Se arrabbiato/nervoso (😠, 😤): conferma con tono calmo e incoraggiante (es: "Ricordo salvato. Hai fatto bene a scriverlo, ora fai un bel respiro sereno. 🌿").
5. Scegli la PALETTE di colori più adatta al suo stato d'animo tra queste 4 opzioni esatte:
   - "theme-solare" (se l'utente è felice, energico o allegro 😊/😍)
   - "theme-natura" (se l'utente è rilassato, sereno o ha bisogno di pace 😌/🧘)
   - "theme-rosa" (se l'utente è triste o affaticato per accoglierlo con calore 😢/😴)
   - "theme-blu" (se l'utente è arrabbiato, nervoso o per una calma profonda 😠/😤)

Rispondi SOLO ed ESCLUSIVAMENTE con un JSON valido con questa struttura esatta:
{
  "testoCorretto": "testo corretto qui",
  "messaggioAlert": "messaggio di notifica",
  "paletteConsigliata": "theme-natura",
  "persone": [{"nome": "Marco", "ruolo": "Amico", "emoji": "👨‍🦱"}],
  "passioni": [{"nome": "Cucinare la pizza", "emoji": "🍕"}]
}
`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    console.log("Risposta API Gemini:", data);

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(rawText);
      return {
        testoCorretto: parsed.testoCorretto || testoGrezzo,
        messaggioAlert: parsed.messaggioAlert || "Ricordo salvato nel tuo diario! ✨",
        paletteConsigliata: parsed.paletteConsigliata || "theme-blu",
        persone: Array.isArray(parsed.persone) ? parsed.persone : [],
        passioni: Array.isArray(parsed.passioni) ? parsed.passioni : []
      };
    }

    return { 
      testoCorretto: testoGrezzo, 
      messaggioAlert: "Ricordo salvato nel tuo diario! ✨", 
      paletteConsigliata: "theme-blu",
      persone: [], 
      passioni: [] 
    };
  } catch (err) {
    console.error("Errore chiamata Gemini:", err);
    return { 
      testoCorretto: testoGrezzo, 
      messaggioAlert: "Ricordo salvato nel tuo diario! ✨", 
      paletteConsigliata: "theme-blu",
      persone: [], 
      passioni: [] 
    };
  }
}

/**
 * Riformula un testo secondo le regole Easy-Read
 */
export async function semplificaInEasyRead(testo) {
  if (!testo || !testo.trim()) return testo;

  const prompt = `Sei un esperto di accessibilità cognitiva e regole Easy-Read (Facile da Leggere).
Prendi il seguente testo di un ricordo e semplificalo al massimo per una persona con disabilità cognitiva.

Regole Easy-Read:
1. Usa frasi molto brevi (Soggetto + Verbo + Oggetto).
2. Usa un vocabolario semplice e quotidiano.
3. Evita parole astratte o complesse.
4. Mantieni un tono calmo e rassicurante.
5. Rispondi ESCLUSIVAMENTE con il testo semplificato, senza note o spiegazioni.
6. Rimuovi dettagli inutili o complessi, concentrandoti solo sulle informazioni essenziali.
7. Mantieni il significato originale del testo.
8. Non aggiungere informazioni o dettagli che non sono presenti nel testo originale.
9. Evita ogni tipo di gergo.

Testo da semplificare: "${testo}"`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    return testo;
  } catch (err) {
    console.error("Errore Easy-Read:", err);
    return testo;
  }
}