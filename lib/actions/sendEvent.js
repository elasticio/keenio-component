/* eslint-disable no-use-before-define,no-shadow */
const Keen = require('keen-js');
const Q = require('q');
const elasticio = require('elasticio-node');

const { messages } = elasticio;

exports.process = execute;

function execute(msg, cfg) {
  const that = this;

  Q(cfg)
    .then(validateConfig)
    .then(createClient)
    .then(sendEvent)
    .then(emitSuccess)
    .fail(emitError)
    .done(end);

  function validateConfig(cfg) {
    if (!cfg.writeKey) {
      throw new Error('writeKey is required to perform the sendEvent action, please reconfigure your account.');
    }

    if (!cfg.projectId) {
      throw new Error('Please provide a valid projectId.');
    }

    if (!cfg.eventCollection) {
      throw new Error('Please provide a Collection Name for your events.');
    }

    return cfg;
  }

  function createClient(cfg) {
    return new Keen({
      writeKey: cfg.writeKey,
      projectId: cfg.projectId,
    });
  }

  function sendEvent(client) {
    return Q.ninvoke(client, 'addEvent', cfg.eventCollection, msg.body);
  }

  function emitSuccess(response) {
    const newMsg = messages.newMessageWithBody(response);

    that.emit('data', newMsg);
  }

  function emitError(err) {
    that.emit('error', err);
  }

  function end() {
    that.emit('end');
  }
}
