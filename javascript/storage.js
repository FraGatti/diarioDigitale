export function normalizzaTesto(testo) {
  if (!testo) return '';
  return testo
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\b(il|lo|la|i|gli|le|un|uno|una|in|a|da|su|per|con|tra|fra|di|del|della|dello|dei|degli|delle)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sonoEntitaSimili(nome1, nome2) {
  const n1 = normalizzaTesto(nome1);
  const n2 = normalizzaTesto(nome2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return false;
}

export function getMemories() {
  try {
    const memories = localStorage.getItem('diario_ricordi');
    return memories ? JSON.parse(memories) : [];
  } catch (e) {
    console.error("Errore lettura ricordi dal LocalStorage:", e);
    return [];
  }
}

export function saveMemory(fascia, testo, emozione, immagine = null) {
  try {
    const newMemory = {
      id: Date.now(),
      data: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
      fascia: fascia,
      testo: testo,
      emozione: emozione || '😊',
      immagine: immagine 
    };

    const currentMemories = getMemories();
    currentMemories.unshift(newMemory);
    localStorage.setItem('diario_ricordi', JSON.stringify(currentMemories));
    return true;
  } catch (e) {
    console.error("Errore salvataggio ricordo:", e);
    return false;
  }
}

export function updateMemoryText(id, nuovoTesto) {
  try {
    const memories = getMemories();
    const index = memories.findIndex(m => m.id === id);
    if (index !== -1) {
      memories[index].testo = nuovoTesto;
      localStorage.setItem('diario_ricordi', JSON.stringify(memories));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Errore aggiornamento ricordo:", e);
    return false;
  }
}

export function deleteMemory(id) {
  try {
    const memories = getMemories();
    const filteredMemories = memories.filter(m => m.id !== id);
    localStorage.setItem('diario_ricordi', JSON.stringify(filteredMemories));
    return true;
  } catch (e) {
    console.error("Errore cancellazione ricordo:", e);
    return false;
  }
}

export function getPersone() {
  try {
    const persone = localStorage.getItem('diario_persone');
    return persone ? JSON.parse(persone) : [];
  } catch (e) {
    console.error("Errore lettura persone dal LocalStorage:", e);
    return [];
  }
}

export function addPersona(nome, ruolo = 'Caregiver/Amico', emoji = '👤') {
  if (!nome || !nome.trim()) return false;
  const nomePulito = nome.trim();
  const persone = getPersone();

  if (persone.some(p => sonoEntitaSimili(p.nome, nomePulito))) {
    return false;
  }

  persone.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    nome: nomePulito,
    ruolo: ruolo || 'Caregiver/Amico',
    emoji: emoji || '👤'
  });

  localStorage.setItem('diario_persone', JSON.stringify(persone));
  return true;
}

export function deletePersona(id) {
  try {
    const persone = getPersone();
    const filteredPersone = persone.filter(p => p.id !== id);
    localStorage.setItem('diario_persone', JSON.stringify(filteredPersone));
    return true;
  } catch (e) {
    console.error("Errore cancellazione persona:", e);
    return false;
  }
}

export function getPassioni() {
  try {
    const passioni = localStorage.getItem('diario_passioni');
    return passioni ? JSON.parse(passioni) : [];
  } catch (e) {
    console.error("Errore lettura passioni dal LocalStorage:", e);
    return [];
  }
}

export function addPassione(nome, emoji = '⭐') {
  if (!nome || !nome.trim()) return false;
  const nomePulito = nome.trim();
  const passioni = getPassioni();

  if (passioni.some(p => sonoEntitaSimili(p.nome, nomePulito))) {
    return false; 
  }

  passioni.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    nome: nomePulito,
    emoji: emoji || '⭐'
  });

  localStorage.setItem('diario_passioni', JSON.stringify(passioni));
  return true;
}

export function deletePassione(id) {
  try {
    const passioni = getPassioni();
    const filteredPassioni = passioni.filter(p => p.id !== id);
    localStorage.setItem('diario_passioni', JSON.stringify(filteredPassioni));
    return true;
  } catch (e) {
    console.error("Errore cancellazione passione:", e);
    return false;
  }
}