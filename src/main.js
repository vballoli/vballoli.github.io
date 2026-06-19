/* ============================================
   Vaibhav Balloli — Personal Website Scripts
   ============================================ */

/* ---------- Theme: light / dark / sepia / system (default: system) ---------- */
(function () {
  var STORAGE_KEY = 'theme-preference';
  var validModes = ['light', 'dark', 'sepia', 'system'];
  var root = document.documentElement;

  function getStored() {
    var v = localStorage.getItem(STORAGE_KEY);
    return validModes.indexOf(v) !== -1 ? v : 'system';
  }

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', 'Theme: ' + mode + ' (click to cycle)');
  }

  apply(getStored());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    apply(getStored());
    btn.addEventListener('click', function () {
      var current = getStored();
      var next = validModes[(validModes.indexOf(current) + 1) % validModes.length];
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    });
  });
})();

/* ---------- Featured Cards ---------- */
(function () {
  document.querySelectorAll('.paper-card[data-tags]').forEach(function (card) {
    var tags = card.getAttribute('data-tags').split(',').map(function (t) { return t.trim(); });
    if (tags.indexOf('featured') !== -1) {
      card.classList.add('paper-card--featured');
    }
  });
})();

/* ---------- Research Filters ---------- */
(function () {
  var filters = document.getElementById('research-filters');
  var cards = document.querySelectorAll('.paper-card[data-tags]');
  var searchTag = null; // dynamic "Search: ..." button

  function applyFilter(filter) {
    cards.forEach(function (card) {
      if (filter === 'all') {
        card.classList.remove('paper-card--hidden');
      } else {
        var tags = card.dataset.tags.split(',').map(function (t) { return t.trim(); });
        if (tags.includes(filter)) {
          card.classList.remove('paper-card--hidden');
        } else {
          card.classList.add('paper-card--hidden');
        }
      }
    });
  }

  function removeSearchTag() {
    if (searchTag && searchTag.parentNode) {
      searchTag.parentNode.removeChild(searchTag);
      searchTag = null;
    }
  }

  function clearActiveFilters() {
    // Query dynamically to include clones added later
    filters.querySelectorAll('.filter-tag').forEach(function (b) { b.classList.remove('filter-tag--active'); });
    removeSearchTag();
  }

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tag');
    if (!btn) return;

    clearActiveFilters();
    // Activate all buttons with same filter value (handles clones)
    var filterVal = btn.dataset.filter;
    filters.querySelectorAll('.filter-tag').forEach(function (b) {
      if (b.dataset.filter === filterVal) b.classList.add('filter-tag--active');
    });
    applyFilter(filterVal);
  });

  // Initialize filter based on default active button
  var activeBtn = filters.querySelector('.filter-tag--active');
  if (activeBtn) {
    applyFilter(activeBtn.dataset.filter);
  }

  // Expose search filter for the command palette
  window.__applySearchFilter = function (query) {
    if (!query) return;
    clearActiveFilters();

    // Build haystack for each card and filter
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    cards.forEach(function (card) {
      var title = (card.querySelector('.paper-card__title') || {}).textContent || '';
      var authors = (card.querySelector('.paper-card__authors') || {}).textContent || '';
      var desc = (card.querySelector('.paper-card__desc') || {}).textContent || '';
      var venue = (card.querySelector('.paper-card__venue') || {}).textContent || '';
      var keywords = card.dataset.keywords || '';
      var tags = card.dataset.tags || '';
      var haystack = [title, authors, desc, venue, keywords, tags].join(' ').toLowerCase();
      var match = words.every(function (w) { return haystack.indexOf(w) !== -1; });
      card.classList.toggle('paper-card--hidden', !match);
    });
  };
})();

/* ---------- Filter Pill Visibility + Inline Search + FLIP Animation ---------- */
(function () {
  var research = document.getElementById('research');
  var pill = document.getElementById('filter-pill');
  var pillInput = document.getElementById('filter-pill-input');
  var pillAnchor = document.getElementById('pill-anchor');
  var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  pillInput.placeholder = 'Search papers by keyword or topic (' + (isMac ? '⌘K' : 'Ctrl+K') + ')';
  var filters = document.getElementById('research-filters');
  var cards = document.querySelectorAll('.paper-card[data-tags]');
  var ticking = false;

  // Track pill state: 'inline' | 'fixed' | 'hidden'
  var pillState = 'inline';
  var isAnimating = false;

  // Category color map
  var filterColors = {
    'human-ai': { c: '#7e22ce', bg: 'rgba(126,34,206,0.15)' },
    'llms': { c: '#92400e', bg: 'rgba(146,64,14,0.15)' },
    'vision': { c: '#1e40af', bg: 'rgba(30,64,175,0.15)' },
    'real-time': { c: '#991b1b', bg: 'rgba(153,27,27,0.15)' },
    'systems': { c: '#166534', bg: 'rgba(22,101,52,0.15)' }
  };

  // Apply category hover colors via CSS custom properties
  function applyFilterColors() {
    filters.querySelectorAll('.filter-tag[data-filter]').forEach(function (btn) {
      var fc = filterColors[btn.dataset.filter];
      if (fc) {
        btn.style.setProperty('--filter-hover-color', fc.c);
        btn.style.setProperty('--filter-hover-bg', fc.bg);
        btn.style.setProperty('--filter-hover-border', fc.c);
      }
    });
  }
  applyFilterColors();

  // --- (a) Search feedback: result count badge ---
  var badge = document.createElement('span');
  badge.className = 'filter-pill__badge';
  badge.style.display = 'none';
  pill.querySelector('.filter-pill__search-wrap').appendChild(badge);

  function updateBadge() {
    var visible = 0;
    cards.forEach(function (c) { if (!c.classList.contains('paper-card--hidden')) visible++; });
    var query = pillInput.value.trim();
    if (query) {
      badge.textContent = visible + ' result' + (visible !== 1 ? 's' : '');
      badge.style.display = '';
      pill.classList.add('filter-pill--searching');
    } else {
      badge.style.display = 'none';
      pill.classList.remove('filter-pill--searching');
    }
  }

  // --- (b) Infinite scroll: triple-clone the tags for seamless looping ---
  var originalBtns = Array.from(filters.querySelectorAll('.filter-tag'));
  var setCount = 3; // before + center + after

  // Clone two extra sets
  for (var s = 0; s < setCount - 1; s++) {
    originalBtns.forEach(function (btn) {
      var clone = btn.cloneNode(true);
      clone.classList.remove('filter-tag--active');
      filters.appendChild(clone);
    });
  }

  var allBtns = filters.querySelectorAll('.filter-tag');
  var centerStartIdx = originalBtns.length; // index where center set begins
  var totalPerSet = originalBtns.length;

  // Scroll the active tag to center of the strip
  function scrollToCenter(btn, smooth) {
    var containerRect = filters.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    var offset = btnRect.left - containerRect.left - (containerRect.width / 2) + (btnRect.width / 2);
    filters.scrollBy({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
  }

  // On initial load, mark all "Featured" clones active and center the one in the center set
  allBtns.forEach(function (b) {
    if (b.dataset.filter === 'featured') b.classList.add('filter-tag--active');
  });
  requestAnimationFrame(function () {
    var centerFeatured = allBtns[centerStartIdx]; // first of center set = Featured
    if (centerFeatured) scrollToCenter(centerFeatured, false);
  });

  // Convert vertical wheel scroll to horizontal on the tag strip
  filters.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      filters.scrollLeft += e.deltaY;
    }
  }, { passive: false });


  var snapTimeout = null;
  filters.addEventListener('scroll', function () {
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(function () {
      var scrollLeft = filters.scrollLeft;
      var scrollWidth = filters.scrollWidth;
      var clientWidth = filters.clientWidth;
      var oneSetWidth = scrollWidth / setCount;

      // If scrolled into the first clone set, jump forward
      if (scrollLeft < oneSetWidth * 0.3) {
        filters.scrollLeft = scrollLeft + oneSetWidth;
      }
      // If scrolled into the last clone set, jump back
      else if (scrollLeft > oneSetWidth * 1.7) {
        filters.scrollLeft = scrollLeft - oneSetWidth;
      }
    }, 120);
  }, { passive: true });

  // Handle click on any filter tag (original or clone) — delegate
  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tag');
    if (!btn) return;

    // Clear search input
    pillInput.value = '';

    // Clear all active states across all clones
    allBtns.forEach(function (b) { b.classList.remove('filter-tag--active'); });

    // Activate all buttons with same filter value
    var filterVal = btn.dataset.filter;
    allBtns.forEach(function (b) {
      if (b.dataset.filter === filterVal) b.classList.add('filter-tag--active');
    });

    // Scroll clicked button to center
    scrollToCenter(btn, true);

    updateBadge();
  });

  // ======================================================
  // FLIP animation: inline ↔ fixed transition
  // ======================================================

  function setPillState(cls) {
    pill.classList.remove('filter-pill--inline', 'filter-pill--fixed', 'filter-pill--hidden', 'filter-pill--visible');
    // Always clear inline transform so CSS class transform takes effect cleanly
    pill.style.transform = '';
    pill.style.transition = '';
    pill.classList.add(cls);
  }

  // Animate pill from its current visual position to a new state using FLIP
  function flipTo(targetClass) {
    if (isAnimating) return;
    isAnimating = true;

    // FIRST: capture current visual position
    var firstRect = pill.getBoundingClientRect();

    // Apply target state instantly (no transition, clear inline transform)
    pill.style.transition = 'none';
    pill.style.transform = '';
    pill.classList.remove('filter-pill--inline', 'filter-pill--fixed', 'filter-pill--hidden', 'filter-pill--visible');
    pill.classList.add(targetClass);

    // Force layout recalc so target position is computed
    void pill.offsetHeight;

    // LAST: capture target visual position
    var lastRect = pill.getBoundingClientRect();

    // INVERT: calculate delta from target back to original
    var dx = firstRect.left - lastRect.left;
    var dy = firstRect.top - lastRect.top;

    // Compose the inverted offset with the target's base transform
    if (targetClass === 'filter-pill--fixed') {
      // Fixed state base: translateX(-50%)
      pill.style.transform = 'translateX(-50%) translate(' + dx + 'px, ' + dy + 'px)';
    } else {
      // Inline state base: none
      pill.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }

    // Force layout so the inverted position is rendered
    void pill.offsetHeight;

    // PLAY: animate to final position
    pill.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

    if (targetClass === 'filter-pill--fixed') {
      pill.style.transform = 'translateX(-50%)';
    } else {
      pill.style.transform = 'none';
    }

    function onEnd() {
      pill.removeEventListener('transitionend', onEnd);
      // Clear inline styles so CSS classes own the transforms
      pill.style.transition = '';
      pill.style.transform = '';
      isAnimating = false;
    }

    pill.addEventListener('transitionend', onEnd);

    // Safety timeout
    setTimeout(function () {
      if (isAnimating) onEnd();
    }, 550);
  }

  // --- Pill visibility + state management ---
  function check() {
    if (isAnimating) return;

    var researchRect = research.getBoundingClientRect();
    var anchorRect = pillAnchor.getBoundingClientRect();
    var viewportH = window.innerHeight;

    // Is the research section meaningfully in view?
    var researchInView = researchRect.top <= viewportH * 0.6 && researchRect.bottom > viewportH * 0.2;

    // Has the anchor's bottom scrolled above the viewport top?
    var anchorAbove = anchorRect.bottom < 0;

    // When pill is inline, it scrolls naturally — never force-hide it.
    // Only hide when transitioning from the fixed state.
    if (pillState === 'inline') {
      if (researchInView && anchorAbove) {
        pillState = 'fixed';
        flipTo('filter-pill--fixed');
      }
      // else: stay inline, scroll naturally
    } else if (pillState === 'fixed') {
      if (!researchInView) {
        setPillState('filter-pill--hidden');
        pillState = 'hidden';
      } else if (!anchorAbove) {
        pillState = 'inline';
        flipTo('filter-pill--inline');
      }
    } else if (pillState === 'hidden') {
      if (researchInView && anchorAbove) {
        // Slide up into fixed
        setPillState('filter-pill--hidden');
        void pill.offsetHeight;
        pill.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease';
        pill.classList.remove('filter-pill--hidden');
        pill.classList.add('filter-pill--fixed');
        pill.style.transform = '';
        setTimeout(function () { pill.style.transition = ''; }, 500);
        pillState = 'fixed';
      } else if (researchInView && !anchorAbove) {
        setPillState('filter-pill--inline');
        pillState = 'inline';
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { check(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  check();

  // --- Inline search ---
  var debounceTimer = null;
  pillInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var query = pillInput.value.trim();
    debounceTimer = setTimeout(function () {
      if (query) {
        window.__applySearchFilter(query);
        // Deactivate all filter tags when searching
        allBtns.forEach(function (b) { b.classList.remove('filter-tag--active'); });
      } else {
        // Empty — restore featured filter
        var featuredBtn = filters.querySelector('.filter-tag[data-filter="featured"]');
        if (featuredBtn) featuredBtn.click();
      }
      updateBadge();
    }, 200);
  });
})();


/* ---------- Per-Paper Tag Pills ---------- */
(function () {
  var tagMeta = {
    'human-ai': { label: 'Human-AI', bg: 'rgba(126,34,206,0.10)', c: '#7e22ce', b: 'transparent' },
    'llms': { label: 'LLMs', bg: 'rgba(146,64,14,0.10)', c: '#92400e', b: 'transparent' },
    'vision': { label: 'Vision', bg: 'rgba(30,64,175,0.10)', c: '#1e40af', b: 'transparent' },
    'real-time': { label: 'Real-Time', bg: 'rgba(153,27,27,0.10)', c: '#991b1b', b: 'transparent' },
    'systems': { label: 'Systems', bg: 'rgba(22,101,52,0.10)', c: '#166534', b: 'transparent' }
  };

  function applyColors() {
    document.querySelectorAll('.paper-card__tag').forEach(function (el) {
      var m = tagMeta[el.dataset.tagType];
      if (!m) return;
      el.style.setProperty('--tag-bg', m.bg);
      el.style.setProperty('--tag-color', m.c);
      el.style.setProperty('--tag-border', m.b);
    });
  }

  // Generate tag pills
  document.querySelectorAll('.paper-card[data-tags]').forEach(function (card) {
    var tags = card.dataset.tags.split(',').map(function (t) { return t.trim(); })
      .filter(function (t) { return t && t !== 'featured' && tagMeta[t]; });
    if (!tags.length) return;

    var container = document.createElement('div');
    container.className = 'paper-card__tags';
    tags.forEach(function (tag) {
      var el = document.createElement('span');
      el.className = 'paper-card__tag';
      el.dataset.tagType = tag;
      el.textContent = tagMeta[tag].label;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var filterBtn = document.querySelector('.filter-tag[data-filter="' + tag + '"]');
        if (filterBtn) filterBtn.click();
        document.getElementById('research').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      container.appendChild(el);
    });
    card.querySelector('.paper-card__body').appendChild(container);
  });

  applyColors();

})();

/* ---------- Section Nav ---------- */
(function () {
  var navToggle = document.getElementById('nav-toggle');
  var dropdown = document.getElementById('nav-dropdown');
  var links = dropdown.querySelectorAll('.nav-dropdown__link');
  var cmdHint = document.getElementById('cmd-k-hint');

  function syncExpanded() {
    navToggle.setAttribute('aria-expanded', dropdown.classList.contains('nav-dropdown--open') ? 'true' : 'false');
  }

  navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('nav-dropdown--open');
    syncExpanded();
  });

  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== navToggle) {
      dropdown.classList.remove('nav-dropdown--open');
      syncExpanded();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dropdown.classList.contains('nav-dropdown--open')) {
      dropdown.classList.remove('nav-dropdown--open');
      syncExpanded();
      navToggle.focus();
    }
  });

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      dropdown.classList.remove('nav-dropdown--open');
      syncExpanded();
    });
  });

  // Highlight active section
  var sections = ['top', 'news', 'research', 'demos', 'reading'];
  var ticking = false;
  var indicator = document.getElementById('section-indicator');
  var indicatorItems = indicator.querySelectorAll('.section-indicator__item');

  function highlightActive() {
    var scrollY = window.scrollY + 120;
    var active = 'top';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) active = id;
    });
    links.forEach(function (link) {
      link.classList.toggle('nav-dropdown__link--active', link.dataset.section === active);
    });
    // Update floating indicator
    indicatorItems.forEach(function (item) {
      item.classList.toggle('section-indicator__item--active', item.dataset.section === active);
    });
    // Show indicator after scrolling past hero
    indicator.classList.toggle('section-indicator--visible', window.scrollY > 300);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { highlightActive(); ticking = false; }); ticking = true; }
  }, { passive: true });
  highlightActive();

  // Open command palette from dropdown hint
  cmdHint.addEventListener('click', function () {
    dropdown.classList.remove('nav-dropdown--open');
    syncExpanded();
    document.getElementById('cmd-overlay').classList.add('cmd-palette-overlay--open');
    document.getElementById('cmd-input').focus();
  });
})();


/* ---------- Command Palette ---------- */
(function () {
  var overlay = document.getElementById('cmd-overlay');
  var input = document.getElementById('cmd-input');
  var results = document.getElementById('cmd-results');
  var activeIdx = -1;

  // Build search index
  var items = [];
  // Papers — index title, authors, description, venue, and tags
  document.querySelectorAll('.paper, .paper-card').forEach(function (card) {
    var title = (card.querySelector('.paper__title, .paper-card__title') || {}).textContent || '';
    var authors = (card.querySelector('.paper__authors, .paper-card__authors') || {}).textContent || '';
    var desc = (card.querySelector('.paper__desc, .paper-card__desc') || {}).textContent || '';
    var venue = (card.querySelector('.paper__meta, .paper-card__venue') || {}).textContent || '';
    var keywords = card.dataset.keywords || '';
    var tags = (card.dataset.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var haystack = [title, authors, desc, venue, keywords].concat(tags).join(' ').toLowerCase();
    items.push({ type: 'paper', icon: '📄', title: title.trim(), sub: authors.trim(), el: card, haystack: haystack });
  });
  // Sections
  [{ id: 'top', label: 'Home', icon: '🏠' },
  { id: 'news', label: 'News', icon: '📣' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'demos', label: 'Demos', icon: '✨' },
  { id: 'reading', label: 'Reading', icon: '📚' }
  ].forEach(function (s) {
    var el = document.getElementById(s.id);
    if (!el) return;
    items.push({ type: 'section', icon: s.icon, title: s.label, sub: 'Section', el: el, haystack: s.label.toLowerCase() });
  });
  // Filter tags
  document.querySelectorAll('.filter-tag').forEach(function (btn) {
    var label = btn.textContent.trim();
    items.push({ type: 'filter', icon: '🏷', title: 'Filter: ' + label, sub: 'Research filter', el: btn, haystack: label.toLowerCase() });
  });

  function matchItem(query, item) {
    // Simple case-insensitive substring search — split query into words, all must match
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.every(function (w) { return item.haystack.indexOf(w) !== -1; });
  }

  function render(query) {
    results.innerHTML = '';
    activeIdx = -1;
    var filtered = query
      ? items.filter(function (it) {
        return matchItem(query, it);
      })
      : items;

    if (!filtered.length) {
      results.innerHTML = '<div class="cmd-palette__empty">No results found</div>';
      return;
    }

    filtered.forEach(function (it, i) {
      var div = document.createElement('div');
      div.className = 'cmd-palette__item';
      div.dataset.index = i;
      div.innerHTML = '<span class="cmd-palette__item-icon">' + it.icon + '</span>' +
        '<div class="cmd-palette__item-text">' +
        '<div class="cmd-palette__item-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="cmd-palette__item-sub">' + escapeHtml(it.sub) + '</div></div>';
      div.addEventListener('click', function () { selectItem(it); });
      results.appendChild(div);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function selectItem(item) {
    close();
    if (item.type === 'filter') {
      item.el.click();
    } else if (item.el) {
      // If selecting a paper, make sure it's visible by switching to "All" filter
      if (item.type === 'paper' && item.el.classList.contains('paper-card--hidden')) {
        var allBtn = document.querySelector('.filter-tag[data-filter="all"]');
        if (allBtn) allBtn.click();
      }
      item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function open() {
    overlay.classList.add('cmd-palette-overlay--open');
    input.value = '';
    render('');
    setTimeout(function () { input.focus(); }, 50);
  }

  function close() {
    overlay.classList.remove('cmd-palette-overlay--open');
    input.value = '';
  }

  // Keyboard shortcut: Cmd+K / Ctrl+K
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('cmd-palette-overlay--open')) { close(); } else { open(); }
    }
    if (e.key === 'Escape' && overlay.classList.contains('cmd-palette-overlay--open')) {
      close();
    }
    // Arrow nav
    if (!overlay.classList.contains('cmd-palette-overlay--open')) return;
    var itemEls = results.querySelectorAll('.cmd-palette__item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, itemEls.length - 1);
      itemEls.forEach(function (el, i) { el.classList.toggle('cmd-palette__item--active', i === activeIdx); });
      if (itemEls[activeIdx]) itemEls[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      itemEls.forEach(function (el, i) { el.classList.toggle('cmd-palette__item--active', i === activeIdx); });
      if (itemEls[activeIdx]) itemEls[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < itemEls.length) {
        itemEls[activeIdx].click();
      } else {
        // No item selected — apply as a text search filter
        var query = input.value.trim();
        if (query) {
          close();
          window.__applySearchFilter(query);
          document.getElementById('research').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });

  input.addEventListener('input', function () { render(input.value.trim()); });

  // Click outside to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  // Initial render
  render('');

})();

/* ---------- Easter Egg ---------- */
(function () {
  var heroName = document.getElementById('footer-anurag');
  var overlay = document.getElementById('easter-egg-overlay');
  var iframe = document.getElementById('easter-egg-iframe');
  var closeBtn = document.getElementById('easter-egg-close');
  var videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';

  function openEgg() {
    iframe.src = videoUrl;
    overlay.classList.add('easter-egg-overlay--open');
  }

  function closeEgg() {
    overlay.classList.remove('easter-egg-overlay--open');
    // Stop video by clearing src
    setTimeout(function () { iframe.src = ''; }, 300);
  }

  heroName.addEventListener('click', openEgg);
  closeBtn.addEventListener('click', closeEgg);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeEgg();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('easter-egg-overlay--open')) {
      closeEgg();
    }
  });
})();

/* ---------- News (Markdown) ---------- */
(function () {
  var listEl = document.getElementById('news-list');
  var viewAllBtn = document.getElementById('news-view-all');
  var drawer = document.getElementById('news-drawer');
  var overlay = document.getElementById('news-drawer-overlay');
  var closeBtn = document.getElementById('news-drawer-close');
  var drawerBody = document.getElementById('news-drawer-body');
  if (!listEl) return;

  var TOP_N = 5;

  function parseItem(block) {
    // First line: "## YYYY-MM-DD" — extract as date, rest is markdown body
    var lines = block.trim().split('\n');
    var date = '';
    var bodyStart = 0;
    var m = lines[0] && lines[0].match(/^##\s+(.+)\s*$/);
    if (m) { date = m[1].trim(); bodyStart = 1; }
    var body = lines.slice(bodyStart).join('\n').trim();
    return { date: date, body: body };
  }

  function formatDate(d) {
    // d is "YYYY-MM-DD"
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var mi = parseInt(parts[1], 10) - 1;
    if (mi < 0 || mi > 11) return d;
    return months[mi] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
  }

  function renderInto(target, items) {
    target.innerHTML = '';
    if (!items.length) {
      target.innerHTML = '<li class="news__item"><span class="news__content">No news yet.</span></li>';
      return;
    }
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'news__item';
      var html = window.marked ? window.marked.parse(it.body) : it.body;
      li.innerHTML =
        (it.date ? '<span class="news__date">' + formatDate(it.date) + '</span>' : '') +
        '<div class="news__content">' + html + '</div>';
      target.appendChild(li);
    });
  }

  function openDrawer() {
    drawer.classList.add('news-drawer--open');
    overlay.classList.add('news-drawer-overlay--open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('news-drawer--open');
    overlay.classList.remove('news-drawer-overlay--open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('news-drawer--open')) closeDrawer();
  });

  fetch('news.md', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function (md) {
      var blocks = md.split(/^\s*---\s*$/m).map(function (b) { return b.trim(); }).filter(Boolean);
      var items = blocks.map(parseItem).filter(function (it) { return it.body; });
      // Sort by date descending (lexicographic on YYYY-MM-DD works)
      items.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

      renderInto(listEl, items.slice(0, TOP_N));
      listEl.setAttribute('aria-busy', 'false');
      if (items.length > TOP_N) {
        viewAllBtn.hidden = false;
        viewAllBtn.textContent = 'View all news (' + items.length + ')';
      }
      renderInto(drawerBody, items);
      viewAllBtn.addEventListener('click', openDrawer);
    })
    .catch(function () {
      listEl.setAttribute('aria-busy', 'false');
      listEl.innerHTML = '<li class="news__item"><span class="news__content">No news available right now. Please check back soon.</span></li>';
    });
})();


/* ---------- Lottie Demos ---------- */
(function () {
  var els = document.querySelectorAll('[data-lottie-src]');
  if (!els.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play(el) {
    if (typeof lottie === 'undefined' || el.dataset.lottieLoaded) return;
    el.dataset.lottieLoaded = '1';
    lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: !reduce,
      autoplay: !reduce,
      path: el.dataset.lottieSrc
    });
  }

  // Lazy-load each animation only when it nears the viewport (the JSON can be large).
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { play(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '200px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(play);
  }
})();

/* ---------- Demos Carousel ---------- */
(function () {
  var track = document.getElementById('demos-track');
  var prev = document.getElementById('demos-prev');
  var next = document.getElementById('demos-next');
  if (!track || !prev || !next) return;

  // --- "explore more" hint: shown only once per visitor ---
  var hint = document.getElementById('demos-hint');
  var HINT_KEY = 'demos-hint-seen';
  var hintTimer = null;

  try { if (hint && localStorage.getItem(HINT_KEY)) { hint.remove(); hint = null; } } catch (e) {}

  function dismissHint() {
    if (!hint) return;
    clearTimeout(hintTimer);
    var el = hint;
    hint = null;
    el.classList.add('demos__hint--hidden');
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
  }

  function step() {
    var card = track.querySelector('.demo-card');
    if (!card) return track.clientWidth;
    var styles = getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function updateButtons() {
    var maxScroll = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= maxScroll;
    // Nothing to explore if the track doesn't overflow — drop the hint.
    if (hint && prev.disabled && next.disabled) dismissHint();
  }

  prev.addEventListener('click', function () { dismissHint(); track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { dismissHint(); track.scrollBy({ left: step(), behavior: 'smooth' }); });
  if (hint) {
    hint.addEventListener('click', function () { next.click(); });
  }

  var ticking = false;
  track.addEventListener('scroll', function () {
    dismissHint();
    if (!ticking) { window.requestAnimationFrame(function () { updateButtons(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();

  // Auto-dismiss the hint after a while even if the visitor never interacts.
  if (hint) hintTimer = setTimeout(dismissHint, 9000);
})();

/* ---------- (removed) Scroll Hue Shift ---------- */
(function () { return;
  var maxShift = 15;
  var ticking = false;
  function update() {
    var scrollH = document.body.scrollHeight - window.innerHeight;
    var fraction = scrollH > 0 ? window.scrollY / scrollH : 0;
    var hue = fraction * maxShift;
    document.documentElement.style.setProperty('--hue-shift', hue + 'deg');
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
})();

