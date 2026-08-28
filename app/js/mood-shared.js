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

function toISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fechaHoyISO() {
  return toISO(new Date());
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
