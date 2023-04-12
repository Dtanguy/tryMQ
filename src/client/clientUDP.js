var dgram = require('dgram');
var client;

const init = function (openCb, messageCb, closeCb, errorCb) {
  client = dgram.createSocket('udp4');
  client.on('listening', () => {
    openCb(client.address().address, client.address().port);
  });
  client.on('message', messageCb);
  client.on('close', closeCb);
  client.on('error', errorCb);
  client.bind();
}

function send(ip, port, data, txt) {
  var message = new Buffer.alloc(txt.length, txt);
  client.send(message, 0, message.length, port, ip, function (err, bytes) {
    //The message have been send
  });
}

module.exports = {
  client: client,
  init: init,
  send: send
};