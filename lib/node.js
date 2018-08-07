module.exports = class {
  constructor(token_string, fragment, parent_node, b3) {
    this.id = b3.assign_node_id(this);
    // this.token = null;
    // this.corrections = null;
    // this.suggestions = null;
    this.token_string = token_string;
    this.triple = null;
    this.children = new Array();
    this.children_fragments = new Array();
    this.parent_node = parent_node;
    this.fragment = fragment;
  }

  insert_node(node) {
    this.get_children().push(node);
  }

  replace_child(oldchild, newchild) {
    var index = this.get_children().indexOf(oldchild);
    this.get_children().splice(index, 1);
    this.get_children().push(newchild)
  }

  get_child_token_strings() {
    let child_array = new Array()
    for (var i = 0; i < this.get_children().length; i++) {
      child_array.push(this.get_children()[i].token_string)
    }
    return child_array;
  }

  // This funcction changes the fragment of the given node and all its children withing the same original fragment -- INCLUDES THE ORIGINAL NDOE
  change_fragment_node_and_children(old_fragment, new_fragment) {
    if (this.fragment == old_fragment) {
      this.change_fragment(new_fragment);
      for (var i = 0; i < this.get_children().length; i++) {
        this.get_children()[i].change_fragment_node_and_children(old_fragment, new_fragment);
      }
    }
  }

  get_children() {
    return this.children;
  }

  set_children(new_children) {
    this.children = new_children
  }

  change_fragment(new_fragment) {
    if (this.fragment != null) {
      this.fragment.remove_node(this);
    }
    this.fragment = new_fragment
    new_fragment.add(this);
  }

  get_representation() {

  }
}
