import DataManager from './DataManager.js';
import Renderer from './Renderer.js';
import EventManager from './EventManager.js';

export default class Table {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;

    // Inicijalizuj menadžere
    this.dataManager = new DataManager(this, options.data || []);
    this.renderer = new Renderer(this);
    this.eventManager = new EventManager();

    this.init();
  }

  init() {
    // Renderuj tabelu prvi put
    this.renderer.renderTable(this.dataManager.getPageData());
    // Triggeruj afterLoad hook
    this.eventManager.trigger('afterLoad', this.dataManager.getData());
  }

  // Učitaj nove podatke
  loadData(data) {
    this.dataManager.setData(data);
    this.renderer.renderTable(this.dataManager.getPageData());
    this.eventManager.trigger('afterLoad', data);
  }

  // Filtriraj po kriterijumu (primer: { name: 'John' })
  filter(criteria) {
    this.dataManager.applyFilter(criteria);
    this.renderer.renderTable(this.dataManager.getPageData());
    this.eventManager.trigger('afterFilter', criteria);
  }

  // Registruj callback
  on(event, callback) {
    this.eventManager.on(event, callback);
  }
}