var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Tree = require('./tree.js')
var FW = require('./fragment_writer.js')


export class DistrTree extends Tree {

  var fragment_cache = new Array();
  var fw = new FW();


  constructor(filename){
    if (filename == null){
      this.tree = new Tree(25);
    } else {
      this.tree = fw.read_tree(filename);
    }
  }







}
