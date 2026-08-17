// Histórico: fotos completas del pastillero, con lo actual y lo anterior comparados

async function toggleHistory(show) {
  const el = document.getElementById('historyOverlay');
  if (show) {
    const tl = document.getElementById('timeline');
    tl.innerHTML = 'Cargando...';
    try {
      const res = await apiFetch('/historico');
      const data = await res.json();
      const snapshots = data.historico || [];

      const ultimoIgualAAhora = snapshots.length > 0 && sonListasIguales(snapshots[0].medicamentos, meds);
      const ordered = ultimoIgualAAhora
        ? [{ creado_en: 'Ahora', medicamentos: meds, isCurrent: true }, ...snapshots.slice(1)]
        : [{ creado_en: 'Ahora', medicamentos: meds, isCurrent: true }, ...snapshots];

      if (ordered.length <= 1 && meds.length === 0) {
        tl.innerHTML = '<p style="color:var(--ink-soft); font-size:13.5px; text-align:center; padding:20px 0;">Todavía no hay histórico.</p>';
      } else {
        tl.innerHTML = ordered.map((snap, i) => {
          const prev = ordered[i + 1];
          const rows = snap.medicamentos.length
            ? snap.medicamentos.map(m => {
                const dose = [fmtDose(m.desayuno), fmtDose(m.comida), fmtDose(m.cena)].filter(Boolean).join(' · ') || 'sin dosis';
                const prevMatch = prev ? prev.medicamentos.find(p => p.nombre === m.nombre) : null;
                const changed = prev && (!prevMatch || prevMatch.desayuno !== m.desayuno || prevMatch.comida !== m.comida || prevMatch.cena !== m.cena);
                return `<div class="snap-med ${changed ? 'changed' : ''}"><span class="n">${m.nombre}</span><span class="d">${dose}</span></div>`;
              }).join('')
            : '<div class="snap-empty">Sin medicación registrada</div>';

          const fecha = snap.isCurrent ? 'Ahora' : 'Desde ' + formatFecha(snap.creado_en);

          return `
            <div class="snap-card ${snap.isCurrent ? 'current' : ''}">
              <div class="snap-head">
                <span class="snap-title">${fecha}</span>
                <span class="snap-badge ${snap.isCurrent ? '' : 'past'}">${snap.isCurrent ? 'Actual' : 'Anterior'}</span>
              </div>
              ${rows}
            </div>`;
        }).join('');
      }
    } catch (err) {
      tl.innerHTML = '<p style="color:#B23B3B; font-size:13px;">Error al cargar el histórico.</p>';
      console.error(err);
    }
  }
  el.classList.toggle('show', show);
}
