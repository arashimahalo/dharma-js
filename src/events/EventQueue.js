'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventQueue = function () {
  function EventQueue(identifier, event) {
    _classCallCheck(this, EventQueue);

    this.identifier = identifier;
    this.event = event;
    this.queue = [];
    this.callbacks = {};
    this.length = 0;
    this.watching = false;

    this.execute = this.execute.bind(this);
  }

  _createClass(EventQueue, [{
    key: 'enqueue',
    value: function enqueue(id, callback) {
      this.callbacks[id] = callback;
      this.queue.push(id);
      this.length += 1;

      if (!this.watching) {
        this.event.watch(this.execute);
        this.watching = true;
      }
    }
  }, {
    key: 'remove',
    value: function remove(id, callback) {
      // console.log("trying to stop " + this.identifier);

      delete this.callbacks[id];
      this.queue = _lodash2.default.remove(this.queue, function (_id) {
        return id == _id;
      });

      this.length -= 1;

      if (this.length == 0 && this.watching) {
        // console.log("actually stopped " + this.identifier);
        this.event.stopWatching(callback);
      } else {
        if (callback) callback();
      }
    }
  }, {
    key: 'execute',
    value: async function execute(err, result) {
      var executionQueue = _lodash2.default.clone(this.queue);
      for (var i = 0; i < executionQueue.length; i++) {
        var id = executionQueue[i];
        var callback = this.callbacks[id];
        await callback(err, result);
      }
    }
  }], [{
    key: 'getIdentifier',
    value: function getIdentifier(eventName, filter, additionalFilter) {
      return eventName + (0, _jsonStableStringify2.default)(filter) + (0, _jsonStableStringify2.default)(additionalFilter);
    }
  }]);

  return EventQueue;
}();

module.exports = EventQueue;