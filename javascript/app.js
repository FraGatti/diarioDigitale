// ==========================================
// 1. DATA DINAMICA IN TEMPO REALE
// ==========================================
function setCurrentData() {
  const oggi = new Date();
  
  const dayOptions = { weekday: 'long' };
  let dayName = oggi.toLocaleDateString('it-IT', dayOptions);
  dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const dataOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const dataEstesa = oggi.toLocaleDateString('it-IT', dataOptions);

  const titleDataElement = document.querySelector('.date-text h2');
  const elementUnderData = document.querySelector('.date-text p');

  if (titleDataElement && elementUnderData) {
    titleDataElement.textContent = `Oggi è ${dayName}`;
    elementUnderData.textContent = dataEstesa;
  }
}

let emozioneSelezionataOggi = localStorage.getItem('diario_emozione_oggi') || '😊';
let filtroFasciaAttivo = null; // null = tutti i ricordi, altrimenti 'Mattina', 'Pomeriggio', 'Sera'

// ==========================================
// 2. SERVIZI VOCALI NATIVI (WEB SPEECH API)
// ==========================================

// Sintesi Vocale (Lettura a voce alta)
function ascoltaTesto(testo) {
  if (!('speechSynthesis' in window)) {
    alert("La sintesi vocale non è supportata dal tuo browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(testo);
  utterance.lang = 'it-IT';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// Dettatura Vocale (Speech-to-Text)
function avviaDettaturaVocale(targetInput) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("Il riconoscimento vocale non è supportato da questo browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'it-IT';
  recognition.interimResults = false;

  const btnVoice = document.getElementById('btn-mode-voice');
  if (btnVoice) btnVoice.classList.add('recording');

  recognition.start();

  recognition.onresult = (event) => {
    const trascrizione = event.results[0][0].transcript;
    if (targetInput) {
      targetInput.value = targetInput.value ? `${targetInput.value} ${trascrizione}` : trascrizione;
    }
  };

  recognition.onend = () => {
    if (btnVoice) btnVoice.classList.remove('recording');
  };

  recognition.onerror = (err) => {
    console.error("Errore riconoscimento vocale:", err);
    if (btnVoice) btnVoice.classList.remove('recording');
  };
}

// ==========================================
// 3. ARCHIVIO LOCALE (LOCALSTORAGE)
// ==========================================

// --- RICORDI ---
function getMemories() {
  try {
    const memories = localStorage.getItem('diario_ricordi');
    return memories ? JSON.parse(memories) : [];
  } catch (e) {
    console.error("Errore lettura ricordi dal localStorage", e);
    return [];
  }
}

function saveMemory(fascia, testo) {
  if (!testo || !testo.trim()) {
    alert("Scrivi qualcosa prima di salvare!");
    return false;
  }

  const newMemory = {
    id: Date.now(),
    data: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    fascia: fascia,
    testo: testo,
    emozione: emozioneSelezionataOggi
  };

  const currentMemories = getMemories();
  currentMemories.unshift(newMemory);
  
  localStorage.setItem('diario_ricordi', JSON.stringify(currentMemories));
  return true;
}

// Renderizza e Filtra le card dei Ricordi
function renderSavedMemories() {
  const listContainer = document.getElementById('memories-list-container');
  if (!listContainer) return;

  let memories = getMemories();

  // Applica il filtro se selezionato (Mattina, Pomeriggio o Sera)
  if (filtroFasciaAttivo) {
    memories = memories.filter(m => m.fascia === filtroFasciaAttivo);
  }

  if (memories.length === 0) {
    const messaggioFiltro = filtroFasciaAttivo 
      ? `Non hai ancora ricordi salvati per la ${filtroFasciaAttivo.toLowerCase()}` 
      : `Oggi non hai ancora ricordi`;

    listContainer.innerHTML = `
      <div class="recent-card">
          <h4 class="card-date">${messaggioFiltro}</h4>
          <span class="card-emoji">📝</span>
      </div>
    `;
    return;
  }

  const recenti = memories.slice(0, 3);

  listContainer.innerHTML = recenti.map(m => `
    <div class="recent-card clickable-card" data-id="${m.id}" style="cursor:pointer;">
      <h4 class="card-date">${m.data} - ${m.fascia}</h4>
      <span class="card-emoji">${m.emozione ? m.emozione : '😊'}</span>
    </div>
  `).join('');

  document.querySelectorAll('.clickable-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const memoryId = Number(e.currentTarget.getAttribute('data-id'));
      openMemoryDetail(memoryId);
    });
  });
}

function openMemoryDetail(id) {
  const memories = getMemories();
  const memory = memories.find(m => m.id === id);
  if (!memory) return;

  const dateElem = document.getElementById('read-memory-date');
  const badgeElem = document.getElementById('read-memory-badge');
  const emojiElem = document.getElementById('read-memory-emoji');
  const textElem = document.getElementById('read-memory-text');

  if (dateElem) dateElem.textContent = `📅 ${memory.data}`;
  if (badgeElem) badgeElem.textContent = memory.fascia;
  if (emojiElem) emojiElem.textContent = memory.emozione || '😊';
  if (textElem) textElem.textContent = memory.testo;

  showViewById('view-read-memory');
}

// --- PERSONE ---
const PERSONE_DEFAULT = [
  { id: 1, nome: 'Maria', ruolo: 'Educatrice', emoji: '👩‍⚕️' },
  { id: 2, nome: 'Elena', ruolo: 'Mamma', emoji: '👵' },
  { id: 3, nome: 'Marco', ruolo: 'Amico', emoji: '👨‍🦱' }
];

function getPersone() {
  try {
    const persone = localStorage.getItem('diario_persone');
    return persone ? JSON.parse(persone) : PERSONE_DEFAULT;
  } catch (e) {
    return PERSONE_DEFAULT;
  }
}

function addPersona(nome, ruolo, emoji = '👤') {
  const persone = getPersone();
  persone.push({ id: Date.now(), nome, ruolo, emoji });
  localStorage.setItem('diario_persone', JSON.stringify(persone));
  renderPersone();
}

function renderPersone() {
  const container = document.getElementById('persone-list-container');
  if (!container) return;

  const persone = getPersone();
  
  container.innerHTML = persone.map(p => `
    <div class="person-card">
      <div class="avatar-placeholder">${p.emoji}</div>
      <h3 class="person-name">${p.nome}</h3>
      <p class="person-role">${p.ruolo}</p>
    </div>
  `).join('') + `
    <button class="add-card-button" id="btn-add-persona">
      <span class="plus-icon">+</span>
      <span>Aggiungi Persona</span>
    </button>
  `;

  document.getElementById('btn-add-persona')?.addEventListener('click', () => {
    openModal('persona');
  });
}

// --- PASSIONI ---
const PASSIONI_DEFAULT = [
  { id: 1, nome: 'Disegnare', emoji: '🎨' },
  { id: 2, nome: 'Ascoltare Musica', emoji: '🎵' },
  { id: 3, nome: 'Calcio', emoji: '⚽' }
];

function getPassioni() {
  try {
    const passioni = localStorage.getItem('diario_passioni');
    return passioni ? JSON.parse(passioni) : PASSIONI_DEFAULT;
  } catch (e) {
    return PASSIONI_DEFAULT;
  }
}

function addPassione(nome, emoji = '⭐') {
  const passioni = getPassioni();
  passioni.push({ id: Date.now(), nome, emoji });
  localStorage.setItem('diario_passioni', JSON.stringify(passioni));
  renderPassioni();
}

function renderPassioni() {
  const container = document.getElementById('passioni-list-container');
  if (!container) return;

  const passioni = getPassioni();

  container.innerHTML = passioni.map(p => `
    <div class="hobby-card">
      <span class="hobby-icon">${p.emoji}</span>
      <h3 class="hobby-name">${p.nome}</h3>
    </div>
  `).join('') + `
    <button class="add-card-button" id="btn-add-passione">
      <span class="plus-icon">+</span>
      <span>Aggiungi Passione</span>
    </button>
  `;

  document.getElementById('btn-add-passione')?.addEventListener('click', () => {
    openModal('passione');
  });
}

// ==========================================
// 4. GESTIONE MODAL CUSTOM
// ==========================================
let activeModalType = null;

function openModal(type) {
  activeModalType = type;
  const modal = document.getElementById('custom-modal');
  const modalTitle = document.getElementById('modal-title');
  const label1 = document.getElementById('modal-label-1');
  const groupRole = document.getElementById('group-role-input');
  const inputTitle = document.getElementById('modal-input-title');
  const inputSubtitle = document.getElementById('modal-input-subtitle');

  if (!modal) return;

  if (inputTitle) inputTitle.value = '';
  if (inputSubtitle) inputSubtitle.value = '';

  if (type === 'persona') {
    if (modalTitle) modalTitle.textContent = "👥 Aggiungi una nuova Persona";
    if (label1) label1.textContent = "Nome della persona:";
    if (groupRole) groupRole.style.display = 'flex';
  } else {
    if (modalTitle) modalTitle.textContent = "⭐ Aggiungi una nuova Passione";
    if (label1) label1.textContent = "Nome della passione/hobby:";
    if (groupRole) groupRole.style.display = 'none';
  }

  modal.classList.remove('hidden');
  if (inputTitle) inputTitle.focus();
}

function closeModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) modal.classList.add('hidden');
  activeModalType = null;
}

// ==========================================
// 5. NAVIGAZIONE E MOSTRA VISTE
// ==========================================
function showViewById(idView) {
  const allViews = document.querySelectorAll('.view-section');
  const allMenuButtons = document.querySelectorAll('.menu-btn');

  allViews.forEach(view => {
    view.classList.add('hidden');
    view.classList.remove('active');
  });

  const viewToBeShown = document.getElementById(idView);
  if (viewToBeShown) {
    viewToBeShown.classList.remove('hidden');
    viewToBeShown.classList.add('active');
  }

  allMenuButtons.forEach(btn => {
    const linkedView = btn.getAttribute('data-view');
    if (`view-${linkedView}` === idView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (idView === 'view-ricordi') renderSavedMemories();
  if (idView === 'view-persone') renderPersone();
  if (idView === 'view-passioni') renderPassioni();
}

// ==========================================
// 6. INIZIALIZZAZIONE ALL'AVVIO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setCurrentData();

  const textSelectedRange = document.getElementById('current-fascia-text');
  const inputTesto = document.getElementById('memory-text-input');

  // Pulsanti Menu Top Bar
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewTarget = btn.getAttribute('data-view');
      // Reset del filtro quando si passa ad altre schede se desiderato
      if (viewTarget === 'ricordi') filtroFasciaAttivo = null;
      showViewById(`view-${viewTarget}`);
    });
  });

  // GESTIONE FILTRI CATEGORIE RICORDI (Mattina, Pomeriggio, Sera)
  document.querySelectorAll('.cat-btn').forEach(catBtn => {
    catBtn.addEventListener('click', (e) => {
      const fasciaSelezionata = e.currentTarget.getAttribute('data-filter');

      // Se clicco sulla categoria già attiva la deseleziono (mostra tutti), altrimenti applico il filtro
      if (filtroFasciaAttivo === fasciaSelezionata) {
        filtroFasciaAttivo = null;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active-filter'));
      } else {
        filtroFasciaAttivo = fasciaSelezionata;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active-filter'));
        e.currentTarget.classList.add('active-filter');
      }

      renderSavedMemories();
    });
  });

  // Gestione Selezione Emozioni
  document.querySelectorAll('.emotion-card').forEach(card => {
    if (card.getAttribute('data-emotion') === emozioneSelezionataOggi) {
      card.classList.add('selected-emotion');
    }

    card.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      emozioneSelezionataOggi = btn.getAttribute('data-emotion');
      localStorage.setItem('diario_emozione_oggi', emozioneSelezionataOggi);

      document.querySelectorAll('.emotion-card').forEach(c => c.classList.remove('selected-emotion'));
      btn.classList.add('selected-emotion');

      setTimeout(() => { showViewById('view-home'); }, 300);
    });
  });

  // Pulsanti "+ Nuovo ricordo" (Mattina, Pomeriggio, Sera)
  document.querySelectorAll('.add-memory-btn').forEach(pulsante => {
    pulsante.addEventListener('click', (e) => {
      const range = e.currentTarget.getAttribute('data-fascia') || 'Mattina';
      if (textSelectedRange) textSelectedRange.textContent = range;
      showViewById('view-create-memory');
    });
  });

  // Salva Ricordo
  document.getElementById('btn-save-memory')?.addEventListener('click', () => {
    const fasciaCorrente = textSelectedRange ? textSelectedRange.textContent : 'Mattina';
    const testoDaSalvare = inputTesto ? inputTesto.value : '';

    if (saveMemory(fasciaCorrente, testoDaSalvare)) {
      if (inputTesto) inputTesto.value = ''; 
      filtroFasciaAttivo = null; // Resetta i filtri per mostrare il ricordo appena salvato
      showViewById('view-ricordi');
    }
  });

  // Dettatura Vocale (Usa la voce)
  document.getElementById('btn-mode-voice')?.addEventListener('click', () => {
    avviaDettaturaVocale(inputTesto);
  });

  // Ascolta Testo Ricordo
  document.getElementById('btn-read-aloud')?.addEventListener('click', () => {
    const memoryText = document.getElementById('read-memory-text')?.textContent;
    if (memoryText) ascoltaTesto(memoryText);
  });

  // Gestione Indietro / Torna alla Home Universale
  document.addEventListener('click', (e) => {
    const eButtonHome = e.target.closest('.btn-go-home') || 
                          e.target.closest('#btn-main-home') ||
                          e.target.id === 'btn-back-to-home' || 
                          e.target.id === 'btn-cancel-memory';

    if (eButtonHome) showViewById('view-home');
  });

  // Pulsanti Modal Custom
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
    const inputTitle = document.getElementById('modal-input-title');
    const inputSubtitle = document.getElementById('modal-input-subtitle');

    const titleVal = inputTitle ? inputTitle.value.trim() : '';
    const subtitleVal = inputSubtitle ? inputSubtitle.value.trim() : '';

    if (!titleVal) return;

    if (activeModalType === 'persona') {
      addPersona(titleVal, subtitleVal || 'Caregiver/Amico');
    } else if (activeModalType === 'passione') {
      addPassione(titleVal);
    }

    closeModal();
  });

  // Avvio: mostra la schermata iniziale
  renderSavedMemories();
  renderPersone();
  renderPassioni();
});