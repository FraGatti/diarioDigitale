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

// Variabile in italiano per coerenza con gli eventi sottostanti
let emozioneSelezionataOggi = localStorage.getItem('diario_emozione_oggi') || '😊';

// ==========================================
// 2. ARCHIVIO LOCALE (LOCALSTORAGE)
// ==========================================
function getMemories() {
  const memories = localStorage.getItem('diario_ricordi');
  return memories ? JSON.parse(memories) : [];
}

function saveMemory(fascia, testo) {
  if (!testo.trim()) {
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

// Renderizza la griglia delle schede recenti nella vista "I miei ricordi"
function renderSavedMemories() {
  const listContainer = document.getElementById('memories-list-container');
  if (!listContainer) return;

  const memories = getMemories();

  if (memories.length === 0) {
    listContainer.innerHTML = `
      <div class="recent-card">
          <h4 class="card-date">19 giugno 2026</h4>
          <span class="card-emoji">😊</span>
      </div>
      <div class="recent-card">
          <h4 class="card-date">18 giugno 2026</h4>
          <span class="card-emoji">😴</span>
      </div>
      <div class="recent-card">
          <h4 class="card-date">17 giugno 2026</h4>
          <span class="card-emoji-placeholder">+ emozione?</span>
      </div>
    `;
    return;
  }

  const recenti = memories.slice(0, 3);

  listContainer.innerHTML = recenti.map(m => `
    <div class="recent-card">
      <h4 class="card-date">${m.data}</h4>
      <span class="card-emoji">${m.emozione ? m.emozione : '<span class="card-emoji-placeholder">+ emozione?</span>'}</span>
    </div>
  `).join('');
}

// ==========================================
// 3. NAVIGAZIONE DINAMICA TRA LE SCHERMATE (SPA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setCurrentData();

  const allViews = document.querySelectorAll('.view-section');
  const allMenuButtons = document.querySelectorAll('.menu-btn');
  const textSelectedRange = document.getElementById('current-fascia-text');
  const inputTesto = document.getElementById('memory-text-input');

  function showView(idView) {
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

    if (idView === 'view-ricordi') {
      renderSavedMemories();
    }
  }

  // Eventi Menu
  allMenuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nameView = btn.getAttribute('data-view');
      showView(`view-${nameView}`);
    });
  });

  // Gestione click sulle card delle Emozioni
  const emotionCards = document.querySelectorAll('.emotion-card');
  emotionCards.forEach(card => {
    if (card.getAttribute('data-emotion') === emozioneSelezionataOggi) {
      card.classList.add('selected-emotion');
    }

    card.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      emozioneSelezionataOggi = btn.getAttribute('data-emotion');
      localStorage.setItem('diario_emozione_oggi', emozioneSelezionataOggi);

      emotionCards.forEach(c => c.classList.remove('selected-emotion'));
      btn.classList.add('selected-emotion');

      setTimeout(() => {
        showView('view-home');
      }, 300);
    });
  });

  // Eventi Bottoni "+ Nuovo ricordo"
  const btnsNewMemory = document.querySelectorAll('.add-memory-btn');
  btnsNewMemory.forEach(pulsante => {
    pulsante.addEventListener('click', (e) => {
      const btnElement = e.currentTarget;
      const range = btnElement.getAttribute('data-fascia') || 'Mattina';
      
      if (textSelectedRange) {
        textSelectedRange.textContent = range;
      }
      
      showView('view-create-memory');
    });
  });

  // Evento Tasto Salva
  const btnSave = document.getElementById('btn-save-memory');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const fasciaCorrente = textSelectedRange ? textSelectedRange.textContent : 'Mattina';
      const testoInserito = inputTesto.value;

      if (saveMemory(fasciaCorrente, testoInserito)) {
        inputTesto.value = ''; 
        showView('view-ricordi');
      }
    });
  }

  // Evento Tasto Home / Indietro
  document.addEventListener('click', (e) => {
    const eButtonHome = e.target.closest('.btn-go-home') || 
                          e.target.id === 'btn-back-to-home' || 
                          e.target.id === 'btn-cancel-memory';

    if (eButtonHome) {
      showView('view-home');
    }
  });

  // Caricamento iniziale
  renderSavedMemories();
});