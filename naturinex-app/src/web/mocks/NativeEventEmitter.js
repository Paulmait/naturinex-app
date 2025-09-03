// Mock NativeEventEmitter for web build
class NativeEventEmitter {
  constructor() {
    this.listeners = {};
  }

  addListener(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
    
    // Return a subscription-like object
    return {
      remove: () => {
        const index = this.listeners[eventName].indexOf(callback);
        if (index > -1) {
          this.listeners[eventName].splice(index, 1);
        }
      }
    };
  }

  removeAllListeners(eventName) {
    delete this.listeners[eventName];
  }

  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data));
    }
  }
}

export default NativeEventEmitter;
export { NativeEventEmitter };