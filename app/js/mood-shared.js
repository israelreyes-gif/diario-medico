// Constantes y utilidades compartidas por todo el módulo de Estado de ánimo

const MOOD_EMOTIONS = [
  { id: 'alegria', emo: '😄', label: 'Alegría' },
  { id: 'calma', emo: '😌', label: 'Calma' },
  { id: 'ilusion', emo: '🤩', label: 'Ilusión' },
  { id: 'cansancio', emo: '🥱', label: 'Cansancio' },
  { id: 'tristeza', emo: '😢', label: 'Tristeza' },
  { id: 'enfado', emo: '😠', label: 'Enfado' },
  { id: 'agobio', emo: '😖', label: 'Agobio' },
  { id: 'ansiedad', emo: '😟', label: 'Ansiedad' },
];

const MOOD_SLOTS = [
  { id: 'manana', label: 'Mañana', range: '5:00–13:00', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/>' },
  { id: 'tarde', label: 'Tarde', range: '13:00–20:00', icon: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/>' },
  { id: 'noche', label: 'Noche', range: '20:00–5:00', icon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
];

function toISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fechaHoyISO() {
  return toISO(new Date());
}

function franjaActivaAhora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 13) return 'manana';
  if (hora >= 13 && hora < 20) return 'tarde';
  return 'noche';
}

function promedioDia(dia) {
  const niveles = [dia.manana, dia.tarde, dia.noche].filter(Boolean).map(f => f.intensidad);
  if (niveles.length === 0) return null;
  return niveles.reduce((a, b) => a + b, 0) / niveles.length;
}

function colorNivel(n) {
  return { 1: 'var(--mood1)', 2: 'var(--mood2)', 3: 'var(--mood3)', 4: 'var(--mood4)', 5: 'var(--mood5)' }[Math.round(n)];
}

function colorPorDistanciaAlCentro(n) {
  const dist = Math.abs(n - 3);
  if (dist >= 1.5) return 'var(--mood1)';
  if (dist >= 0.5) return 'var(--mood2)';
  return 'var(--mood3)';
}

function nivelLabelTexto(n) {
  if (n === null) return 'Sin datos';
  const r = Math.round(n);
  return { 1: 'Muy bajo', 2: 'Bajo', 3: 'Neutro', 4: 'Alto', 5: 'Muy alto' }[r] || 'Neutro';
}
