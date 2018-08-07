var FW = require('fragment_writer')

module.exports = class {
  constructor(b3) {
    this.contents = new Array();
    this.id = b3.assign_fragment_id(this)
  }

  add_node(node) {
    this.contents.push(node);
  }

  remove_node(node) {
    var index = this.contents.indexOf(node);
    this.contents.splice(index, 1);
  }

  request_node(content) {
    for (var i = 0; i < this.contents.length; i++) {
      if (this.contents[i] == content) {
        return this.contents[i];
      }
    }
    throw "Content non existing in this fragment"
  }

  write_to_file(){
    let fw = new FW();
    
  }
}
