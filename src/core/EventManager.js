export default class EventManager {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    }
  }

  clear(event) {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }

  trigger(event, payload) {
    (this.events[event] || []).forEach(cb => cb(payload));
  }
}