module.exports = class {
  constructor(token_string, fragment, parent_node, b3) {
    this.id = b3.assign_node_id(this);
    this.token = null;
    this.token_string = token_string;
    this.triple = null;
    this.corrections = null;
    this.suggestions = null;
    this.children = new Array();
    this.parent_node = parent_node;
    this.fragment = fragment;
  }

  insert_node(node) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].token_string == node.token_string) {
        throw "trying to add existing child node"
      }
    }
    this.children.push(node);
  }

  replace_child(oldchild, newchild) {
    var index = this.children.indexOf(oldchild);
    if (index > -1) {
      this.children.splice(index, 1);
    } else {
      throw ("Trying to remove unexisting child from node")
    }
    this.children.push(newchild)
  }


  request(letter) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].token == letter) {
        return this.children[i];
      }
    }
    return null;
  }


  get_child_token_strings() {
    let child_array = new Array()
    for (var i = 0; i < this.children.length; i++) {
      child_array.push(this.children[i].token_string)
    }
    return child_array;
  }

  // This funcction changes the fragment of the given node and all its children withing the same original fragment -- INCLUDES THE ORIGINAL NDOE
  change_fragment_node_and_children(old_fragment, new_fragment) {
    if (this.fragment == old_fragment) {
      this.fragment = new_fragment;
      new_fragment.add_node(this);
      old_fragment.remove_node(this);
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].change_fragment_node_and_children(old_fragment, new_fragment);
      }
    }
  }
}
