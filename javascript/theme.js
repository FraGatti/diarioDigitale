let toastTimeout = null;

export function applicaPalette(nomeTema) {
  const temiValidi = ['theme-blu', 'theme-natura', 'theme-rosa', 'theme-solare'];
  if (!temiValidi.includes(nomeTema)) nomeTema = 'theme-blu';

  document.body.classList.remove(...temiValidi);
  document.body.classList.add(nomeTema);
  localStorage.setItem('diario_palette', nomeTema);

  document.querySelectorAll('.palette-btn').forEach(btn => {
    if (btn.getAttribute('data-theme') === nomeTema) {
      btn.classList.add('active-theme');
    } else {
      btn.classList.remove('active-theme');
    }
  });
}

export function caricaPaletteIniziale() {
  const temaSalvato = localStorage.getItem('diario_palette') || 'theme-blu';
  applicaPalette(temaSalvato);
}

export function showToastAlert(messaggio, emoji = '🌟') {
  let toast = document.getElementById('app-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <span id="toast-icon" class="toast-emoji">${emoji}</span>
      <div id="toast-message" class="toast-text">${messaggio}</div>
    `;
    document.body.appendChild(toast);
    toast.addEventListener('click', () => toast.classList.remove('show'));
  }

  const toastIcon = document.getElementById('toast-icon');
  const toastMsg = document.getElementById('toast-message');

  if (toastIcon) toastIcon.textContent = emoji;
  if (toastMsg) toastMsg.textContent = messaggio;

  toast.classList.remove('border-happy', 'border-sad', 'border-angry');

  if (['😊', '😍', '😌', '🧘'].includes(emoji)) {
    toast.classList.add('border-happy');
  } else if (['😢', '😴', '🥱'].includes(emoji)) {
    toast.classList.add('border-sad');
  } else if (['😠', '😤'].includes(emoji)) {
    toast.classList.add('border-angry');
  }

  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}