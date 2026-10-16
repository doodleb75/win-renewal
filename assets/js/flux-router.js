/**
 * WINHUB · CoMinVi Multi-Page PJAX Engine & Motion Controller
 * - Barba-style slide-scale Multi-Page Transitions (fetch + DOM swap + card scale)
 * - Scroll-Aware Push-Down Header
 * - Aperture Box Expanding Intro
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. INITIAL APERTURE BOX INTRO (1번 이미지 로직)
     ========================================================================== */
  function initApertureIntro() {
    const introOverlay = document.getElementById('introOverlay');
    const introExpandingBox = document.getElementById('introExpandingBox');
    const introLogoContent = document.getElementById('introLogoContent');

    if (!introOverlay || !introExpandingBox || !introLogoContent) return;

    // Check if intro has already run in this session (optional, but allow replay)
    function runAnimation() {
      introOverlay.classList.remove('dismissed');
      introExpandingBox.className = 'intro-expanding-box';
      introLogoContent.className = 'intro-logo-content';

      // Step 1: Center Logo fades in inside compact box
      setTimeout(() => {
        introLogoContent.classList.add('revealed');
      }, 150);

      // Step 2: Box expands outward into a framed card (Image 1)
      setTimeout(() => {
        introLogoContent.classList.add('fade-out');
        introExpandingBox.classList.add('expanded-framed');
      }, 900);

      // Step 3: Box expands to full viewport
      setTimeout(() => {
        introExpandingBox.classList.add('expanded-full');
      }, 2100);

      // Step 4: Dismiss intro overlay
      setTimeout(() => {
        introOverlay.classList.add('dismissed');
      }, 2700);
    }

    // Auto-run if first visit or if on Home
    runAnimation();

    const replayBtn = document.getElementById('replayIntroBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        runAnimation();
      });
    }
  }

  /* ==========================================================================
     2. SCROLL-AWARE PUSH HEADER (CoMinVi Push-Down Layout)
     - 스크롤을 내릴 때: 감춤
     - 스크롤을 올릴 때: 나타남 + 전체 레이아웃 76px 푸시다운
     - 최상단: 감춤
     ========================================================================== */
  let isHeaderVisible = false;
  let lastScrollY = window.scrollY;

  function initPushHeader() {
    const mainHeader = document.getElementById('mainHeader');
    const pageLayoutWrapper = document.getElementById('pageLayoutWrapper');

    if (!mainHeader || !pageLayoutWrapper) return;

    function showHeaderAndPush() {
      if (isHeaderVisible) return;
      isHeaderVisible = true;
      mainHeader.classList.add('is-visible');
      pageLayoutWrapper.classList.add('header-pushed');
    }

    function hideHeaderAndFold() {
      if (!isHeaderVisible) return;
      isHeaderVisible = false;
      mainHeader.classList.remove('is-visible');
      pageLayoutWrapper.classList.remove('header-pushed');
    }

    window.showHeaderAndPush = showHeaderAndPush;
    window.hideHeaderAndFold = hideHeaderAndFold;

    function onScroll() {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY;

      if (currentY > 120) {
        if (diff < -8) {
          // SCROLLING UP -> Reveal Header & Push Page Down
          showHeaderAndPush();
        } else if (diff > 8) {
          // SCROLLING DOWN -> Hide Header & Fold Page Up
          hideHeaderAndFold();
        }
      } else {
        // At Top of Page: Keep Hidden
        hideHeaderAndFold();
      }

      lastScrollY = currentY;

      // Page specific scroll hooks
      updatePinnedTimeline();
      checkMetricsCount();
    }

    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ==========================================================================
     3. MULTI-PAGE PJAX ROUTER (CoMinVi slide-scale 2번 이미지 로직)
     - 4개 독립 파일(index_flux.html, about.html, works.html, contact.html) 비동기 통신
     - 클릭 시 보고 있던 화면이 scale(0.90) 카드로 축소
     - 백그라운드 fetch로 새 파일의 컨텐츠를 교체
     - 다시 scale(1.0) 전체 화면으로 확장
     ========================================================================== */
  let isTransitioning = false;

  function initMultiPagePjax() {
    const viewCardContainer = document.getElementById('viewCardContainer');
    const headerPageTitle = document.getElementById('headerPageTitle');

    // Intercept internal links
    document.querySelectorAll('a[href]').forEach(link => {
      // Ignore hash-only links or external links
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      link.removeEventListener('click', handleLinkClick);
      link.addEventListener('click', handleLinkClick);
    });

    function handleLinkClick(e) {
      const link = e.currentTarget;
      const targetUrl = link.getAttribute('href');

      if (!targetUrl || targetUrl === '#' || isTransitioning) return;

      // Check if it's the current page
      const currentPath = window.location.pathname.split('/').pop() || 'index_flux.html';
      const cleanTarget = targetUrl.split('/').pop().split('#')[0];
      if (currentPath === cleanTarget && !targetUrl.includes('#')) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      closeCurtainDrawer();
      performPageTransition(targetUrl);
    }

    async function performPageTransition(url) {
      if (isTransitioning) return;
      isTransitioning = true;

      const container = document.getElementById('viewCardContainer');
      const pageTitle = document.getElementById('headerPageTitle');

      // Step 1: Scale down active view to 0.90 Card (Image 2)
      if (container) container.classList.add('is-transitioning');
      if (window.showHeaderAndPush) window.showHeaderAndPush();

      try {
        // Step 2: Fetch target HTML document
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const htmlText = await response.text();

        // Step 3: Parse response HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const newContent = doc.getElementById('viewCardContainer') || doc.querySelector('main');
        const newTitle = doc.querySelector('title');

        if (!newContent) {
          // If structure differs, fallback
          window.location.href = url;
          return;
        }

        setTimeout(() => {
          // Swap Content
          container.innerHTML = newContent.innerHTML;

          // Update Document Title & URL bar
          if (newTitle) document.title = newTitle.textContent;
          window.history.pushState({ url }, '', url);

          // Update Header Page Title
          if (pageTitle) {
            const h1 = container.querySelector('h1') || container.querySelector('.subpage-title') || container.querySelector('.hero-title');
            const routeName = url.includes('about') ? 'About Us' :
                              url.includes('works') ? 'Works' :
                              url.includes('contact') ? 'Contact Us' : 'Home';
            pageTitle.textContent = routeName;
          }

          // Reset Scroll
          window.scrollTo({ top: 0, behavior: 'instant' });

          // Re-bind GNB active classes
          updateGnbActive(url);

          // Re-bind links inside new DOM
          initMultiPagePjax();
          initCurtainDrawer();
          initHeroScrollBtn();

          // Step 4: Expand Card back to Scale 1.0 (Full layout)
          setTimeout(() => {
            if (container) container.classList.remove('is-transitioning');
            isTransitioning = false;
          }, 120);

        }, 420);

      } catch (err) {
        console.warn('Fetch transition failed (possibly file:// protocol), using direct navigation:', err);
        // Graceful fallback for local file:// mode
        window.location.href = url;
      }
    }

    // Handle Browser Back / Forward buttons
    window.addEventListener('popstate', (e) => {
      const url = window.location.href;
      performPageTransition(url);
    });

    function updateGnbActive(url) {
      const clean = url.split('/').pop().split('#')[0] || 'index_flux.html';
      document.querySelectorAll('.gnb-link').forEach(link => {
        const linkHref = link.getAttribute('href') || '';
        if (linkHref.includes(clean)) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  /* ==========================================================================
     4. CURTAIN DRAWER OVERLAY
     ========================================================================== */
  function initCurtainDrawer() {
    const curtainDrawer = document.getElementById('curtainDrawer');
    const drawerTrigger = document.getElementById('drawerTrigger');
    const drawerClose = document.getElementById('drawerClose');

    function openCurtainDrawer() {
      if (curtainDrawer) curtainDrawer.classList.add('open');
    }

    function closeCurtainDrawer() {
      if (curtainDrawer) curtainDrawer.classList.remove('open');
    }

    window.closeCurtainDrawer = closeCurtainDrawer;

    if (drawerTrigger) {
      drawerTrigger.removeEventListener('click', openCurtainDrawer);
      drawerTrigger.addEventListener('click', openCurtainDrawer);
    }

    if (drawerClose) {
      drawerClose.removeEventListener('click', closeCurtainDrawer);
      drawerClose.addEventListener('click', closeCurtainDrawer);
    }
  }

  /* ==========================================================================
     5. HERO SCROLL TRIGGER BUTTON
     ========================================================================== */
  function initHeroScrollBtn() {
    const scrollInitiateBtn = document.getElementById('scrollInitiateBtn');
    if (scrollInitiateBtn) {
      scrollInitiateBtn.addEventListener('click', () => {
        const pinnedStage = document.getElementById('storyPinnedStage');
        if (pinnedStage) {
          pinnedStage.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /* ==========================================================================
     6. PINNED MULTI-ACT TIMELINE (HOME EXCLUSIVE)
     ========================================================================== */
  function updatePinnedTimeline() {
    const pinnedStage = document.getElementById('storyPinnedStage');
    if (!pinnedStage) return;

    const actLayers = [
      document.getElementById('layer-act2'),
      document.getElementById('layer-act3'),
      document.getElementById('layer-act4'),
      document.getElementById('layer-act5')
    ];
    const schematicModeLabel = document.getElementById('schematicModeLabel');
    const schematicScrollProg = document.getElementById('schematicScrollProg');
    const radarGroup = document.getElementById('radarGroup');
    const coreGlow = document.getElementById('coreGlow');
    const coreNode = document.getElementById('coreNode');

    const modeLabels = [
      'SYSTEM // AI_KERNEL_NODE (ACT 02)',
      'SYSTEM // 360_RADAR_SCAN (ACT 03)',
      'SYSTEM // SECURITY_FIREWALL_SHIELD (ACT 04)',
      'SYSTEM // QUANTUM_CORE_CONVERGENCE (ACT 05)'
    ];

    const rect = pinnedStage.getBoundingClientRect();
    const stageH = pinnedStage.offsetHeight - window.innerHeight;
    
    let progress = -rect.top / stageH;
    progress = Math.max(0, Math.min(1, progress));

    if (schematicScrollProg) schematicScrollProg.textContent = `PROGRESS: ${Math.round(progress * 100)}%`;

    if (radarGroup) radarGroup.setAttribute('transform', `rotate(${progress * 720})`);

    if (coreGlow && coreNode) {
      const scale = 1 + progress * 1.5;
      coreGlow.setAttribute('r', (24 * scale).toString());
    }

    const activeIdx = Math.min(3, Math.floor(progress * 4));
    actLayers.forEach((layer, idx) => {
      if (!layer) return;
      if (idx === activeIdx) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
    });

    if (schematicModeLabel) schematicModeLabel.textContent = modeLabels[activeIdx];
  }

  /* ==========================================================================
     7. METRICS COUNT-UP (HOME EXCLUSIVE)
     ========================================================================== */
  let metricsCounted = false;

  function checkMetricsCount() {
    if (metricsCounted) return;
    const metricsSection = document.getElementById('block-m06');
    if (!metricsSection) return;

    const rect = metricsSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.75) {
      metricsCounted = true;
      document.querySelectorAll('.metric-num[data-target]').forEach(el => {
        const target = parseFloat(el.dataset.target);
        const isFloat = target % 1 !== 0;
        const duration = 1600;
        const start = performance.now();

        function frame(now) {
          const elapsed = now - start;
          const p = Math.min(1, elapsed / duration);
          const ease = 1 - Math.pow(1 - p, 3);
          const cur = target * ease;
          el.textContent = isFloat ? cur.toFixed(2) : Math.floor(cur);

          if (p < 1) {
            requestAnimationFrame(frame);
          } else {
            el.textContent = isFloat ? target.toFixed(2) : target;
          }
        }
        requestAnimationFrame(frame);
      });
    }
  }

  /* ==========================================================================
     INITIALIZATION ON DOM LOAD
     ========================================================================== */
  window.addEventListener('DOMContentLoaded', () => {
    initApertureIntro();
    initPushHeader();
    initMultiPagePjax();
    initCurtainDrawer();
    initHeroScrollBtn();
  });

})();
