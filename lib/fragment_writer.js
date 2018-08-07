var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Tree = require('./tree.js')
var fs = require('fs')


module.exports = class {
  constructor(){}

  write_tree(tree) {

  }
  read_tree(path) {

  }

  write_fragment(fragment) {
    JSON.stringify(fragment, function( key, value) {
      console.log(key, value)
    });
  }
  read_fragment() {

  }

}
