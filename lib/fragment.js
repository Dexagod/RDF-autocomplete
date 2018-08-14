module.exports = class {

  constructor(b3) {
    this.contents = {};
    this.fragment_id = b3.provide_fragment_id(this);
    this.dirty = false
  }

  add_node(node) {
    this.contents[node.node_id] = node;
    this.dirty = true
  }

  remove_node(node) {
    delete this.contents[node.node_id]
    this.dirty = true
  }

  remove_node_by_id(node_id) {
    delete this.contents[node_id]
    this.dirty = true
  }


  get_node_by_id(node_id) {
    let str = "Fragment " + this.fragment_id + " does not contain the id: " + node_id

    if (this.contents[node_id] === undefined){ 
      console.log(this.contents)
      console.trace(); throw str
    }
    return this.contents[node_id];
  }

  get_node(node) {
    return this.contents[node.node_id];
  }

  get_contents_size(){
    if (this.contents == null){
      console.log(this)
      console.trace()
    }
    return Object.keys(this.contents).length;
  }

  request_contents(node_id) {
    return this.contents;
  }
}
