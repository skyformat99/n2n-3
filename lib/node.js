var getPublicIP = require('./publicIP');
var nssocket = require('nssocket');
var _ = require('underscore');
var events = require("events");
var util = require('util');


module.exports = (function (argument) {
  function Node(port) {
    events.EventEmitter.call(this);
    this.nsclient = new nssocket.NsSocket();
    this.nodes = {};
    
    this.nsclient.data('id', function (id) {
      this.id = id;
      getPublicIP(function (ip) {
        if (ip) {
          this.nsclient.send('ip', ip, port);
        }
        else {
          this.nsclient.send('ip');
        }
      }.bind(this));
    }.bind(this));
    
    this.nsclient.data('online', function (node) {
      if (this.id === node.id) {
        //console.log('I am online', node.id);
        this.emit('online');
      }
      else {
        //console.log('Someone online:', node.id);
        this.emit('node::online', node);
        this.nodes[node.id] = node;
      }
    }.bind(this));
    
    this.nsclient.data('node::list', function (nodes) {
      _.extend(this.nodes, nodes);
    }.bind(this));
    
    this.nsclient.data('node::data', function (info) {
      if (info.eventName in ['online']) return;
      this.emit('node::' + info.eventName, info.sender, info.data);
    }.bind(this));
  }
  util.inherits(Node, events.EventEmitter);
  Node.prototype.connect = function (seed) {
    this.nsclient.connect(seed.host, seed.port);
  }
  
  Node.prototype.send = function (target, eventName, data) {
    this.nsclient.send('node::send', {
      target: target, 
      eventName: eventName,
      data: data
    });
  };

  return Node;
})();