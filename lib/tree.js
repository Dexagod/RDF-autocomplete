var DefaultBalancer = require('./fragment_balancers/DefaultBalancer.js');

var Node = require('./node.js');
var Fragment = require('./fragment.js');
var treeDataObject = require('./TreeDataObject.js');
var FC = require('./FragmentCache.js')

module.exports = class {

  /**
   * Representation of a patricia tree.
   * @param {number} max_fragment_size 
   * @param {FragmentCache} fragmentCache 
   * @param {TreeBalancer} balancer 
   * @param {any} manages 
   */
  constructor(max_fragment_size, fragmentCache, balancer = null, manages = null) {
    this.max_fragment_size = max_fragment_size;
    this.fragment_count = 0;
    this.node_count = 0;

    this.fragmentCache = fragmentCache;

    let root_fragment = new Fragment(this);
    let root_node = new Node("", root_fragment, null, this)
    this.root_node_id = root_node.node_id;
    this.root_fragment_id = root_fragment.fragment_id;
    root_fragment.add_node(root_node);
    root_fragment.set_root_node(root_node)
    this.add_fragment(root_fragment)
    this.manages = manages;

    this.options = {};
    this.options.locale = 'be'; //Default to belgian locale for now
      //TODO:      When comparing large numbers of strings, such as in sorting large arrays, it is better to create an Intl.Collator object and use the function provided by its compare property.
      
    if (this.balancer != null){
      this.balancer = this.balancer
    } else {
      this.balancer = new DefaultBalancer();
    }
    this.balancer.setTree(this);

  }

  /**
   * Provides a new unique id for this fragment and returns new id (does not yet set the id).
   * Fragment argument is unused, kept in case of needed refactor of this method.
   * @param {Fragment} fragment 
   */
  provide_fragment_id(fragment) {
    this.fragment_count = this.fragment_count + 1;
    return this.fragment_count.toString();
  }

  /**
   * Provides a new unique id for this node and returns new id (does not yet set the id).
   * Node argument is unused, kept in case of needed refactor of this method.
   * @param {Node} node 
   */
  provide_node_id(node) {
    this.node_count = this.node_count + 1;
    return this.node_count.toString();
  }

  /** 
   * Returns the tree root node.
   */
  get_root_node(){
    return this.get_fragment_by_id(this.root_fragment_id).get_node_by_id(this.root_node_id);
  }

  /**
   * Updates the fragment of the root node (in case of rebalancing that changes root node framgent).
   * @param {Fragment} fragment 
   */
  adjust_root_node(fragment){
    return this.root_fragment_id = fragment.fragment_id;
  }

  /**
   * Adds a new fragment to this tree.
   * Fragment is added to the tree fragmentCache.
   * @param {Fragment} fragment 
   */
  add_fragment(fragment) {
    this.get_fragmentCache().add_fragment(fragment);
  }

  /**
   * Returns the requested fragment form the fragmentCache.
   * @param {number} fragment_id 
   */
  get_fragment_by_id(fragment_id) {
    return this.get_fragmentCache().get_fragment_by_id(fragment_id);
  }

  /**
   * Adds the given data to the tree.
   * @param {TreeDataObject} treeDataObject 
   */
  addData(treeDataObject) {
    let node = this.get_root_node();
    let repr = treeDataObject.get_representation();
    // Check for invalid object.
    // Object must have a representation.
    if (repr == "" || repr == null){
      return null;
    }

    // Iterate the tree lettergroup per lettergroup.
    let index = 0
    while (index < repr.length) {
      // Check if the node has a child node containing the next letter
      var children_token_strings = node.get_children_token_strings();
      let found_child = false;
      if (children_token_strings.length !== 0) {
        // This node contains children
        // All children are iterated and checked for a match with the given word.
        for (var i = 0; i < children_token_strings.length; i++) {
          let letter = repr[index];
          let found_total_match = false;
          let found_partial_match = false;

          // The character array of the currently looked at child.
          let current_child_token_string = children_token_strings[i];

          // Iterate over all the letters in the childs character array
          let child_tokens_length = current_child_token_string.length;
          let node_match_index = 0
          for (node_match_index;
            (node_match_index < child_tokens_length && current_child_token_string[node_match_index] === letter); node_match_index++) {
              //(current_child_token_string[node_match_index] === letter)   &&   (current_child_token_string[node_match_index].localeCompare(letter, this.options.locale) === 0)
              // This code gave errors? 
              // TODO:: check this for correct behaviour and implement using the the localcompare
            index += 1
            letter = repr[index];
          }
          // Checking if a total match was found.
          if (node_match_index === child_tokens_length) {
            // A total match was found
            found_child = true;
            node = this.total_matching_child_node(node, children_token_strings[i]);
            break;
          } else if (node_match_index > 0) {
            // A partial match was found
            found_child = true;
            node = this.partial_matching_child_node(node, children_token_strings[i], node_match_index, index, treeDataObject);
            node.add_data(treeDataObject);
            return node
          }
        }
        if (found_child !== true) {
          // No match was found
          node = this.no_matching_child_node(node, index, treeDataObject);
          node.add_data(treeDataObject);
          return node
        }

      } else {
        // This node contains no children
        node = this.no_matching_child_node(node, index, treeDataObject);
        node.add_data(treeDataObject);
        return node
      }

    }
    node.add_data(treeDataObject);
    return node;
  }

  // 
  /**
   * No matching nodes were found.
   * In the node we add a new child containing the treeDataObject.
   * All propagations of totalitems and suggestions are executed automatically.
   * @param {Node} node 
   * @param {number} index 
   * @param {TreeDataObject} treeDataObject 
   */
  no_matching_child_node(node, index, treeDataObject) {
    let repr = treeDataObject.get_representation();
    let current_fragment = node.get_fragment();

    let string = "";
    // Construct the substring for the new node.
    for (var i = index; i < repr.length; i++) {
      string += repr.charAt(i)
    }

    // Create the new node.
    let child = new Node(string, current_fragment, node, this)

    // Add the child to the node.
    node.add_child(child);
    // Add the child to the fragment.
    current_fragment.add_node(child)

    // Check for balancing needs.
    // Decide where the balancing has to start.
    if (current_fragment.get_contents_size() > this.max_fragment_size) {
      if (node.has_parent_node()){
        this.balancer.balance(node)
      } else {
        // Don't randomly start balancing your root node as it will shift from its current fragment -> needs to be adapted etc...
        this.balancer.balance(child)
      }
    }
    return child;
  }

  /**
   * A node has been partially matched with the currently searched substring of the searchword.
   * This method changes the node that matches partly into two nodes, and adds a new node on the place untill where they matched
   * This new node will be the node containing the given treeDataObject and is returned.
   * @param {Node} parent_node 
   * @param {string} child_token_string 
   * @param {number} nodeindex 
   * @param {number} treeDataObjectindex 
   * @param {TreeDataObject} treeDataObject 
   */
  partial_matching_child_node(parent_node, child_token_string, nodeindex, treeDataObjectindex, treeDataObject) {
    let node = parent_node.get_child_by_token_string(child_token_string);
    let root_parent = node.get_parent_node();
    let children = node.get_children_objects();
    let current_fragment = node.get_fragment();

    // The strings for the three new nodes, one parent node with two child nodes.
    let before_string_match = node.token_string.slice(0, nodeindex)
    let after_string_match = node.token_string.slice(nodeindex, node.token_string.length)
    let after_treeDataObject_match = treeDataObject.get_representation().slice(treeDataObjectindex, treeDataObject.get_representation().length)

    // Make sure the two child nodes are not equal - DEBUG TEST
    if (after_string_match === after_treeDataObject_match) {
      throw "STING MATCHES EQUAL"
    }

    if (treeDataObjectindex !== treeDataObject.get_representation().length) {
      // The searched word is not yet completed, a new path should be added

      // Create the new three nodes
      let root_node = new Node(before_string_match, current_fragment, null, this)
      let old_match_node = new Node(after_string_match, current_fragment, root_node, this)
      let new_match_node = new Node(after_treeDataObject_match, current_fragment, root_node, this)

      // Add the new nodes to the fragment and remove the old node
      current_fragment.add_node(root_node)
      current_fragment.add_node(old_match_node)
      current_fragment.add_node(new_match_node)

      if (current_fragment.get_root_node_id() === node.node_id){
        current_fragment.set_root_node(root_node)
      }
      
      current_fragment.remove_node(node)

      // old children are transfered to the child node that leads to these children (and treeDataObject as well)
      root_node.set_suggestions(node.get_suggestions())
      old_match_node.copy_info(node);

      // Replace node with three new nodes
      root_node.add_child(old_match_node)
      root_node.add_child(new_match_node)
      // Fix because of percolating children counts
      root_node.set_parent_node(root_parent)
      root_parent.replace_child(node, root_node)

      if (current_fragment.contents.length > this.max_fragment_size) {
        if (root_node.node_id == this.root_node_id) {
            this.balancer.balance(old_match_node)
            this.balancer.balance(new_match_node)
        } else {
            this.balancer.balance(root_node)
        }
      }

      return new_match_node;
    } else {
      // The searched word has been found, the node must be split so it can point to the treeDataObject
      let root_node = new Node(before_string_match, current_fragment, null, this)
      let old_match_node = new Node(after_string_match, current_fragment, root_node, this)

      current_fragment.add_node(root_node)
      current_fragment.add_node(old_match_node)

      if (current_fragment.get_root_node_id() === node.node_id){
        current_fragment.set_root_node(root_node)
      }
      

      // old children are transfered to the child node that leads to these children
      root_node.set_suggestions(node.get_suggestions())
      old_match_node.copy_info(node);

      // Replace node with three new nodes
      root_node.add_child(old_match_node)
      // Fix because of percolating children counts
      root_node.set_parent_node(root_parent)
      root_parent.replace_child(node, root_node)
      

      current_fragment.remove_node(node)

      if (current_fragment.contents.length > this.max_fragment_size) {
        if (root_node.node_id == this.root_node_id) {
            this.balancer.balance(old_match_node)
            this.balancer.balance(new_match_node)
        } else {
            this.balancer.balance(root_node)
        }
      }


      return root_node;
    }
  }

  /**
   * The node containing this representation already existed and the node is returned.
   * The dataobject is added to the node in the calling method (addData).
   * @param {Node} node 
   * @param {string} child_token_string 
   */
  total_matching_child_node(node, child_token_string) {
    return node.get_child_by_token_string(child_token_string);
  }

  /**
   * The given dataobject is searched in the tree.
   * For testing and debugging purposes.
   * @param {DataObject} searched_treeDataObject 
   */
  searchData(searched_treeDataObject) {
    let representation = searched_treeDataObject.get_representation();
    let node = this.get_root_node();
    let current_index = 0;
    while (current_index < searched_treeDataObject.get_representation().length) {
      let found = false;
      let node_children = node.get_children_objects();
      for (var i = 0; i < node_children.length; i++) {
        let child = node_children[i]
        let child_token_len = child.get_token_string().length;
        let representation_substring = searched_treeDataObject.get_representation().substring(current_index, current_index+child_token_len)
        // console.log((child.token_string.localeCompare(representation_substring)) === (child.token_string === representation_substring))
        if (child.get_token_string() === representation_substring) {
          found = true;
          node = child;
          current_index += child.get_token_string().length
          break;
        }
      }
      if (!found) {
        let strng = "The word " + searched_treeDataObject.get_representation() + " was not present in the tree."
        throw strng
      }
    }
    return node.get_treeDataObjects()
  }

  /**
   * Returns the tree fragment cache.
   */
  get_fragmentCache() {
    return this.fragmentCache;
  }

}
