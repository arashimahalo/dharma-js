import stringify from 'json-stable-stringify';

class EventWrapper {
  constructor(event, callback) {
    this.event = event;
    this.watchCallbackQueue = [];
    this.stopWatchingCallbackQueue = [];
    this.watching = false;

    this.executeWatchCallbackQueue = this.executeWatchCallbackQueue.bind(this);
    this.executeStopWatchingCallbackQueue =
      this.executeStopWatchingCallbackQueue.bind(this);


    if (callback) {
      this.watch(callback);
    }
  }

  static getIdentifier(eventName, filter, additionalFilter) {
    return eventName + stringify(filter) + stringify(additionalFilter);
  }

  watch(callback) {
    this.watchCallbackQueue.push(callback);

    if (!this.watching) {
      this.event.watch(this.executeWatchCallbackQueue);
      this.watching = true;
    }
  }

  stopWatching(callback) {
    if (callback)
      this.stopWatchingCallbackQueue.push(callback);

    if (this.watchCallbackQueue.length == 0) {
      this.event.stopWatching(this.executeStopWatchingCallbackQueue)
      this.watching = false;
    }
  }

  async executeWatchCallbackQueue(err, result) {
    while (this.watchCallbackQueue.length > 0) {
      const callback = this.watchCallbackQueue.shift();
      await callback(err, result);
    }
  }

  async executeStopWatchingCallbackQueue(err, result) {
    while (this.stopWatchingCallbackQueue.length > 0) {
      const callback = this.stopWatchingCallbackQueue.shift();
      await callback(err, result);
    }
  }
}

module.exports = EventWrapper;
