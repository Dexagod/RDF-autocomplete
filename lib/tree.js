var Node = require('./node.js');
var Fragment = require('./fragment.js');
var Triple = require('./triple.js');
var FC = require('./fragment_cache.js')

module.exports = class {


  constructor(max_fragment_size, fragment_cache) {
    this.max_fragment_size = max_fragment_size;
    this.fragment_count = 0;
    this.node_count = 0;

    this.fragment_cache = fragment_cache;

    let root_fragment = new Fragment(this);
    let root_node = new Node("ROOT", root_fragment, null, this)
    this.root_node_id = root_node.id;
    this.root_fragment_id = root_fragment.id;
    root_fragment.add_node(root_node);

    this.add_fragment(root_fragment);

    this.options = {};
    this.options.locale = 'be'; //Default to belgian locale for now
      //TODO:      When comparing large numbers of strings, such as in sorting large arrays, it is better to create an Intl.Collator object and use the function provided by its compare property.

  }

  provide_fragment_id(fragment) {
    this.fragment_count = this.fragment_count + 1;
    return this.fragment_count;
  }

  provide_node_id(node) {
    this.node_count = this.node_count + 1;
    return this.node_count;
  }

  get_root_node(){
    return this.get_fragment_by_id(this.root_fragment_id).get_node_by_id(this.root_node_id);
  }

  add_fragment(fragment) {
    this.get_fragment_cache().add_fragment(fragment);
  }

  get_fragment_by_id(fragment_id) {
    return this.get_fragment_cache().get_fragment_by_id(fragment_id);
  }

  add_triple(triple) {
    let node = this.get_root_node();
    let repr = triple.get_representation();
    // Iterate the tree letter per letter
    let index = 0
    while (index < repr.length) {
      // check if the node has a child node containing the next letter
      var children_token_strings = node.get_children_token_strings();
      let found_child = false;
      if (children_token_strings.length !== 0) {
        //There are children in this node
        for (var i = 0; i < children_token_strings.length; i++) {

          let letter = repr[index];
          let found_total_match = false;
          let found_partial_match = false;
          let current_child_token_string = children_token_strings[i];

          // Iterate over all the letters in the childs character array
          let child_tokens_length = current_child_token_string.length;
          let node_match_index = 0
          for (node_match_index;
            (node_match_index < child_tokens_length && current_child_token_string[node_match_index] === letter); node_match_index++) {//
              // console.log( (current_child_token_string[node_match_index] === letter)   ===   (current_child_token_string[node_match_index].localeCompare(letter, this.options.locale) === 0) )
            index += 1
            letter = repr[index];
          }
          // Checking if matching child was found
          if (node_match_index === child_tokens_length) {
            // A total match was found
            found_child = true;
            node = this.total_matching_child_node(node, children_token_strings[i]);
            break;
          } else if (node_match_index > 0) {
            // A partial match was found
            found_child = true;
            return this.partial_matching_child_node(node, children_token_strings[i], node_match_index, index, triple);
          }
        }
        if (found_child !== true) {
          return this.no_matching_child_node(node, index, triple);
        }

      } else {
        return this.no_matching_child_node(node, index, triple);
      }

    }
    node.triple = triple
    return node;
  }

  // THE passed node is the last node that can be reached in the tree from where we will need to make a new branch
  no_matching_child_node(node, index, triple) {
    // There are no children in this node
    let repr = triple.get_representation();
    let current_fragment = node.get_fragment();

    let string = "";
    for (var i = index; i < repr.length; i++) {
      string += repr.charAt(i)
    }

    let child = new Node(string, current_fragment, node, this)
    index = repr.length
    node.add_child(child);
    current_fragment.add_node(child)

    if (current_fragment.get_contents_size() > this.max_fragment_size) {
      this.balance(child)
    }
    node = child;
    node.set_triple(triple);
    return node;
  }

  // Changes the node that matches partly into two nodes, and adds a new node on the place untill where they matched
  // This new node will be the node containing the given triple and is returned.
  partial_matching_child_node(parent_node, child_token_string, nodeindex, tripleindex, triple) {
    let node = parent_node.get_child_by_token_string(child_token_string);
    let root_parent = node.get_parent_node();
    let children = node.get_children_objects();
    let current_fragment = node.get_fragment();

    // The strings for the three new nodes, one parent node with two child nodes.
    let before_string_match = node.token_string.slice(0, nodeindex)
    let after_string_match = node.token_string.slice(nodeindex, node.token_string.length)
    let after_triple_match = triple.get_representation().slice(tripleindex, triple.get_representation().length)

    // Make sure the two child nodes are not equal - DEBUG TEST
    if (after_string_match === after_triple_match) {
      throw "STING MATCHES EQUAL"
    }

    if (tripleindex !== triple.get_representation().length) {
      // The searched word is not yet completed, a new path should be added

      // Create the new three nodes
      let root_node = new Node(before_string_match, current_fragment, root_parent, this)
      let old_match_node = new Node(after_string_match, current_fragment, root_node, this)
      let new_match_node = new Node(after_triple_match, current_fragment, root_node, this)

      // Add the new nodes to the fragment and remove the old node
      current_fragment.add_node(root_node)
      current_fragment.add_node(old_match_node)
      current_fragment.add_node(new_match_node)
      current_fragment.remove_node(node)

      // old children are transfered to the child node that leads to these children (and triple as well)
      old_match_node.set_children(node.get_children());
      old_match_node.set_triple(node.get_triple());

      // Replace node with three new nodes
      root_node.add_child(old_match_node)
      root_node.add_child(new_match_node)
      root_parent.replace_child(node, root_node)

      if (current_fragment.contents.length > this.max_fragment_size) {
        this.balance(root_node)
      }

      new_match_node.triple = triple;
      return new_match_node;
    } else {
      // The searched word has been found, the node must be split so it can point to the triple
      let root_node = new Node(before_string_match, current_fragment, root_parent, this)
      let old_match_node = new Node(after_string_match, current_fragment, root_node, this)

      current_fragment.add_node(root_node)
      current_fragment.add_node(old_match_node)

      // old children are transfered to the child node that leads to these children
      old_match_node.set_children(node.get_children());
      old_match_node.triple = node.triple;

      // Replace node with three new nodes
      root_node.add_child(old_match_node)
      root_parent.replace_child(node, root_node)

      current_fragment.remove_node(node)

      if (current_fragment.get_contents_size() > this.max_fragment_size) {
        this.balance(root_node)
      }

      root_node.set_triple(triple);
      return root_node;
    }
  }

  total_matching_child_node(node, child_token_string) {
    return node.get_child_by_token_string(child_token_string);
  }

  search_triple(searched_triple) {
    let representation = searched_triple.get_representation();
    let node = this.get_root_node();
    let current_index = 0;
    while (current_index < searched_triple.get_representation().length) {
      let found = false;
      let node_children = node.get_children_objects();
      for (var i = 0; i < node_children.length; i++) {
        let child = node_children[i]
        let child_token_len = child.get_token_string().length;
        let representation_substring = searched_triple.get_representation().substring(current_index, current_index+child_token_len)
        // console.log((child.token_string.localeCompare(representation_substring)) === (child.token_string === representation_substring))
        if (child.get_token_string() === representation_substring) {
          found = true;
          node = child;
          current_index += child.get_token_string().length
          break;
        }
      }
      if (!found) {
        let strng = "The word " + searched_triple.get_representation() + " was not present in the tree."
        throw strng
      }
    }
    return node.get_triple()
  }

  // The newly added node will need to have an existing fragment

  balance(node) {
    let fragment = node.get_fragment();
    let fragment_id = node.get_fragment_id();
    let parent_node = node.get_parent_node();
    let before_parent_node = null;
    while (parent_node.get_child_count() < 2 && parent_node.get_parent_node().get_fragment_id === fragment_id) {
      before_parent_node = parent_node;
      parent_node = parent_node.get_parent_node();
    }
    if (parent_node === this.get_root_node() || parent_node.get_parent_node() === this.get_root_node() || parent_node.get_parent_node().get_fragment_id !== fragment_id) {
      let new_fragment = new Fragment(this);
      this.add_fragment(new_fragment)

      // Also updates fragment with nodes
      node.change_fragment_node_and_children(fragment, new_fragment);
    } else {
      let current_fragment = parent_node.get_fragment()
      // for (childindex in parent_node.get_children()){
      let new_fragment = new Fragment(this);
      this.add_fragment(new_fragment)
      let childnode = node
      if (before_parent_node !== null) {
        childnode = before_parent_node
      }
      // Also updates fragment with nodes
      childnode.change_fragment_node_and_children(current_fragment, new_fragment);
    }
  }

  get_fragment_cache() {
    return this.fragment_cache;
  }

}
