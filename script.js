(function(){
  const mds = {
    en: 'Andrea Bovi CV - EN.md',
    ita: 'Andrea Bovi CV - ITA.md'
  };

  const state = { current: 'en' };
  const codeEl = document.getElementById('cvCode');
  const renderedEl = document.getElementById('cvRendered');
  const tabButtons = Array.from(document.querySelectorAll('.tab'));
  const fileTabs = Array.from(document.querySelectorAll('.file-tab'));
  const sidebarFiles = Array.from(document.querySelectorAll('.tree .file'));
  const downloadBtn = document.getElementById('downloadMdBtn');
  const saveBtn = document.getElementById('savePdfBtn');

  function setLang(lang){
    if(!mds[lang]) return;
    state.current = lang;

    // Update top tab buttons
    tabButtons.forEach(b => {
      const active = b.dataset.lang === lang;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });

    // Update editor header file tabs
    fileTabs.forEach(t => t.classList.toggle('active', t.dataset.lang === lang));

    // Update sidebar selection (visual only)
    sidebarFiles.forEach(li => li.classList.toggle('active', li.dataset.open === lang));

    // Load markdown content
    const path = mds[lang];
    fetch(encodeURI(path))
      .then(r => r.ok ? r.text() : Promise.reject(new Error(r.statusText)))
      .then(text => {
        codeEl.textContent = text;
        try{
          if (window.marked) {
            renderedEl.innerHTML = marked.parse(text);
          } else {
            renderedEl.textContent = 'Markdown renderer not loaded';
          }
        }catch(err){
          renderedEl.textContent = 'Failed to render markdown';
        }
      })
      .catch(() => {
        codeEl.textContent = '// Failed to load ' + path;
        renderedEl.textContent = 'Failed to load ' + path;
      });
  }

  // Tab bar events
  tabButtons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  // Sidebar file clicks
  sidebarFiles.forEach(li => li.addEventListener('click', () => setLang(li.dataset.open)));

  // Download current Markdown file
  downloadBtn.addEventListener('click', () => {
    const path = mds[state.current];
    const a = document.createElement('a');
    a.href = encodeURI(path);
    a.download = path; // keep original filename
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // Save page as PDF (opens print dialog)
  if (saveBtn) {
    saveBtn.addEventListener('click', () => window.print());
  }

  // Keyboard shortcuts (Ctrl/Cmd+Tab to toggle)
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'tab'){
      e.preventDefault();
      setLang(state.current === 'en' ? 'ita' : 'en');
    }
  });

  // Initialize
  setLang('en');
})();
