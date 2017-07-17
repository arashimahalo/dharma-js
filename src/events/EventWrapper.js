'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventWrapper = function () {
  function EventWrapper(event, callback) {
    _classCallCheck(this, EventWrapper);

    this.event = event;
    this.watchCallbackQueue = [];
    this.stopWatchingCallbackQueue = [];
    this.watching = false;

    this.executeWatchCallbackQueue = this.executeWatchCallbackQueue.bind(this);
    this.executeStopWatchingCallbackQueue = this.executeStopWatchingCallbackQueue.bind(this);

    if (callback) {
      this.watch(callback);
    }
  }

  _createClass(EventWrapper, [{
    key: 'watch',
    value: function watch(callback) {
      this.watchCallbackQueue.push(callback);

      if (!this.watching) {
        this.event.watch(this.executeWatchCallbackQueue);
        this.watching = true;
      }
    }
  }, {
    key: 'stopWatching',
    value: function stopWatching(callback) {
      if (callback) this.stopWatchingCallbackQueue.push(callback);

      if (this.watchCallbackQueue.length == 0) {
        this.event.stopWatching(this.executeStopWatchingCallbackQueue);
        this.watching = false;
      }
    }
  }, {
    key: 'executeWatchCallbackQueue',
    value: async function executeWatchCallbackQueue(err, result) {
      while (this.watchCallbackQueue.length > 0) {
        var callback = this.watchCallbackQueue.shift();
        await callback(err, result);
      }
    }
  }, {
    key: 'executeStopWatchingCallbackQueue',
    value: async function executeStopWatchingCallbackQueue(err, result) {
      while (this.stopWatchingCallbackQueue.length > 0) {
        var callback = this.stopWatchingCallbackQueue.shift();
        await callback(err, result);
      }
    }
  }], [{
    key: 'getIdentifier',
    value: function getIdentifier(eventName, filter, additionalFilter) {
      return eventName + (0, _jsonStableStringify2.default)(filter) + (0, _jsonStableStringify2.default)(additionalFilter);
    }
  }]);

  return EventWrapper;
}();

module.exports = EventWrapper;