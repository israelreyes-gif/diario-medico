// Cambia entre las pestañas de la sección Bienestar: Ánimo y Constantes.
// El calendario, la leyenda y los resúmenes de debajo son compartidos y no dependen de la pestaña.

function switchBienestarTab(tab) {
  const panelAnimo = document.getElementById('tabPanelAnimo');
  const panelConstantes = document.getElementById('tabPanelConstantes');
  const btnAnimo = document.getElementById('tabBtnAnimo');
  const btnConstantes = document.getElementById('tabBtnConstantes');

  if (tab === 'animo') {
    panelAnimo.classList.remove('hide');
    panelConstantes.classList.add('hide');
    btnAnimo.classList.add('active');
    btnConstantes.classList.remove('active');
  } else {
    panelAnimo.classList.add('hide');
    panelConstantes.classList.remove('hide');
    btnConstantes.classList.add('active');
    btnAnimo.classList.remove('active');
  }
}
