// ==========================================
// CONTROLLER PRINCIPALE APPLICAZIONE
// ==========================================

import { 
  getMemories, 
  saveMemory, 
  updateMemoryText, 
  deleteMemory,
  getPersone, 
  addPersona, 
  deletePersona,
  getPassioni, 
  addPassione,
  deletePassione
} from './storage.js';

import { ascoltaTesto, avviaDettaturaVocale } from './speech.js';
import { applicaPalette, caricaPaletteIniziale, showToastAlert } from './theme.js';
import { elaboraRicordoCompleto, semplificaInEasyRead } from './gemini_service.js';

// Stato locale dell'applicazione
let emozioneSelezionataOggi = localStorage.getItem('diario_emozione_oggi') || '😊';
let filtroFasciaAttivo = null; 
let ricordoApertoId = null;
let currentImageBase64 = null;
let activeModalType = null;

// Stato della cancellazione rassicurante
let itemToDeleteType = null; // 'ricordo' | 'persona' | 'passione'
let itemToDeleteId = null;

// Stato paginazione no-scroll
let paginaCorrenteRicordi = 0;
const ELEMENTI_PER_PAGINA_RICORDI = 3;

let paginaCorrentePersone = 0;
let paginaCorrentePassioni = 0;
const ELEMENTI_PER_PAGINA_GRID = 3; // 3 schede + 1 tasto '+' = 4 elementi (griglia 4 colonne)

// Imposta e aggiorna la data mostrata nell'intestazione
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

// Navigazione dinamica tra le schermate
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

// Apertura modale di conferma cancellazione con tono rassicurante
function askDeleteConfirmation(type, id, nomeOggetto = '') {
  itemToDeleteType = type;
  itemToDeleteId = id;

  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');

  if (!modal || !title || !desc) return;

  if (type === 'ricordo') {
    title.textContent = "Vuoi togliere questo ricordo? 🌸";
    desc.textContent = "Non ti preoccupare: se non vuoi più vedere questo ricordo, possiamo cancellarlo insieme con calma. Potrai scriverne sempre di nuovi quando vorrai!";
  } else if (type === 'persona') {
    title.textContent = `Vuoi togliere ${nomeOggetto}? 🌸`;
    desc.textContent = "Non ti preoccupare: se vuoi togliere questa persona cara dall'elenco, possiamo farlo con calma. Potrai aggiungerla di nuovo in qualsiasi momento!";
  } else if (type === 'passione') {
    title.textContent = `Vuoi togliere ${nomeOggetto}? 🌸`;
    desc.textContent = "Non ti preoccupare: se vuoi togliere questa passione, possiamo farlo con serenità. Potrai sempre aggiungerne di nuove quando vorrai!";
  }

  modal.classList.remove('hidden');
}

// Rendering Ricordi Paginato (Max 3 per schermata a zero-scroll)
function renderSavedMemories() {
  const listContainer = document.getElementById('memories-list-container');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  const pageIndicator = document.getElementById('page-indicator');

  if (!listContainer) return;

  let memories = getMemories();

  if (filtroFasciaAttivo) {
    memories = memories.filter(m => m.fascia === filtroFasciaAttivo);
  }

  const totalePagine = Math.ceil(memories.length / ELEMENTI_PER_PAGINA_RICORDI) || 1;

  if (paginaCorrenteRicordi >= totalePagine) paginaCorrenteRicordi = totalePagine - 1;
  if (paginaCorrenteRicordi < 0) paginaCorrenteRicordi = 0;

  if (memories.length === 0) {
    const messaggioFiltro = filtroFasciaAttivo 
      ? `Non hai ancora ricordi per la ${filtroFasciaAttivo.toLowerCase()}` 
      : `Non ci sono ancora ricordi`;

    listContainer.innerHTML = `
      <div class="recent-card">
          <h4 class="card-date">${messaggioFiltro}</h4>
          <span class="card-emoji">📝</span>
      </div>
    `;

    if (pageIndicator) pageIndicator.textContent = "Pagina 1 di 1";
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    return;
  }

  const inizio = paginaCorrenteRicordi * ELEMENTI_PER_PAGINA_RICORDI;
  const recenti = memories.slice(inizio, inizio + ELEMENTI_PER_PAGINA_RICORDI);

  listContainer.innerHTML = recenti.map(m => `
    <div class="recent-card clickable-card" data-id="${m.id}" style="cursor:pointer;">
      <h4 class="card-date">${m.data} - ${m.fascia} ${m.immagine ? '📷' : ''}</h4>
      <span class="card-emoji">${m.emozione ? m.emozione : '😊'}</span>
    </div>
  `).join('');

  if (pageIndicator) pageIndicator.textContent = `Pagina ${paginaCorrenteRicordi + 1} di ${totalePagine}`;
  if (btnPrev) btnPrev.disabled = paginaCorrenteRicordi === 0;
  if (btnNext) btnNext.disabled = paginaCorrenteRicordi >= totalePagine - 1;

  document.querySelectorAll('.clickable-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const memoryId = Number(e.currentTarget.getAttribute('data-id'));
      openMemoryDetail(memoryId);
    });
  });
}

// Apertura Dettaglio Ricordo
function openMemoryDetail(id) {
  const memories = getMemories();
  const memory = memories.find(m => m.id === id);
  if (!memory) return;

  ricordoApertoId = id;

  const dateElem = document.getElementById('read-memory-date');
  const badgeElem = document.getElementById('read-memory-badge');
  const emojiElem = document.getElementById('read-memory-emoji');
  const textElem = document.getElementById('read-memory-text');
  const imgElem = document.getElementById('read-memory-image');

  if (dateElem) dateElem.textContent = `📅 ${memory.data}`;
  if (badgeElem) badgeElem.textContent = memory.fascia;
  if (emojiElem) emojiElem.textContent = memory.emozione || '😊';
  if (textElem) textElem.textContent = memory.testo;

  if (imgElem) {
    if (memory.immagine) {
      imgElem.src = memory.immagine;
      imgElem.classList.remove('hidden');
    } else {
      imgElem.src = '';
      imgElem.classList.add('hidden');
    }
  }

  showViewById('view-read-memory');
}

// Rendering Persone Paginato (Max 3 schede + tasto '+')
function renderPersone() {
  const container = document.getElementById('persone-list-container');
  const btnPrev = document.getElementById('btn-prev-persone');
  const btnNext = document.getElementById('btn-next-persone');
  const pageIndicator = document.getElementById('page-indicator-persone');

  if (!container) return;

  const persone = getPersone();
  const totalePagine = Math.ceil(persone.length / ELEMENTI_PER_PAGINA_GRID) || 1;

  if (paginaCorrentePersone >= totalePagine) paginaCorrentePersone = totalePagine - 1;
  if (paginaCorrentePersone < 0) paginaCorrentePersone = 0;

  const inizio = paginaCorrentePersone * ELEMENTI_PER_PAGINA_GRID;
  const personeVisibili = persone.slice(inizio, inizio + ELEMENTI_PER_PAGINA_GRID);

  let cardsHtml = personeVisibili.map(p => `
    <div class="person-card">
      <button class="btn-delete-card btn-delete-persona" data-id="${p.id}" data-name="${p.nome}" title="Elimina persona">🗑️</button>
      <div class="avatar-placeholder">${p.emoji}</div>
      <h3 class="person-name">${p.nome}</h3>
      <p class="person-role">${p.ruolo}</p>
      <button class="tool-btn btn-speak-item" data-text="${p.nome}, ${p.ruolo}">
        🔊 Ascolta
      </button>
    </div>
  `).join('');

  cardsHtml += `
    <button class="add-card-button" id="btn-add-persona">
      <span class="plus-icon">+</span>
      <span>Aggiungi Persona</span>
    </button>
  `;

  container.innerHTML = cardsHtml;

  if (pageIndicator) pageIndicator.textContent = `Pagina ${paginaCorrentePersone + 1} di ${totalePagine}`;
  if (btnPrev) btnPrev.disabled = paginaCorrentePersone === 0;
  if (btnNext) btnNext.disabled = paginaCorrentePersone >= totalePagine - 1;

  document.getElementById('btn-add-persona')?.addEventListener('click', () => openModal('persona'));

  document.querySelectorAll('#persone-list-container .btn-speak-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-text');
      if (text) ascoltaTesto(text);
    });
  });

  document.querySelectorAll('.btn-delete-persona').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(e.currentTarget.getAttribute('data-id'));
      const nome = e.currentTarget.getAttribute('data-name') || 'questa persona';
      askDeleteConfirmation('persona', id, nome);
    });
  });
}

// Rendering Passioni Paginato (Max 3 schede + tasto '+')
function renderPassioni() {
  const container = document.getElementById('passioni-list-container');
  const btnPrev = document.getElementById('btn-prev-passioni');
  const btnNext = document.getElementById('btn-next-passioni');
  const pageIndicator = document.getElementById('page-indicator-passioni');

  if (!container) return;

  const passioni = getPassioni();
  const totalePagine = Math.ceil(passioni.length / ELEMENTI_PER_PAGINA_GRID) || 1;

  if (paginaCorrentePassioni >= totalePagine) paginaCorrentePassioni = totalePagine - 1;
  if (paginaCorrentePassioni < 0) paginaCorrentePassioni = 0;

  const inizio = paginaCorrentePassioni * ELEMENTI_PER_PAGINA_GRID;
  const passioniVisibili = passioni.slice(inizio, inizio + ELEMENTI_PER_PAGINA_GRID);

  let cardsHtml = passioniVisibili.map(p => `
    <div class="hobby-card">
      <button class="btn-delete-card btn-delete-passione" data-id="${p.id}" data-name="${p.nome}" title="Elimina passione">🗑️</button>
      <span class="hobby-icon">${p.emoji}</span>
      <h3 class="hobby-name">${p.nome}</h3>
      <button class="tool-btn btn-speak-item" data-text="${p.nome}">
        🔊 Ascolta
      </button>
    </div>
  `).join('');

  cardsHtml += `
    <button class="add-card-button" id="btn-add-passione">
      <span class="plus-icon">+</span>
      <span>Aggiungi Passione</span>
    </button>
  `;

  container.innerHTML = cardsHtml;

  if (pageIndicator) pageIndicator.textContent = `Pagina ${paginaCorrentePassioni + 1} di ${totalePagine}`;
  if (btnPrev) btnPrev.disabled = paginaCorrentePassioni === 0;
  if (btnNext) btnNext.disabled = paginaCorrentePassioni >= totalePagine - 1;

  document.getElementById('btn-add-passione')?.addEventListener('click', () => openModal('passione'));

  document.querySelectorAll('#passioni-list-container .btn-speak-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-text');
      if (text) ascoltaTesto(text);
    });
  });

  document.querySelectorAll('.btn-delete-passione').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(e.currentTarget.getAttribute('data-id'));
      const nome = e.currentTarget.getAttribute('data-name') || 'questa passione';
      askDeleteConfirmation('passione', id, nome);
    });
  });
}

// Finestra Modale per Aggiunta Manuale (Persona o Passione)
function openModal(type) {
  activeModalType = type;
  const modal = document.getElementById('custom-modal');
  const modalTitle = document.getElementById('modal-title');
  const label1 = document.getElementById('modal-label-1');
  const groupRole = document.getElementById('group-role-input');
  const inputEmoji = document.getElementById('modal-input-emoji');
  const inputTitle = document.getElementById('modal-input-title');
  const inputSubtitle = document.getElementById('modal-input-subtitle');

  if (!modal) return;
  if (inputTitle) inputTitle.value = '';
  if (inputSubtitle) inputSubtitle.value = '';

  if (type === 'persona') {
    if (modalTitle) modalTitle.textContent = "👥 Aggiungi una nuova Persona";
    if (label1) label1.textContent = "Nome della persona:";
    if (inputEmoji) inputEmoji.value = '👤';
    if (groupRole) groupRole.style.display = 'flex';
  } else {
    if (modalTitle) modalTitle.textContent = "⭐ Aggiungi una nuova Passione";
    if (label1) label1.textContent = "Nome della passione/hobby:";
    if (inputEmoji) inputEmoji.value = '⭐';
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

// Inizializzazione Event Listener al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
  setCurrentData();
  caricaPaletteIniziale();

  const textSelectedRange = document.getElementById('current-fascia-text');
  const inputTesto = document.getElementById('memory-text-input');
  const fileInput = document.getElementById('hidden-file-input');
  const previewWrapper = document.getElementById('image-preview-wrapper');
  const previewImg = document.getElementById('image-preview-img');

  // Navigazione Menu Principale
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewTarget = btn.getAttribute('data-view');
      if (viewTarget === 'ricordi') {
        filtroFasciaAttivo = null;
        paginaCorrenteRicordi = 0;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active-filter'));
      }
      showViewById(`view-${viewTarget}`);
    });
  });

  // Filtri Categorie Ricordi (Mattina, Pomeriggio, Sera)
  document.querySelectorAll('.cat-btn').forEach(catBtn => {
    catBtn.addEventListener('click', (e) => {
      const fasciaSelezionata = e.currentTarget.getAttribute('data-filter');
      paginaCorrenteRicordi = 0;

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

  // Paginazione Ricordi (Precedenti / Successivi)
  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (paginaCorrenteRicordi > 0) {
      paginaCorrenteRicordi--;
      renderSavedMemories();
    }
  });

  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    paginaCorrenteRicordi++;
    renderSavedMemories();
  });

  // Paginazione Persone
  document.getElementById('btn-prev-persone')?.addEventListener('click', () => {
    if (paginaCorrentePersone > 0) {
      paginaCorrentePersone--;
      renderPersone();
    }
  });

  document.getElementById('btn-next-persone')?.addEventListener('click', () => {
    paginaCorrentePersone++;
    renderPersone();
  });

  // Paginazione Passioni
  document.getElementById('btn-prev-passioni')?.addEventListener('click', () => {
    if (paginaCorrentePassioni > 0) {
      paginaCorrentePassioni--;
      renderPassioni();
    }
  });

  document.getElementById('btn-next-passioni')?.addEventListener('click', () => {
    paginaCorrentePassioni++;
    renderPassioni();
  });

  // Selezione Emozione Giornaliera
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

      const etichetta = btn.querySelector('.emotion-label')?.textContent || '';
      showToastAlert(`Hai impostato il tuo umore su: ${etichetta}`, emozioneSelezionataOggi);

      setTimeout(() => { showViewById('view-home'); }, 600);
    });
  });

  // Selettore Manuale della Palette Cromatica
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tema = e.currentTarget.getAttribute('data-theme');
      applicaPalette(tema);
      showToastAlert("Palette colori aggiornata!", "🎨");
    });
  });

  // Apertura Schermata Creazione Ricordo dalla Dashboard
  document.querySelectorAll('.add-memory-btn').forEach(pulsante => {
    pulsante.addEventListener('click', (e) => {
      const range = e.currentTarget.getAttribute('data-fascia') || 'Mattina';
      if (textSelectedRange) textSelectedRange.textContent = range;
      currentImageBase64 = null;
      if (previewWrapper) previewWrapper.classList.add('hidden');
      if (previewImg) previewImg.src = '';
      showViewById('view-create-memory');
    });
  });

  // Acquisizione Immagine Locale (Base64)
  document.getElementById('btn-mode-image')?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentImageBase64 = event.target.result;
      if (previewImg) previewImg.src = currentImageBase64;
      if (previewWrapper) previewWrapper.classList.remove('hidden');
      showToastAlert("Foto aggiunta in locale al ricordo! 📷", "✨");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-delete-img')?.addEventListener('click', () => {
    currentImageBase64 = null;
    if (fileInput) fileInput.value = '';
    if (previewWrapper) previewWrapper.classList.add('hidden');
    if (previewImg) previewImg.src = '';
  });

  // Salvataggio ed Elaborazione con Gemini
  document.getElementById('btn-save-memory')?.addEventListener('click', async () => {
    const fasciaCorrente = textSelectedRange ? textSelectedRange.textContent : 'Mattina';
    const testoDaSalvare = inputTesto ? inputTesto.value.trim() : '';

    if (!testoDaSalvare && !currentImageBase64) {
      showToastAlert("Scrivi, detta o inserisci una foto prima di salvare!", "⚠️");
      return;
    }

    const btnSave = document.getElementById('btn-save-memory');

    try {
      if (btnSave) {
        btnSave.textContent = "✨ L'IA sta elaborando...";
        btnSave.disabled = true;
      }

      const risultato = await elaboraRicordoCompleto(testoDaSalvare, emozioneSelezionataOggi);

      saveMemory(fasciaCorrente, risultato.testoCorretto, emozioneSelezionataOggi, currentImageBase64);

      if (risultato.persone && Array.isArray(risultato.persone)) {
        risultato.persone.forEach(p => {
          if (p && p.nome) addPersona(p.nome, p.ruolo || 'Caregiver/Amico', p.emoji || '👤');
        });
      }

      if (risultato.passioni && Array.isArray(risultato.passioni)) {
        risultato.passioni.forEach(p => {
          if (p && p.nome) addPassione(p.nome, p.emoji || '⭐');
        });
      }

      if (risultato.paletteConsigliata) {
        applicaPalette(risultato.paletteConsigliata);
      }

      if (inputTesto) inputTesto.value = ''; 
      currentImageBase64 = null;
      if (fileInput) fileInput.value = '';
      if (previewWrapper) previewWrapper.classList.add('hidden');
      
      filtroFasciaAttivo = null;
      paginaCorrenteRicordi = 0;
      showViewById('view-ricordi');
      showToastAlert(risultato.messaggioAlert, emozioneSelezionataOggi);

    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      saveMemory(fasciaCorrente, testoDaSalvare, emozioneSelezionataOggi, currentImageBase64);
      if (inputTesto) inputTesto.value = '';
      filtroFasciaAttivo = null;
      paginaCorrenteRicordi = 0;
      showViewById('view-ricordi');
      showToastAlert("Ricordo salvato!", "💾");
    } finally {
      if (btnSave) {
        btnSave.textContent = "💾 Salva";
        btnSave.disabled = false;
      }
    }
  });

  // Gestione Modale di Eliminazione Rassicurante (Ricordi, Persone, Passioni)
  const confirmModal = document.getElementById('confirm-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Trigger cancellazione ricordo dal dettaglio
  document.getElementById('btn-delete-memory')?.addEventListener('click', () => {
    if (ricordoApertoId) {
      askDeleteConfirmation('ricordo', ricordoApertoId);
    }
  });

  // Tasto "No, tienilo": chiude la modale senza toccare i dati
  btnCancelDelete?.addEventListener('click', () => {
    confirmModal?.classList.add('hidden');
    itemToDeleteType = null;
    itemToDeleteId = null;
  });

  // Tasto "Sì, eliminalo": esegue la cancellazione dell'entità specifica
  btnConfirmDelete?.addEventListener('click', () => {
    if (!itemToDeleteType || itemToDeleteId === null) {
      confirmModal?.classList.add('hidden');
      return;
    }

    if (itemToDeleteType === 'ricordo') {
      deleteMemory(itemToDeleteId);
      ricordoApertoId = null;
      showToastAlert("Ricordo tolto con successo! 🌸", "🗑️");
      showViewById('view-ricordi');
    } else if (itemToDeleteType === 'persona') {
      deletePersona(itemToDeleteId);
      renderPersone();
      showToastAlert("Persona tolta dall'elenco! 🌸", "🗑️");
    } else if (itemToDeleteType === 'passione') {
      deletePassione(itemToDeleteId);
      renderPassioni();
      showToastAlert("Passione tolta dall'elenco! 🌸", "🗑️");
    }

    confirmModal?.classList.add('hidden');
    itemToDeleteType = null;
    itemToDeleteId = null;
  });

  // Navigazione a ritroso: da Dettaglio a Elenco Ricordi
  document.getElementById('btn-back-to-memories')?.addEventListener('click', () => {
    showViewById('view-ricordi');
  });

  // Semplificazione Easy-Read su richiesta
  document.getElementById('btn-simplify-ia')?.addEventListener('click', async () => {
    const textElem = document.getElementById('read-memory-text');
    const btnSimplify = document.getElementById('btn-simplify-ia');

    if (!textElem || !ricordoApertoId) return;
    const testoAttuale = textElem.textContent.trim();
    if (!testoAttuale) return;

    try {
      if (btnSimplify) {
        btnSimplify.textContent = "✨ Semplificazione in corso...";
        btnSimplify.disabled = true;
      }

      const testoEasyRead = await semplificaInEasyRead(testoAttuale);
      textElem.textContent = testoEasyRead;
      updateMemoryText(ricordoApertoId, testoEasyRead);

      showToastAlert("Testo semplificato in formato Easy-Read! ✨", "📖");
    } catch (err) {
      console.error("Errore semplificazione Easy-Read:", err);
    } finally {
      if (btnSimplify) {
        btnSimplify.textContent = "✨ Semplifica con IA (Easy-Read)";
        btnSimplify.disabled = false;
      }
    }
  });

  // Dettatura Vocale (Speech-to-Text)
  document.getElementById('btn-mode-voice')?.addEventListener('click', () => {
    const btnVoice = document.getElementById('btn-mode-voice');
    avviaDettaturaVocale(
      inputTesto,
      () => btnVoice?.classList.add('recording'),
      () => btnVoice?.classList.remove('recording')
    );
  });

  // Lettura Vocale Ricordo (Text-to-Speech)
  document.getElementById('btn-read-aloud')?.addEventListener('click', () => {
    const memoryText = document.getElementById('read-memory-text')?.textContent;
    if (memoryText) ascoltaTesto(memoryText);
  });

  // Ritorno universale alla Home
  document.addEventListener('click', (e) => {
    const eButtonHome = e.target.closest('.main-home-btn') || 
                        e.target.id === 'btn-cancel-memory';

    if (eButtonHome) showViewById('view-home');
  });

  // Gestione Modale Inserimento Manuale
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
    const inputEmoji = document.getElementById('modal-input-emoji');
    const inputTitle = document.getElementById('modal-input-title');
    const inputSubtitle = document.getElementById('modal-input-subtitle');

    const emojiVal = inputEmoji ? inputEmoji.value.trim() : '';
    const titleVal = inputTitle ? inputTitle.value.trim() : '';
    const subtitleVal = inputSubtitle ? inputSubtitle.value.trim() : '';

    if (!titleVal) {
      showToastAlert("Inserisci almeno un nome!", "⚠️");
      return;
    }

    if (activeModalType === 'persona') {
      const aggiunta = addPersona(titleVal, subtitleVal || 'Caregiver/Amico', emojiVal || '👤');
      if (aggiunta) {
        renderPersone();
        showToastAlert(`Persona "${titleVal}" aggiunta!`, emojiVal || '👤');
      } else {
        showToastAlert(`"${titleVal}" è già presente!`, "ℹ️");
      }
    } else if (activeModalType === 'passione') {
      const aggiunta = addPassione(titleVal, emojiVal || '⭐');
      if (aggiunta) {
        renderPassioni();
        showToastAlert(`Passione "${titleVal}" aggiunta!`, emojiVal || '⭐');
      } else {
        showToastAlert(`"${titleVal}" è già presente!`, "ℹ️");
      }
    }

    closeModal();
  });

  // Avvio: caricamento e render iniziale di tutte le sezioni
  renderSavedMemories();
  renderPersone();
  renderPassioni();
});