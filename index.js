class TreeView {
  constructor({ 
    container, 
    data, 
    displayField = 'name', 
    onNodeClick = () => {}, 
    onNodeSelect = () => {},
    onNodeExpand = () => {},
    onNodeCollapse = () => {},
    onNodeRemove = () => {},
    multiSelect = false,
    searchable = true,
    expandAll = false,
    theme = 'light',
    showCheckboxes = false,
    pageSize = 10,
    showPagination = true 
  }) {
    if (!container) throw new Error("TreeView: 'container' is required");
    
    this.container = container;
    this.data = data || [];
    this.displayField = displayField;
    this.onNodeClick = onNodeClick;
    this.onNodeSelect = onNodeSelect;
    this.onNodeExpand = onNodeExpand;
    this.onNodeCollapse = onNodeCollapse;
    this.onNodeRemove = onNodeRemove;
    this.multiSelect = multiSelect;
    this.searchable = searchable;
    this.expandAll = expandAll;
    this.theme = theme;
    this.showCheckboxes = showCheckboxes;
    this.pageSize = pageSize;
    this.showPagination = showPagination;
    
    this.currentPage = 1;
    this.totalPages = 1;
    
    this.selectedNodes = new Set();
    this.expandedNodes = new Set();
    this.searchTerm = '';
    this.filteredData = this.data;
    this.paginatedData = []; 
    
    this.nodeDataMap = new Map();
    this.internalIdCounter = 0;
    this.internalIdMap = new Map();
    this.nodeToInternalIdMap = new Map(); 
    this.usedInternalIds = new Set(); 
    
    this.wrapper = null;
    this.searchInput = null;
    this.contentContainer = null;
    this.paginationContainer = null; 
    
    this.injectStyles();
    this.buildNodeDataMap();
    this.render();
    
    if (this.expandAll) {
      this.expandAllNodes();
    }
  }

  generateInternalId() {
    let internalId;
    let attempts = 0;
    const maxAttempts = 10000; 
    
    do {
      this.internalIdCounter++;
      internalId = `${this.internalIdCounter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique internal ID after maximum attempts');
      }
    } while (this.usedInternalIds.has(internalId));
    
    this.usedInternalIds.add(internalId);
    return internalId;
  }

  buildNodeDataMap() {
    this.nodeDataMap.clear();
    this.internalIdMap.clear();
    this.nodeToInternalIdMap.clear();
    
    const mapNodes = (nodes) => {
      nodes.forEach(node => {
        const nodeId = node.id || this.generateNodeId(node);
        
        let internalId = node._internalId;
        if (!internalId || this.internalIdMap.has(internalId)) {
          internalId = this.generateInternalId();
          node._internalId = internalId;
        } else {
          this.usedInternalIds.add(internalId);
        }
        
        this.nodeDataMap.set(nodeId, node);
        this.internalIdMap.set(internalId, node);
        this.nodeToInternalIdMap.set(node, internalId);
        
        if (node.children && node.children.length > 0) {
          mapNodes(node.children);
        }
      });
    };
    
    mapNodes(this.data);
  }

  calculatePagination() {
    const totalItems = this.filteredData.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  getPaginatedData() {
    if (!this.showPagination) {
      return this.filteredData;
    }
    
    this.calculatePagination();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
    return this.paginatedData;
  }

  setPageSize(newPageSize) {
    if (newPageSize <= 0) {
      console.warn('Page size must be positive');
      return;
    }
    
    this.pageSize = newPageSize;
    this.currentPage = 1; 
    this.updateTreeContent();
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages) {
      console.warn(`Invalid page number. Must be between 1 and ${this.totalPages}`);
      return;
    }
    
    this.currentPage = page;
    this.updateTreeContent();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateTreeContent();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateTreeContent();
    }
  }

  firstPage() {
    this.currentPage = 1;
    this.updateTreeContent();
  }

  lastPage() {
    this.currentPage = this.totalPages;
    this.updateTreeContent();
  }

 injectStyles() {
  if (document.getElementById("enhanced-treeview-styles")) return;

  const style = document.createElement("style");
  style.id = "enhanced-treeview-styles";
  style.textContent = `
    .enhanced-tree-container {
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: white;
      border: 1px solid #e5e7eb;
    }

    .enhanced-tree-container.dark {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }

    .tree-search {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .dark .tree-search {
      background: #111827;
      border-color: #374151;
    }

    .tree-search input {
      width: 100%;
      padding: 10px 0px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s ease;
      background: white;
      outline: none;
    }

    .tree-search input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .dark .tree-search input {
      background: #1f2937;
      border-color: #4b5563;
      color: #f9fafb;
    }

    .dark .tree-search input:focus {
      border-color: #60a5fa;
    }

    .tree-content {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px 0;
    }

    .tree-content::-webkit-scrollbar {
      width: 8px;
    }

    .tree-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .tree-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .tree-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .enhanced-tree {
      padding: 0px;
      font-size: 14px;
      line-height: 1.5;
    }

    .enhanced-tree ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .enhanced-tree li {
      list-style: none;
      list-style-type: none;
    }

    .enhanced-tree .tree-level {
      padding-left: 16px; 
      position: relative;
    }

    .enhanced-tree .tree-node {
      position: relative;
      display: flex;
      align-items: center;
      padding: 6px 8px; 
      margin: 1px 4px; 
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      min-height: 36px;
    }

    .enhanced-tree .tree-node:hover {
      background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .dark .enhanced-tree .tree-node:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    }

    .enhanced-tree .tree-node.selected {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .enhanced-tree .tree-node.selected:hover {
      transform: translateX(2px) translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .enhanced-tree .tree-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      margin-right: 6px; /* Reduced margin */
      transition: all 0.2s ease;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .enhanced-tree .tree-toggle:hover {
      background: rgba(59, 130, 246, 0.2);
      transform: scale(1.1);
    }

    .enhanced-tree .tree-toggle.expanded {
      transform: rotate(90deg);
    }

    .enhanced-tree .tree-toggle:hover.expanded {
      transform: rotate(90deg) scale(1.1);
    }

    .enhanced-tree .tree-toggle svg {
      width: 12px;
      height: 12px;
      color: #3b82f6;
      transition: all 0.2s ease;
    }

    .enhanced-tree .tree-node.selected .tree-toggle {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .enhanced-tree .tree-node.selected .tree-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .enhanced-tree .tree-node.selected .tree-toggle svg {
      color: white;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .enhanced-tree .tree-node.selected .tree-toggle:hover svg {
      color: #f1f5f9;
      transform: scale(1.1);
    }

    .enhanced-tree .tree-icon {
      width: 18px;
      height: 18px;
      margin-right: 6px; /* Reduced margin */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .enhanced-tree .tree-icon svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    .enhanced-tree .tree-node.selected .tree-icon svg {
      color: rgba(255, 255, 255, 0.9);
    }

    .enhanced-tree .tree-checkbox {
      width: 16px;
      height: 16px;
      margin-right: 6px; /* Reduced margin */
      border: 2px solid #d1d5db;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .enhanced-tree .tree-checkbox.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .enhanced-tree .tree-checkbox svg {
      width: 10px;
      height: 10px;
      color: white;
    }

    .enhanced-tree .tree-label {
      flex: 1;
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    .enhanced-tree .tree-node.selected .tree-label {
      font-weight: 600;
    }

    .enhanced-tree .tree-children {
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .enhanced-tree .tree-children.collapsed {
      max-height: 0;
      opacity: 0;
      transform: translateY(-4px);
    }

    .enhanced-tree .tree-children.expanded {
      max-height: 2000px;
      opacity: 1;
      transform: translateY(0);
    }

    .tree-actions {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      background: #fafafa;
      display: flex;
      gap: 8px;
    }

    .dark .tree-actions {
      background: #111827;
      border-color: #374151;
    }

    .tree-action-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tree-action-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .dark .tree-action-btn {
      background: #1f2937;
      border-color: #4b5563;
      color: #d1d5db;
    }

    .dark .tree-action-btn:hover {
      background: #374151;
    }

    .tree-pagination {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .dark .tree-pagination {
      background: #0f172a;
      border-color: #374151;
    }

    .pagination-info {
      font-size: 13px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dark .pagination-info {
      color: #9ca3af;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pagination-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f9fafb;
    }

    .dark .pagination-btn {
      background: #1f2937;
      border-color: #4b5563;
      color: #d1d5db;
    }

    .dark .pagination-btn:hover:not(:disabled) {
      background: #374151;
    }

    .dark .pagination-btn:disabled {
      background: #111827;
    }

    .pagination-btn.current {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .dark .pagination-btn.current {
      background: #2563eb;
      border-color: #2563eb;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b7280;
    }

    .dark .page-size-selector {
      color: #9ca3af;
    }

    .page-size-selector select {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #374151;
      font-size: 12px;
      cursor: pointer;
    }

    .dark .page-size-selector select {
      background: #1f2937;
      border-color: #4b5563;
      color: #d1d5db;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .enhanced-tree .tree-node {
      animation: slideIn 0.2s ease-out;
    }
      
    .theme-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      flex-shrink: 0;
    }

    .theme-toggle-btn:hover {
      border-color: #3b82f6;
      background: #f0f7ff;
      color: #3b82f6;
      transform: scale(1.05);
    }

    .theme-toggle-btn:active {
      transform: scale(0.95);
    }

    .theme-toggle-btn svg {
      width: 20px;
      height: 20px;
      transition: all 0.2s ease;
    }

    .dark .theme-toggle-btn {
      background: #1f2937;
      border-color: #4b5563;
      color: #9ca3af;
    }

    .dark .theme-toggle-btn:hover {
      border-color: #60a5fa;
      background: #1e3a8a;
      color: #60a5fa;
}

  `;
  document.head.appendChild(style);
}


  render() {
    if (!this.wrapper) {
      this.createMainStructure();
    }
    this.updateTreeContent();
  }

  createMainStructure() {
    this.container.innerHTML = "";
    this.wrapper = document.createElement("div");
    this.wrapper.className = `enhanced-tree-container ${this.theme}`;

    if (this.searchable) {
      const searchContainer = document.createElement("div");
      searchContainer.className = "tree-search";
      
      const searchWrapper = document.createElement("div");
      searchWrapper.style.cssText = "display: flex; align-items: center; gap: 8px;";
      
      this.searchInput = document.createElement("input");
      this.searchInput.type = "text";
      this.searchInput.placeholder = "Search here...";
      this.searchInput.style.flex = "1";
      this.searchInput.addEventListener("input", (e) => this.handleSearch(e.target.value));
      
      const themeToggle = this.createThemeToggle();
      
      searchWrapper.appendChild(this.searchInput);
      searchWrapper.appendChild(themeToggle);
      searchContainer.appendChild(searchWrapper);
      this.wrapper.appendChild(searchContainer);
    }


    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "tree-content";
    this.wrapper.appendChild(this.contentContainer);
    
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "tree-actions";
    
    const expandAllBtn = document.createElement("button");
    expandAllBtn.className = "tree-action-btn";
    expandAllBtn.textContent = "Expand All";
    expandAllBtn.addEventListener("click", () => this.expandAllNodes());
    
    const collapseAllBtn = document.createElement("button");
    collapseAllBtn.className = "tree-action-btn";
    collapseAllBtn.textContent = "Collapse All";
    collapseAllBtn.addEventListener("click", () => this.collapseAllNodes());
    
    const clearSelectionBtn = document.createElement("button");
    clearSelectionBtn.className = "tree-action-btn";
    clearSelectionBtn.textContent = "Clear Selection";
    clearSelectionBtn.addEventListener("click", () => this.clearSelection());
    
    actionsContainer.appendChild(expandAllBtn);
    actionsContainer.appendChild(collapseAllBtn);
    actionsContainer.appendChild(clearSelectionBtn);
    this.wrapper.appendChild(actionsContainer);

    if (this.showPagination) {
      this.createPaginationContainer();
    }

    this.container.appendChild(this.wrapper);
  }

  createPaginationContainer() {
    this.paginationContainer = document.createElement("div");
    this.paginationContainer.className = "tree-pagination";
    this.wrapper.appendChild(this.paginationContainer);
  }

  updatePaginationControls() {
    if (!this.showPagination || !this.paginationContainer) return;

    this.calculatePagination();
    this.paginationContainer.innerHTML = "";

    const paginationInfo = document.createElement("div");
    paginationInfo.className = "pagination-info";
    
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, this.filteredData.length);
    const totalItems = this.filteredData.length;
    
    paginationInfo.innerHTML = `
      <span>Showing ${startItem}-${endItem} of ${totalItems}</span>
      <div class="page-size-selector">
        <span>Show:</span>
        <select id="page-size-select">
          <option value="5" ${this.pageSize === 5 ? 'selected' : ''}>5</option>
          <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
          <option value="20" ${this.pageSize === 20 ? 'selected' : ''}>20</option>
          <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
        </select>
      </div>
    `;

    const pageSizeSelect = paginationInfo.querySelector('#page-size-select');
    pageSizeSelect.addEventListener('change', (e) => {
      this.setPageSize(parseInt(e.target.value));
    });

    const paginationControls = document.createElement("div");
    paginationControls.className = "pagination-controls";

    const firstBtn = document.createElement("button");
    firstBtn.className = "pagination-btn";
    firstBtn.innerHTML = "⇤";
    firstBtn.title = "First page";
    firstBtn.disabled = this.currentPage === 1;
    firstBtn.addEventListener("click", () => this.firstPage());

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.innerHTML = "‹";
    prevBtn.title = "Previous page";
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener("click", () => this.previousPage());

    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `pagination-btn ${i === this.currentPage ? 'current' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener("click", () => this.goToPage(i));
      paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.innerHTML = "›";
    nextBtn.title = "Next page";
    nextBtn.disabled = this.currentPage === this.totalPages;
    nextBtn.addEventListener("click", () => this.nextPage());

    const lastBtn = document.createElement("button");
    lastBtn.className = "pagination-btn";
    lastBtn.innerHTML = "⇥";
    lastBtn.title = "Last page";
    lastBtn.disabled = this.currentPage === this.totalPages;
    lastBtn.addEventListener("click", () => this.lastPage());

    paginationControls.insertBefore(firstBtn, paginationControls.firstChild);
    paginationControls.insertBefore(prevBtn, paginationControls.children[1]);
    paginationControls.appendChild(nextBtn);
    paginationControls.appendChild(lastBtn);

    this.paginationContainer.appendChild(paginationInfo);
    this.paginationContainer.appendChild(paginationControls);
  }

  updateTreeContent() {
    this.contentContainer.innerHTML = "";
    
    const paginatedNodes = this.getPaginatedData();
    const treeEl = this.createTree(paginatedNodes);
    treeEl.className = "enhanced-tree";
    this.contentContainer.appendChild(treeEl);

    if (this.showPagination) {
      this.updatePaginationControls();
    }
  }

  createTree(nodes, level = 0) {
    const ul = document.createElement("ul");
    if (level > 0) ul.className = "tree-level";

    nodes.forEach(node => {
      const li = document.createElement("li");
      const nodeDiv = document.createElement("div");
      nodeDiv.className = "tree-node";
      nodeDiv.dataset.nodeId = node.id || this.generateNodeId(node);
      nodeDiv.dataset.internalId = node._internalId;

      if (node.children && node.children.length > 0) {
        const toggle = document.createElement("div");
        toggle.className = "tree-toggle";
        toggle.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        `;
        
        const isExpanded = this.expandedNodes.has(nodeDiv.dataset.nodeId);
        if (isExpanded) toggle.classList.add("expanded");
        
        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleNode(nodeDiv.dataset.nodeId, toggle, li);
        });
        
        nodeDiv.appendChild(toggle);
      } else {
        const spacer = document.createElement("div");
        spacer.style.width = "28px";
        nodeDiv.appendChild(spacer);
      }

      if (this.showCheckboxes) {
        const checkbox = document.createElement("div");
        checkbox.className = "tree-checkbox";
        
        if (this.selectedNodes.has(nodeDiv.dataset.nodeId)) {
          checkbox.classList.add("checked");
          checkbox.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          `;
        }
        
        checkbox.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleSelection(nodeDiv.dataset.nodeId, checkbox, node);
        });
        
        nodeDiv.appendChild(checkbox);
      }

      const label = document.createElement("div");
      label.className = "tree-label";
      label.textContent = node[this.displayField];
      nodeDiv.appendChild(label);

      nodeDiv.addEventListener("click", () => {
        if (!this.showCheckboxes) {
          this.selectNode(nodeDiv.dataset.nodeId, nodeDiv, node);
        }
        this.onNodeClick(node);
      });

      li.appendChild(nodeDiv);

      if (node.children && node.children.length > 0) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = this.expandedNodes.has(nodeDiv.dataset.nodeId) 
          ? "tree-children expanded" 
          : "tree-children collapsed";
        
        const childUl = this.createTree(node.children, level + 1);
        childrenContainer.appendChild(childUl);
        li.appendChild(childrenContainer);
      }

      ul.appendChild(li);
    });

    return ul;
  }

  toggleNode(nodeId, toggle, li) {
    const childrenContainer = li.querySelector(".tree-children");
    const isExpanded = this.expandedNodes.has(nodeId);
    
    if (isExpanded) {
      this.expandedNodes.delete(nodeId);
      toggle.classList.remove("expanded");
      childrenContainer.classList.remove("expanded");
      childrenContainer.classList.add("collapsed");
      this.onNodeCollapse(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
      toggle.classList.add("expanded");
      childrenContainer.classList.remove("collapsed");
      childrenContainer.classList.add("expanded");
      this.onNodeExpand(nodeId);
    }
  }

  selectNode(nodeId, nodeDiv, node) {
    if (!this.multiSelect) {
      document.querySelectorAll(".tree-node.selected").forEach(el => {
        el.classList.remove("selected");
      });
      this.selectedNodes.clear();
    }
    
    nodeDiv.classList.add("selected");
    this.selectedNodes.add(nodeId);
    this.onNodeSelect(node);
  }

  toggleSelection(nodeId, checkbox, node) {
    const wasSelected = this.selectedNodes.has(nodeId);
    
    if (wasSelected) {
      this.deselectNodeAndChildren(node, nodeId);
      checkbox.classList.remove("checked");
      checkbox.innerHTML = "";
    } else {
      this.selectNodeAndChildren(node, nodeId);
      checkbox.classList.add("checked");
      checkbox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
    }
    
    this.updateParentCheckboxes();
    this.onNodeSelect(node);
  }

  selectNodeAndChildren(node, nodeId) {
    this.selectedNodes.add(nodeId);
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        const childNodeId = child.id || this.generateNodeId(child);
        this.selectNodeAndChildren(child, childNodeId);
      });
    }
  }

  deselectNodeAndChildren(node, nodeId) {
    this.selectedNodes.delete(nodeId);
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        const childNodeId = child.id || this.generateNodeId(child);
        this.deselectNodeAndChildren(child, childNodeId);
      });
    }
  }

  updateParentCheckboxes() {
    setTimeout(() => this.updateCheckboxStates(), 10);
  }

  updateCheckboxStates() {
    const checkboxes = document.querySelectorAll('.tree-checkbox');
    checkboxes.forEach(checkbox => {
      const nodeDiv = checkbox.closest('.tree-node');
      const nodeId = nodeDiv.dataset.nodeId;
      const isSelected = this.selectedNodes.has(nodeId);
      
      if (isSelected) {
        checkbox.classList.add("checked");
        checkbox.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        `;
      } else {
        checkbox.classList.remove("checked");
        checkbox.innerHTML = "";
      }
    });
  }

  generateNodeId(node) {
    return node.id || `node_${JSON.stringify(node).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
  }

  handleSearch(term) {
    this.searchTerm = term.toLowerCase();
    this.filteredData = this.filterNodes(this.data, this.searchTerm);
    this.currentPage = 1; 
    
    if (this.searchTerm) {
      this.autoExpandSearchResults();
    }
    
    this.updateTreeContent();
  }

  autoExpandSearchResults() {
    const collectNodeIds = (nodes) => {
        let ids = [];
        nodes.forEach(node => {
        const nodeId = node.id || this.generateNodeId(node);
        ids.push(nodeId);
        if (node.children && node.children.length > 0) {
            ids = ids.concat(collectNodeIds(node.children));
        }
        });
        return ids;
    };
    
    const searchResultIds = collectNodeIds(this.filteredData);
    searchResultIds.forEach(id => this.expandedNodes.add(id));
  }

  filterNodes(nodes, searchTerm) {
    if (!searchTerm) return nodes;
    
    const filtered = [];
    
    nodes.forEach(node => {
      const nodeMatches = node[this.displayField].toLowerCase().includes(searchTerm);
      let filteredChildren = [];
      
      if (node.children && node.children.length > 0) {
        filteredChildren = this.filterNodes(node.children, searchTerm);
      }
      
      if (nodeMatches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
    });
    
    return filtered;
  }

  expandAllNodes() {
    const collectNodeIds = (nodes) => {
      let ids = [];
      nodes.forEach(node => {
        const nodeId = node.id || this.generateNodeId(node);
        ids.push(nodeId);
        if (node.children) {
          ids = ids.concat(collectNodeIds(node.children));
        }
      });
      return ids;
    };
    
    const allIds = collectNodeIds(this.getPaginatedData());
    allIds.forEach(id => this.expandedNodes.add(id));
    this.updateTreeContent();
  }

  collapseAllNodes() {
    this.expandedNodes.clear();
    this.updateTreeContent();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.updateTreeContent();
  }

  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }

  getCheckedItemsData() {
    const checkedData = [];
    
    this.selectedNodes.forEach(nodeId => {
      const nodeData = this.nodeDataMap.get(nodeId);
      if (nodeData) {
        checkedData.push(nodeData);
      }
    });
    
    return checkedData;
  }

  getCheckedItemsWithDetails() {
    const checkedItems = [];
    
    this.selectedNodes.forEach(nodeId => {
      const nodeData = this.nodeDataMap.get(nodeId);
      if (nodeData) {
        checkedItems.push({
          id: nodeId,
          data: nodeData,
          displayValue: nodeData[this.displayField],
          hasChildren: nodeData.children && nodeData.children.length > 0,
          level: this.getNodeLevel(nodeData)
        });
      }
    });
    
    return checkedItems;
  }

  getNodeLevel(targetNode) {
    const findLevel = (nodes, target, currentLevel = 0) => {
      for (const node of nodes) {
        if (node === target) {
          return currentLevel;
        }
        if (node.children && node.children.length > 0) {
          const level = findLevel(node.children, target, currentLevel + 1);
          if (level !== -1) return level;
        }
      }
      return -1;
    };
    
    return findLevel(this.data, targetNode);
  }

  getNodeByInternalId(internalId) {
    if (!internalId) {
      console.warn('Internal ID is required');
      return null;
    }
    
    const node = this.internalIdMap.get(internalId);
    
    if (!node) {
      console.warn(`Node with internal ID '${internalId}' not found`);
      return null;
    }
    
    return node;
  }

  getNodesByInternalIds(internalIds) {
    if (!Array.isArray(internalIds)) {
      console.warn('Internal IDs must be an array');
      return [];
    }
    
    const results = [];
    const notFound = [];
    
    internalIds.forEach(internalId => {
      const node = this.internalIdMap.get(internalId);
      if (node) {
        results.push({
          internalId: internalId,
          node: node
        });
      } else {
        notFound.push(internalId);
      }
    });
    
    if (notFound.length > 0) {
      console.warn(`Nodes not found for internal IDs: ${notFound.join(', ')}`);
    }
    
    return results;
  }

  hasInternalId(internalId) {
    return this.internalIdMap.has(internalId);
  }

  getValidInternalIds() {
    return Array.from(this.internalIdMap.keys());
  }

  getInternalId(node) {
    if (!node) {
      console.warn('Node is required');
      return null;
    }
    
    const internalId = this.nodeToInternalIdMap.get(node);
    
    if (!internalId) {
      console.warn('Node not found in tree or missing internal ID');
      return null;
    }
    
    return internalId;
  }

  removeNodeByInternalId(internalId) {
    if (!internalId) {
      console.warn('Internal ID is required for removal');
      return false;
    }
    
    const nodeToRemove = this.internalIdMap.get(internalId);
    if (!nodeToRemove) {
      console.warn(`Cannot remove: Node with internal ID '${internalId}' not found`);
      return false;
    }

    const removeFromNodes = (nodes, target) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === target) {
          nodes.splice(i, 1);
          return true;
        }
        if (nodes[i].children && nodes[i].children.length > 0) {
          if (removeFromNodes(nodes[i].children, target)) {
            return true;
          }
        }
      }
      return false;
    };

    const removed = removeFromNodes(this.data, nodeToRemove);
    
    if (removed) {
      this.cleanupNodeMappings(nodeToRemove);
      
      this.filteredData = this.filterNodes(this.data, this.searchTerm);
      this.buildNodeDataMap();
      this.updateTreeContent();
      
      this.onNodeRemove(nodeToRemove, internalId);
      
      console.log(`Successfully removed node with internal ID: ${internalId}`);
      return true;
    }
    
    console.warn(`Failed to remove node with internal ID: ${internalId}`);
    return false;
  }

  cleanupNodeMappings(node) {
    const nodeId = node.id || this.generateNodeId(node);
    const internalId = node._internalId;
    
    this.nodeDataMap.delete(nodeId);
    this.internalIdMap.delete(internalId);
    this.nodeToInternalIdMap.delete(node);
    this.selectedNodes.delete(nodeId);
    this.expandedNodes.delete(nodeId);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => this.cleanupNodeMappings(child));
    }
  }

  findNodesByCallback(callback) {
    if (typeof callback !== 'function') {
      console.warn('Callback must be a function');
      return [];
    }
    
    const results = [];
    this.internalIdMap.forEach((node, internalId) => {
      try {
        if (callback(node, internalId)) {
          results.push({
            internalId: internalId,
            node: node
          });
        }
      } catch (error) {
        console.warn(`Error in callback for node ${internalId}:`, error);
      }
    });
    return results;
  }

  updateNodeByInternalId(internalId, updatedData) {
    if (!internalId) {
      console.warn('Internal ID is required for update');
      return false;
    }
    
    if (!updatedData || typeof updatedData !== 'object') {
      console.warn('Updated data must be an object');
      return false;
    }
    
    const node = this.internalIdMap.get(internalId);
    if (!node) {
      console.warn(`Cannot update: Node with internal ID '${internalId}' not found`);
      return false;
    }

    const children = node.children;
    const originalInternalId = node._internalId;
    
    Object.assign(node, updatedData);
    node.children = children; 
    node._internalId = originalInternalId; 

    this.filteredData = this.filterNodes(this.data, this.searchTerm);
    this.updateTreeContent();
    
    console.log(`Successfully updated node with internal ID: ${internalId}`);
    return true;
  }

  addNode(parentInternalId, newNodeData, position = 'last') {
    if (!newNodeData || typeof newNodeData !== 'object') {
      console.warn('Node data is required and must be an object');
      return null;
    }

    const newNode = { ...newNodeData };
    const internalId = this.generateInternalId();
    newNode._internalId = internalId;
    
    if (parentInternalId === 0 || parentInternalId === null || parentInternalId === undefined) {
      this.addToRootLevel(newNode, position);
      console.log(`Successfully added node '${newNode[this.displayField]}' to root level at position: ${position}`);
    } else {
      const parentNode = this.internalIdMap.get(parentInternalId);
      if (!parentNode) {
        console.warn(`Parent node with internal ID '${parentInternalId}' not found`);
        return null;
      }
      
      this.addToParentNode(parentNode, newNode, position);
      console.log(`Successfully added node '${newNode[this.displayField]}' to parent '${parentNode[this.displayField]}' at position: ${position}`);
    }

    this.refreshTree();
    return internalId;
  }

  addToRootLevel(newNode, position) {
    switch (position) {
      case 'first':
        this.data.unshift(newNode);
        break;
      case 'last':
      default:
        this.data.push(newNode);
        break;
      case 'before':
      case 'after':
        this.data.push(newNode);
        break;
    }
  }

  addToParentNode(parentNode, newNode, position) {
    if (!parentNode.children) {
      parentNode.children = [];
    }

    switch (position) {
      case 'first':
        parentNode.children.unshift(newNode);
        break;
      case 'last':
      default:
        parentNode.children.push(newNode);
        break;
      case 'before':
      case 'after':
        parentNode.children.push(newNode);
        break;
    }
  }

  addNodeAtPosition(newNodeData, referenceInternalId, position = 'after') {
    if (!newNodeData || typeof newNodeData !== 'object') {
      console.warn('Node data is required and must be an object');
      return null;
    }

    const referenceNode = this.internalIdMap.get(referenceInternalId);
    if (!referenceNode) {
      console.warn(`Reference node with internal ID '${referenceInternalId}' not found`);
      return null;
    }

    const newNode = { ...newNodeData };
    const internalId = this.generateInternalId();
    newNode._internalId = internalId;

    const parentNode = this.findParentNode(referenceNode);
    
    if (parentNode) {
      const referenceIndex = parentNode.children.indexOf(referenceNode);
      const insertIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
      parentNode.children.splice(insertIndex, 0, newNode);
    } else {
      const referenceIndex = this.data.indexOf(referenceNode);
      const insertIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
      this.data.splice(insertIndex, 0, newNode);
    }

    this.refreshTree();
    console.log(`Successfully added node '${newNode[this.displayField]}' ${position} reference node '${referenceNode[this.displayField]}'`);
    return internalId;
  }

  findParentNode(targetNode) {
    const findParent = (nodes, target, parent = null) => {
      for (const node of nodes) {
        if (node === target) {
          return parent;
        }
        if (node.children && node.children.length > 0) {
          const result = findParent(node.children, target, node);
          if (result !== null) return result;
        }
      }
      return null;
    };

    return findParent(this.data, targetNode);
  }

  exportTreeData(filename = 'tree-data.json') {
    try {
      const cleanData = this.cleanDataForExport(this.data);
      
      const jsonData = JSON.stringify(cleanData, null, 2);
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log(`💾 Tree data exported to ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Error exporting tree data:', error);
      return false;
    }
  }

  cleanDataForExport(data) {
    return data.map(node => {
      const cleanNode = { ...node };
      
      delete cleanNode._internalId;
      
      if (cleanNode.children && cleanNode.children.length > 0) {
        cleanNode.children = this.cleanDataForExport(cleanNode.children);
      }
      
      return cleanNode;
    });
  }

  exportTreeDataWithOptions(options = {}) {
    const {
      filename = 'tree-data.json',
      includeInternalIds = false,
      includeOnlyVisible = false,
      prettyPrint = true,
      onSuccess = () => {},
      onError = () => {}
    } = options;

    try {
      let dataToExport;
      
      if (includeOnlyVisible) {
        dataToExport = this.filteredData;
      } else {
        dataToExport = this.data;
      }

      let cleanData;
      if (includeInternalIds) {
        cleanData = JSON.parse(JSON.stringify(dataToExport));
      } else {
        cleanData = this.cleanDataForExport(dataToExport);
      }

      const jsonData = prettyPrint 
        ? JSON.stringify(cleanData, null, 2)
        : JSON.stringify(cleanData);
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log(`💾 Tree data exported to ${filename}`);
      onSuccess(filename);
      return true;
    } catch (error) {
      console.error('❌ Error exporting tree data:', error);
      onError(error);
      return false;
    }
  }

  exportSelectedNodes(filename = 'selected-nodes.json') {
    try {
      const selectedData = this.getCheckedItemsData();
      const cleanData = this.cleanDataForExport(selectedData);
      
      const jsonData = JSON.stringify(cleanData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log(`💾 Selected nodes exported to ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Error exporting selected nodes:', error);
      return false;
    }
  }


  exportTreeAsCSV(filename = 'tree-structure.csv') {
    try {
      const csvData = this.convertTreeToCSV(this.data);
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log(`💾 Tree structure exported to CSV: ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Error exporting tree as CSV:', error);
      return false;
    }
  }


  convertTreeToCSV(data, level = 0, parentName = '') {
    let csv = '';
    
    if (level === 0) {
      csv = 'Level,Parent,Name,HasChildren,Children Count\n';
    }
    
    data.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      const childrenCount = hasChildren ? node.children.length : 0;
      
      const escapedName = node[this.displayField].replace(/,/g, '');
      const escapedParent = parentName.replace(/,/g, '');
      
      csv += `${level},"${escapedParent}","${escapedName}",${hasChildren},${childrenCount}\n`;
      
      if (hasChildren) {
        csv += this.convertTreeToCSV(node.children, level + 1, node[this.displayField]);
      }
    });
    
    return csv;
  }


  importTreeData(jsonData) {
    try {
      let importedData;
      
      if (typeof jsonData === 'string') {
        importedData = JSON.parse(jsonData);
      } else {
        importedData = jsonData;
      }

      if (!Array.isArray(importedData)) {
        throw new Error('Imported data must be an array');
      }
      
      this.updateData(importedData);
      
      console.log('📥 Tree data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing tree data:', error);
      return false;
    }
  }

  getExportStats() {
    const stats = {
      totalNodes: 0,
      totalLevels: 0,
      selectedNodes: this.selectedNodes.size,
      expandedNodes: this.expandedNodes.size,
      filteredNodes: this.filteredData.length,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    };

    const calculateStats = (nodes, level = 0) => {
      stats.totalLevels = Math.max(stats.totalLevels, level);
      
      nodes.forEach(node => {
        stats.totalNodes++;
        
        if (node.children && node.children.length > 0) {
          calculateStats(node.children, level + 1);
        }
      });
    };

    calculateStats(this.data);
    
    return stats;
  }

  refreshTree() {
    this.filteredData = this.filterNodes(this.data, this.searchTerm);
    this.buildNodeDataMap();
    this.updateTreeContent();
  }

  createThemeToggle() {
    const themeToggle = document.createElement("button");
    themeToggle.className = "theme-toggle-btn";
    themeToggle.innerHTML = this.theme === 'light' 
      ? `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>`;
    
    themeToggle.title = `Switch to ${this.theme === 'light' ? 'dark' : 'light'} theme`;
    themeToggle.addEventListener("click", () => this.toggleTheme());
    
    return themeToggle;
  }

toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.wrapper.className = `enhanced-tree-container ${this.theme}`;
    
    const themeToggle = this.wrapper.querySelector('.theme-toggle-btn');
    if (themeToggle) {
      themeToggle.innerHTML = this.theme === 'light' 
        ? `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
          </svg>`;
      themeToggle.title = `Switch to ${this.theme === 'light' ? 'dark' : 'light'} theme`;
    }
  }


  getCurrentPageInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      pageSize: this.pageSize,
      totalItems: this.filteredData.length,
      startItem: (this.currentPage - 1) * this.pageSize + 1,
      endItem: Math.min(this.currentPage * this.pageSize, this.filteredData.length)
    };
  }

  getExpandedNodes() {
    return Array.from(this.expandedNodes);
  }

  updateData(newData) {
    this.data = newData;
    this.filteredData = newData;
    this.currentPage = 1; 
    this.buildNodeDataMap();
    this.updateTreeContent();
  }

  destroy() {
    this.container.innerHTML = "";
    const styles = document.getElementById("enhanced-treeview-styles");
    if (styles) styles.remove();
  }
}

// Export for use in other JS files
if (typeof module !== "undefined") {
  module.exports = TreeView;
}
