// Calendario mensual con un punto de color por día

let moodCalYear = new Date().getFullYear();
let moodCalMonth = new Date().getMonth() + 1; // 1-12
let moodCalData = [];

async function loadMoodMonth(year, mes) {
  try {
    const res = await apiFetch(`/estado-animo-mes?year=${year}&mes=${mes}`);
    const data = await res.json();
    moodCalData = data.dias || [];
  } catch (err) {
    moodCalData = [];
  }
  renderMoodCalendar(year, mes);
}

function moodChangeMonth(delta) {
  moodCalMonth += delta;
  if (moodCalMonth > 12) { moodCalMonth = 1; moodCalYear++; }
  if (moodCalMonth < 1) { moodCalMonth = 12; moodCalYear--; }
  loadMoodMonth(moodCalYear, moodCalMonth);
}

function renderMoodCalendar(year, mes) {
  const nombreMes = new Date(year, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  document.getElementById('moodCalMonthLabel').textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const primerDiaSemana = (new Date(year, mes - 1, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(year, mes, 0).getDate();
  const hoyISO = fechaHoyISO();

  const datosPorFecha = {};
  moodCalData.forEach(d => { datosPorFecha[d.fecha] = d; });

  let html = ['L','M','X','J','V','S','D'].map(d => `<div class="cal-dow">${d}</div>`).join('');

  for (let i = 0; i < primerDiaSemana; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaISO = `${year}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const esHoy = fechaISO === hoyISO;
    const datosDia = datosPorFecha[fechaISO];
    const promedio = datosDia ? promedioDia(datosDia) : null;
    const dot = promedio !== null ? `<div class="dot" style="background:${colorNivel(promedio)}"></div>` : '';

    html += `<div class="cal-day ${esHoy ? 'today' : ''}">${dia}${dot}</div>`;
  }

  document.getElementById('moodCalGrid').innerHTML = html;
}
