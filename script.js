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

  function applyContactReveal(container){
    if (!container) return;

    const labelMatches = [/^email\s*:$/i, /^phone\s*:$/i, /^telefono\s*:$/i];

    // Find list items or paragraphs that contain a bold label and a value
    const candidates = container.querySelectorAll('li, p');
    candidates.forEach(node => {
      // Find a <strong> that looks like Email:, Phone:, Telefono:
      const strong = Array.from(node.querySelectorAll('strong')).find(s => {
        const t = s.textContent.trim();
        return labelMatches.some(rx => rx.test(t));
      });
      if (!strong) return;

      // Gather following text nodes and inline nodes after the label as the value
      const parts = [];
      let seen = false;
      node.childNodes.forEach(ch => {
        if (ch === strong) { seen = true; return; }
        if (!seen) return;
        parts.push(ch);
      });
      if (!parts.length) return;

      // Extract plain text value (fallback)
      const temp = document.createElement('span');
      parts.forEach(p => temp.appendChild(p.cloneNode(true)));
      const valueText = temp.textContent.trim();
      if (!valueText) return;

      // Clear existing value from node
      parts.forEach(p => p.remove());

      // Build reveal element
      const reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.className = 'click-to-reveal';
      reveal.setAttribute('data-value', valueText);
      reveal.setAttribute('aria-label', 'Reveal contact');
      reveal.textContent = 'Click to reveal';
      reveal.addEventListener('click', () => {
        // Replace the button with the actual text value
        const textNode = document.createTextNode(' ' + reveal.getAttribute('data-value'));
        reveal.replaceWith(textNode);
      });

      // Insert a space then the button after the label
      node.appendChild(document.createTextNode(' '));
      node.appendChild(reveal);
    });
  }

  function maskContactsInMarkdown(text){
    let out = text;
    const patterns = [
      /(^|\n)(\s*-\s*\*\*Email:\*\*\s*)(.+)(?=\n|$)/gi,
      /(^|\n)(\s*-\s*\*\*Phone:\*\*\s*)(.+)(?=\n|$)/gi,
      /(^|\n)(\s*-\s*\*\*Telefono:\*\*\s*)(.+)(?=\n|$)/gi
    ];
    patterns.forEach(rx => {
      out = out.replace(rx, (m, p0, p1) => `${p0}${p1}[hidden]`);
    });
    return out;
  }

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
        codeEl.textContent = maskContactsInMarkdown(text);
        try{
          if (window.marked) {
            renderedEl.innerHTML = marked.parse(text);
            // After rendering, hide contact info until clicked
            applyContactReveal(renderedEl);
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
