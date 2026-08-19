// ==========================================
// CONTROLLER PRINCIPALE APPLICAZIONE
// ==========================================

import { 
  getMemories, 
  saveMemory, 
  updateMemoryText, 
  getPersone, 
  addPersona, 
  getPassioni, 
  addPassione 
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

// Aggiorna data dinamica
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

// Navigazione viste
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

// Rendering Ricordi
function renderSavedMemories() {
  const listContainer = document.getElementById('memories-list-container');
  if (!listContainer) return;

  let memories = getMemories();

  if (filtroFasciaAttivo) {
    memories = memories.filter(m => m.fascia === filtroFasciaAttivo);
  }

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
    return;
  }

  const recenti = memories.slice(0, 3);

  listContainer.innerHTML = recenti.map(m => `
    <div class="recent-card clickable-card" data-id="${m.id}" style="cursor:pointer;">
      <h4 class="card-date">${m.data} - ${m.fascia} ${m.immagine ? '📷' : ''}</h4>
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

// Rendering Persone
function renderPersone() {
  const container = document.getElementById('persone-list-container');
  if (!container) return;

  const persone = getPersone();
  let cardsHtml = persone.map(p => `
    <div class="person-card">
      <div class="avatar-placeholder" style="font-size: 3rem;">${p.emoji}</div>
      <h3 class="person-name">${p.nome}</h3>
      <p class="person-role">${p.ruolo}</p>
      <button class="tool-btn btn-speak-item" data-text="${p.nome}, ${p.ruolo}" style="margin-top: 8px; padding: 6px 12px; font-size: 0.9rem;">
        🔊 Ascolta
      </button>
    </div>
  `).join('');

  cardsHtml += `
    <button class="add-card-button" id="btn-add-persona" style="cursor:pointer; min-height: 140px; border: 2px dashed #cbd5e1; border-radius: 18px; background: white; font-weight: bold; font-size: 1.1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
      <span class="plus-icon" style="font-size: 2rem;">+</span>
      <span>Aggiungi Persona</span>
    </button>
  `;

  container.innerHTML = cardsHtml;
  document.getElementById('btn-add-persona')?.addEventListener('click', () => openModal('persona'));
  document.querySelectorAll('#persone-list-container .btn-speak-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-text');
      if (text) ascoltaTesto(text);
    });
  });
}

// Rendering Passioni
function renderPassioni() {
  const container = document.getElementById('passioni-list-container');
  if (!container) return;

  const passioni = getPassioni();
  let cardsHtml = passioni.map(p => `
    <div class="hobby-card">
      <span class="hobby-icon" style="font-size: 3rem;">${p.emoji}</span>
      <h3 class="hobby-name">${p.nome}</h3>
      <button class="tool-btn btn-speak-item" data-text="${p.nome}" style="margin-top: 8px; padding: 6px 12px; font-size: 0.9rem;">
        🔊 Ascolta
      </button>
    </div>
  `).join('');

  cardsHtml += `
    <button class="add-card-button" id="btn-add-passione" style="cursor:pointer; min-height: 140px; border: 2px dashed #cbd5e1; border-radius: 18px; background: white; font-weight: bold; font-size: 1.1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
      <span class="plus-icon" style="font-size: 2rem;">+</span>
      <span>Aggiungi Passione</span>
    </button>
  `;

  container.innerHTML = cardsHtml;
  document.getElementById('btn-add-passione')?.addEventListener('click', () => openModal('passione'));
  document.querySelectorAll('#passioni-list-container .btn-speak-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-text');
      if (text) ascoltaTesto(text);
    });
  });
}

// Modali per aggiunta manuale
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

// Inizializzazione Event Listeners
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
      if (viewTarget === 'ricordi') filtroFasciaAttivo = null;
      showViewById(`view-${viewTarget}`);
    });
  });

  // Filtri Categorie Ricordi
  document.querySelectorAll('.cat-btn').forEach(catBtn => {
    catBtn.addEventListener('click', (e) => {
      const fasciaSelezionata = e.currentTarget.getAttribute('data-filter');
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

  // Selezione Emozioni
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

  // Selettore Palette Manuale
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tema = e.currentTarget.getAttribute('data-theme');
      applicaPalette(tema);
      showToastAlert("Palette colori aggiornata!", "🎨");
    });
  });

  // Apertura Creazione Ricordo
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

  // Caricamento Immagine Locale
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

  // Salvataggio Ricordo
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

      // Invio solo testo ed emozione a Gemini (Privacy-Safe)
      const risultato = await elaboraRicordoCompleto(testoDaSalvare, emozioneSelezionataOggi);

      // Salva nel LocalStorage
      saveMemory(fasciaCorrente, risultato.testoCorretto, emozioneSelezionataOggi, currentImageBase64);

      // Aggiunge persone e passioni
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

      // Applica palette suggerita
      if (risultato.paletteConsigliata) {
        applicaPalette(risultato.paletteConsigliata);
      }

      // Reset campi
      if (inputTesto) inputTesto.value = ''; 
      currentImageBase64 = null;
      if (fileInput) fileInput.value = '';
      if (previewWrapper) previewWrapper.classList.add('hidden');
      
      filtroFasciaAttivo = null;
      showViewById('view-ricordi');

      // Notifica Toast motivazionale di Gemini
      showToastAlert(risultato.messaggioAlert, emozioneSelezionataOggi);

    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      saveMemory(fasciaCorrente, testoDaSalvare, emozioneSelezionataOggi, currentImageBase64);
      if (inputTesto) inputTesto.value = '';
      showViewById('view-ricordi');
      showToastAlert("Ricordo salvato!", "💾");
    } finally {
      if (btnSave) {
        btnSave.textContent = "💾 Salva";
        btnSave.disabled = false;
      }
    }
  });

  // Semplificazione Easy-Read
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

  // Dettatura Vocale
  document.getElementById('btn-mode-voice')?.addEventListener('click', () => {
    const btnVoice = document.getElementById('btn-mode-voice');
    avviaDettaturaVocale(
      inputTesto,
      () => btnVoice?.classList.add('recording'),
      () => btnVoice?.classList.remove('recording')
    );
  });

  // Lettura Vocale Ricordo
  document.getElementById('btn-read-aloud')?.addEventListener('click', () => {
    const memoryText = document.getElementById('read-memory-text')?.textContent;
    if (memoryText) ascoltaTesto(memoryText);
  });

  // Torna alla Home Universale
  document.addEventListener('click', (e) => {
    const eButtonHome = e.target.closest('.btn-go-home') || 
                          e.target.closest('#btn-main-home') ||
                          e.target.id === 'btn-back-to-home' || 
                          e.target.id === 'btn-cancel-memory';

    if (eButtonHome) showViewById('view-home');
  });

  // Modale manuale
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

  // Avvio: render iniziale
  renderSavedMemories();
  renderPersone();
  renderPassioni();
});