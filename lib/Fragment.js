module.exports = class {

  /**
   * 
   * @param {Tree} tree 
   */
  constructor(tree) {
    this.contents = {};
    this.fragment_id = tree.provide_fragment_id(this);
    this.dirty = false
    this.root_node_id = null;
  }

  set_root_node(node){
    this.root_node_id = node.node_id
  }

  get_root_node(){
    return this.contents[this.root_node_id];
  }

  get_root_node_id(){
    return this.root_node_id;
  }

  /**
   * Adds node object to the fragment. !!!Does not call rebalancing, this is checked in the Tree.js file!!!
   * @param {*} node 
   */
  add_node(node) {
    this.contents[node.node_id] = node;
    this.dirty = true
  }

  /**
   * Removes node object from fragment if it is contained in the fragment.
   * @param {Node} node 
   */
  remove_node(node) {
    delete this.contents[node.node_id]
    this.dirty = true
  }

  /**
   * Removes node object with a given id if it is contained in the fragment.
   * @param {*} node_id 
   */
  remove_node_by_id(node_id) {
    delete this.contents[node_id]
    this.dirty = true
  }

  /**
   * Returns the node object of a given id if it is contained in the fragment, else throws error.
   * @param {*} node_id 
   */
  get_node_by_id(node_id) {
    let str = "Fragment " + this.fragment_id + " does not contain the id: " + node_id

    if (this.contents[node_id] === undefined){ 
      throw str
    }
    return this.contents[node_id];
  }

  get_node(node) {
    return this.contents[node.node_id];
  }

  get_contents_size(){
    return Object.keys(this.contents).length;
  }

  request_contents(node_id) {
    return this.contents;
  }

  changed(){
    this.dirty = true;
  }
}
