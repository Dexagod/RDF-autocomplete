module.exports = class {

  // CHILDREN:: node.token_string => [child.fragment, child.id]
  // CHILDREN:: node.parent_node => [parent_node.fragment, parent_node.id]
  constructor(token_string, fragment, parent_node, b3) {
    this.id = b3.provide_node_id(this);
    this.token_string = token_string;
    this.triple = null;
    this.children = {};
    this.parent_node = parent_node;
    this.fragment_id = fragment.id;
    this.fc = b3.get_fragment_cache();
  }

  // Add a child node
  add_child(node) {
    this.children[node.get_token_string()] = [node.get_fragment_id(), node.id];
    node.set_parent_node(this);
  }

  // Return the child given its token string
  get_child_by_token_string(token_string){
    return this.fc.get_fragment_by_id(this.children[token_string][0]).get_node_by_id(this.children[token_string][1])
  }

  // Remove the given child
  remove_child(node) {
    delete this.children[node.get_token_string()];
  }

  replace_child(oldchild, newchild) {
    this.remove_child(oldchild)
    this.add_child(newchild)
  }

  update_child(child) {
    this.children[child.get_token_string()] = [child.get_fragment_id(), child.id]
  }

  get_children_objects() {
    let fc = this.fc
    let children = this.children
    var values = Object.keys(this.children).map(function(key){
      return fc.get_fragment_by_id(children[key][0]).get_node_by_id(children[key][1]);
    });
    return values;
  }

  get_children_token_strings() {
    var values = Object.keys(this.children);
    return values;
  }

  get_child_count(){
    return Object.keys(this.children).length;
  }

  set_children(new_children) {
    this.children = new_children
    this.update_children()
  }

  get_children() {
    return this.children;
  }

  get_fragment_id() {
    return this.fragment_id
  }

  get_fragment() {
    return this.fc.get_fragment_by_id(this.get_fragment_id());
  }

  set_fragment(fragment) {
    this.fragment_id = fragment.id
  }


  // This function changes the fragment of the given node and all its children
  // within the same original fragment -- INCLUDES THE ORIGINAL NODE
  // Also updates fragment with nodes
  change_fragment_node_and_children(old_fragment, new_fragment) {
    let current_fragment_id = this.get_fragment_id();
    if (current_fragment_id == old_fragment.id) {
      this.change_fragment(new_fragment);
      let curnode = this;
      Object.keys(this.children).map(function(key){
        curnode.get_child_by_token_string(key).change_fragment_node_and_children(old_fragment, new_fragment);
      });
    }
  }

  // This function changes the fragment of this node and updates the parent and the child nodes with the new information
  change_fragment(new_fragment) {
    if (this.get_fragment_id() != null) {
      this.get_fragment().remove_node(this);
    }
    this.set_fragment(new_fragment)
    new_fragment.add_node(this);
    this.get_parent_node().update_child(this);
    this.update_children();
  }

  update_children(){
    let children = this.get_children_objects()
    for (var i = 0; i < children.length; i++) {
      children[i].set_parent_node(this);
    }
  }

  get_token_string(){
    return this.token_string;
  }

  set_parent_node(node){
    this.parent_node = [node.get_fragment_id(), node.id]
  }


  has_parent_node(){
    return this.parent_node != null;
  }

  get_parent_node(){
    return this.fc.get_fragment_by_id(this.parent_node[0]).get_node_by_id(this.parent_node[1])
  }

  set_triple(triple) {
    this.triple = triple;
  }

  get_triple() {
    return this.triple
  }
}