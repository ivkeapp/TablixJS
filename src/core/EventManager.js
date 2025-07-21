export default class EventManager {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  trigger(event, payload) {
    (this.events[event] || []).forEach(cb => cb(payload));
  }
}