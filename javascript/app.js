// ==========================================
// GESTIONE DATA DINAMICA IN TEMPO REALE
// ==========================================
function setCurrentData() {
  const today = new Date();
  
  // Nome del giorno della settimana con la prima lettera maiuscola (es. "Venerdì")
  const dayOptions = { weekday: 'long' };
  let dayName = today.toLocaleDateString('it-IT', dayOptions);
  dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  // Data estesa (es. "19 giugno 2026")
  const dataOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const dataEstesa = today.toLocaleDateString('it-IT', dataOptions);

  // Selezione elementi HTML nel banner data
  const titleDataElement = document.querySelector('.date-text h2');
  const elementUnderData = document.querySelector('.date-text p');

  if (titleDataElement && elementUnderData) {
    titleDataElement.textContent = `Oggi è ${dayName}`;
    elementUnderData.textContent = dataEstesa;
  }
}

// ==========================================
// NAVIGAZIONE DINAMICA E GESTIONE VISTE (SPA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // imposto la data esatta all'avvio dell'applicazione
  setCurrentData();

  // Selezione di tutte le schermate e di tutti i bottoni del menu
  const allViews = document.querySelectorAll('.view-section');
  const allMenuButtons = document.querySelectorAll('.menu-btn');

  /**
   * Funzione principale per mostrare una schermata specifica e nascondere le altre
   * @param {string} idView - L'ID dell'elemento HTML della schermata da mostrare
   */
  function showView(idView) {
    // 1. Nascondo tutte le sezioni
    allViews.forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });

    // 2. Rendo visibile solo la sezione richiesta
    const viewToBeShown = document.getElementById(idView);
    if (viewToBeShown) {
      viewToBeShown.classList.remove('hidden');
      viewToBeShown.classList.add('active');
    }

    // 3. Aggiorno lo stato visivo (bordo blu) del pulsante attivo nel menu
    allMenuButtons.forEach(btn => {
      const linkedView = btn.getAttribute('data-view');
      if (linkedView === 'home' && idView === 'view-home') {
        btn.classList.add('active');
      } else if (`view-${linkedView}` === idView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // CLICK SUI PULSANTI DEL MENU IN ALTO
  allMenuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nameView = btn.getAttribute('data-view');
      
      if (nameView === 'home') {
        showView('view-home');
      } else {
        showView(`view-${nameView}`);
      }
    });
  });

  //CLICK SUI PULSANTI "+ NUOVO RICORDO"
  const btnsNewMemory = document.querySelectorAll('.add-memory-btn');
  const textSelectedRange = document.getElementById('current-fascia-text');

  btnsNewMemory.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Leggo la fascia oraria (Mattina, Pomeriggio, Sera) dal pulsante cliccato
      const btnElement = e.currentTarget;
      const range = e.target.getAttribute('data-fascia') || 'Mattina';
      
      // Aggiorno l'indicazione di testo nella schermata di scrittura
      if (textSelectedRange) {
        textSelectedRange.textContent = range;
      }
      
      // Mostro la schermata di creazione ricordo
      showView('view-create-memory');
    });
  });

  //CLICK UNIVERSALE PER TORNARE ALLA HOME
  document.addEventListener('click', (e) => {
    const eButtonHome = e.target.closest('.btn-go-home') || 
                          e.target.id === 'btn-back-to-home' || 
                          e.target.id === 'btn-cancel-memory';

    if (eButtonHome) {
      showView('view-home');
    }
  });
});