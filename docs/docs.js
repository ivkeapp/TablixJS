/**
 * TablixJS Documentation Interface
 * 
 * Handles:
 * - Asynchronous documentation loading
 * - Sidebar navigation and state management
 * - Mobile menu toggle
 * - Deep linking support
 * - Keyboard navigation
 * - Loading and error states
 */

(function() {
  'use strict';

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const state = {
    currentDoc: null,
    isLoading: false,
    sidebarOpen: false,
    categoryStates: {} // Track which categories are expanded
  };

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const elements = {
    sidebar: document.getElementById('docsSidebar'),
    menuToggle: document.getElementById('menuToggle'),
    contentWrapper: document.getElementById('contentWrapper'),
    contentLoading: document.getElementById('contentLoading'),
    contentError: document.getElementById('contentError'),
    errorMessage: document.getElementById('errorMessage'),
    navLinks: document.querySelectorAll('.nav-link'),
    categoryHeaders: document.querySelectorAll('.nav-category-header')
  };

  // ============================================
  // CONFIGURATION
  // ============================================
  const config = {
    docsPath: './html/',
    defaultDoc: 'integration-guide.html',
    storageKey: 'tablixjs-docs-state'
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Load saved state from localStorage
    loadState();
    
    // Load and display version
    loadVersion();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize category states
    initializeCategoryStates();
    
    // Handle initial page load
    handleInitialLoad();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
  }

  // ============================================
  // EVENT LISTENERS SETUP
  // ============================================
  function setupEventListeners() {
    // Mobile menu toggle
    if (elements.menuToggle) {
      elements.menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Navigation link clicks
    elements.navLinks.forEach(link => {
      link.addEventListener('click', handleNavLinkClick);
    });

    // Category header clicks (accordion)
    elements.categoryHeaders.forEach(header => {
      header.addEventListener('click', handleCategoryToggle);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', handleOutsideClick);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Handle window resize
    window.addEventListener('resize', handleResize);
  }

  // ============================================
  // CATEGORY ACCORDION MANAGEMENT
  // ============================================
  function initializeCategoryStates() {
    elements.categoryHeaders.forEach(header => {
      const category = header.getAttribute('data-category');
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      
      // Initialize or restore state
      if (state.categoryStates.hasOwnProperty(category)) {
        setCategoryState(header, state.categoryStates[category]);
      } else {
        state.categoryStates[category] = isExpanded;
      }
    });
  }

  function handleCategoryToggle(event) {
    const header = event.currentTarget;
    const category = header.getAttribute('data-category');
    const currentState = header.getAttribute('aria-expanded') === 'true';
    const newState = !currentState;
    
    // Update state
    state.categoryStates[category] = newState;
    setCategoryState(header, newState);
    
    // Save state
    saveState();
  }

  function setCategoryState(header, isExpanded) {
    header.setAttribute('aria-expanded', isExpanded.toString());
  }

  // ============================================
  // MOBILE MENU MANAGEMENT
  // ============================================
  function toggleMobileMenu() {
    state.sidebarOpen = !state.sidebarOpen;
    updateMobileMenuState();
  }

  function updateMobileMenuState() {
    if (state.sidebarOpen) {
      elements.sidebar.classList.add('is-open');
      elements.menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      elements.sidebar.classList.remove('is-open');
      elements.menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  function closeMobileMenu() {
    state.sidebarOpen = false;
    updateMobileMenuState();
  }

  function handleOutsideClick(event) {
    // Close mobile menu when clicking outside on mobile
    if (window.innerWidth <= 768 && state.sidebarOpen) {
      if (!elements.sidebar.contains(event.target) && 
          !elements.menuToggle.contains(event.target)) {
        closeMobileMenu();
      }
    }
  }

  function handleResize() {
    // Close mobile menu when resizing to desktop
    if (window.innerWidth > 768 && state.sidebarOpen) {
      closeMobileMenu();
    }
  }

  // ============================================
  // NAVIGATION HANDLING
  // ============================================
  function handleNavLinkClick(event) {
    event.preventDefault();
    
    const link = event.currentTarget;
    const docFile = link.getAttribute('data-doc');
    const hash = link.getAttribute('href');
    
    // Update active state
    setActiveNavLink(link);
    
    // Load documentation
    loadDocumentation(docFile, hash);
    
    // Close mobile menu after navigation
    if (window.innerWidth <= 768) {
      closeMobileMenu();
    }
  }

  function setActiveNavLink(activeLink) {
    // Remove active class from all links
    elements.navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to clicked link
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // ============================================
  // DOCUMENTATION LOADING
  // ============================================
  async function loadDocumentation(docFile, hash) {
    // Prevent concurrent loads
    if (state.isLoading) return;
    
    state.isLoading = true;
    state.currentDoc = docFile;
    
    // Show loading state
    showLoadingState();
    
    try {
      // Fetch documentation content
      const response = await fetch(config.docsPath + docFile);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Display content
      displayContent(html);
      
      // Update URL without page reload
      updateURL(hash);
      
      // Save current state
      saveState();
      
      // Scroll to top of content
      scrollToTop();
      
    } catch (error) {
      console.error('Error loading documentation:', error);
      showErrorState(error.message);
    } finally {
      state.isLoading = false;
    }
  }

  function showLoadingState() {
    elements.contentLoading.style.display = 'flex';
    elements.contentWrapper.style.display = 'none';
    elements.contentError.style.display = 'none';
  }

  function displayContent(html) {
    // Parse HTML and extract body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.body.innerHTML;
    
    // Inject content
    elements.contentWrapper.innerHTML = content;
    
    // Show content, hide loading
    elements.contentLoading.style.display = 'none';
    elements.contentWrapper.style.display = 'block';
    elements.contentError.style.display = 'none';
    
    // Process links in content to prevent external navigation
    processContentLinks();
    
    // Enhance code blocks if needed
    enhanceCodeBlocks();
  }

  function showErrorState(message) {
    elements.errorMessage.textContent = message || 'The requested documentation page could not be loaded.';
    elements.contentLoading.style.display = 'none';
    elements.contentWrapper.style.display = 'none';
    elements.contentError.style.display = 'flex';
  }

  // ============================================
  // CONTENT ENHANCEMENT
  // ============================================
  function processContentLinks() {
    // Make all links in documentation content open in same page or new tab appropriately
    const contentLinks = elements.contentWrapper.querySelectorAll('a');
    
    contentLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // External links open in new tab
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function enhanceCodeBlocks() {
    // Add copy button to code blocks if desired
    const codeBlocks = elements.contentWrapper.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
      // Ensure proper class for syntax highlighting if library is added
      if (!block.classList.length) {
        block.classList.add('language-javascript');
      }
    });
  }

  // ============================================
  // URL AND HISTORY MANAGEMENT
  // ============================================
  function updateURL(hash) {
    // Update URL to reflect current documentation page
    if (history.pushState && hash) {
      const newURL = window.location.pathname + hash;
      history.pushState({ doc: state.currentDoc }, '', newURL);
    }
  }

  function handlePopState(event) {
    // Handle browser back/forward buttons
    if (event.state && event.state.doc) {
      loadDocumentationByHash(window.location.hash);
    }
  }

  function handleInitialLoad() {
    // Check URL hash for deep linking
    const hash = window.location.hash;
    
    if (hash) {
      loadDocumentationByHash(hash);
    } else {
      // Load default documentation
      const defaultLink = Array.from(elements.navLinks).find(
        link => link.getAttribute('data-doc') === config.defaultDoc
      );
      
      if (defaultLink) {
        setActiveNavLink(defaultLink);
        loadDocumentation(config.defaultDoc, defaultLink.getAttribute('href'));
      }
    }
  }

  function loadDocumentationByHash(hash) {
    // Find the nav link matching the hash
    const link = Array.from(elements.navLinks).find(
      navLink => navLink.getAttribute('href') === hash
    );
    
    if (link) {
      const docFile = link.getAttribute('data-doc');
      setActiveNavLink(link);
      loadDocumentation(docFile, hash);
    } else {
      // Hash not found, load default
      handleInitialLoad();
    }
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  function handleKeyboardNavigation(event) {
    // ESC key closes mobile menu
    if (event.key === 'Escape' && state.sidebarOpen) {
      closeMobileMenu();
      elements.menuToggle.focus();
    }
    
    // Arrow key navigation in sidebar
    if (document.activeElement && document.activeElement.classList.contains('nav-link')) {
      const links = Array.from(elements.navLinks).filter(link => {
        return link.offsetParent !== null; // Only visible links
      });
      const currentIndex = links.indexOf(document.activeElement);
      
      if (event.key === 'ArrowDown' && currentIndex < links.length - 1) {
        event.preventDefault();
        links[currentIndex + 1].focus();
      } else if (event.key === 'ArrowUp' && currentIndex > 0) {
        event.preventDefault();
        links[currentIndex - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        document.activeElement.click();
      }
    }
  }

  // ============================================
  // VERSION LOADING
  // ============================================
  async function loadVersion() {
    try {
      const response = await fetch('../package.json');
      if (response.ok) {
        const packageData = await response.json();
        const versionElement = document.getElementById('sidebarVersion');
        if (versionElement && packageData.version) {
          versionElement.textContent = `v${packageData.version}`;
        }
      }
    } catch (error) {
      console.warn('Could not load version from package.json:', error);
      const versionElement = document.getElementById('sidebarVersion');
      if (versionElement) {
        versionElement.textContent = 'v1.x';
      }
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function scrollToTop() {
    // Smooth scroll to top of content
    if (elements.contentWrapper.scrollIntoView) {
      elements.contentWrapper.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // ============================================
  // STATE PERSISTENCE
  // ============================================
  function saveState() {
    try {
      const stateToSave = {
        currentDoc: state.currentDoc,
        categoryStates: state.categoryStates
      };
      localStorage.setItem(config.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Could not save state to localStorage:', error);
    }
  }

  function loadState() {
    try {
      const savedState = localStorage.getItem(config.storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        state.categoryStates = parsed.categoryStates || {};
      }
    } catch (error) {
      console.warn('Could not load state from localStorage:', error);
    }
  }

  // ============================================
  // PUBLIC API (if needed for external access)
  // ============================================
  window.TablixDocs = {
    loadDoc: function(docFile) {
      const link = Array.from(elements.navLinks).find(
        navLink => navLink.getAttribute('data-doc') === docFile
      );
      if (link) {
        handleNavLinkClick({ 
          preventDefault: () => {}, 
          currentTarget: link 
        });
      }
    },
    
    getCurrentDoc: function() {
      return state.currentDoc;
    },
    
    toggleSidebar: function() {
      toggleMobileMenu();
    }
  };

  // ============================================
  // START APPLICATION
  // ============================================
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
