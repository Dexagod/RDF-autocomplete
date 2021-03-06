var Suggestion = require('./Suggestion.js')
module.exports = class {

  constructor(token_string, fragment, parent_node, tree) {
    this.node_id = tree.provide_node_id(this);
    this.token_string = token_string;
    this.treeDataObjects = new Array();
    this.children = {};
    this.fragment_id = fragment.fragment_id;
    // Initialize the fragment cache from the given tree.
    this.fc = tree.get_fragmentCache();
    if (parent_node != null){
      this.parent_node = [parent_node.get_fragment_id(), parent_node.node_id];
    } else {
      this.parent_node = null;
    }

    this.suggestions = {};
    this.total_children_count = 0;
  }

  // Notify something about the node has changed to the fragment containing the node.
  notify_fragment_dirty(){
    this.get_fragment().changed()
  }

  // This function adds a child node to this node.
  // The parent node is set upon creation
  // This method does not propagate the new information in the node. Needed when replacing an old node for multiple new nodes.
  add_child_no_propagation(node){
    this.children[node.get_token_string()] = [node.get_fragment_id(), node.node_id];
    node.set_parent_node(this);
    this.notify_fragment_dirty();
  }

  // Add a child node to this node and propagate the new information.
  add_child(node) {
    this.add_child_no_propagation(node);
    this.propagate_children_count(node.get_total_children_count() + 1)
  }

  // Return the total amount of children under this node.
  get_total_children_count(){
    return this.total_children_count;
  }

  set_total_children_count(count){
    this.total_children_count = count;
  }

  propagate_children_count(increment){
    this.total_children_count += increment;
    if (this.has_parent_node()){
      this.get_parent_node().propagate_children_count(increment)
    }
  }

  // Removes a child node from this node
  // Compares on token string so no need for the same Node object
  remove_child(node) {
    delete this.children[node.get_token_string()];
    this.notify_fragment_dirty();
  }

  // Return the child given its token string
  get_child_by_token_string(token_string){
    return this.fc.get_fragment_by_id(this.children[token_string][0]).get_node_by_id(this.children[token_string][1])
  }

  // Replaces a child node by another node.
  // This is needed for a partial match where a node is split into two nodes.
  replace_child(oldchild, newchild) {
    this.remove_child(oldchild)
    this.add_child_no_propagation(newchild)
    let difference = newchild.get_total_children_count() - oldchild.get_total_children_count();
    if (difference != 0){
      this.propagate_children_count(difference)
    }
  }

  // Updates the child node.
  // Used when child changes fragment, so the parent needs to update the child fragment id in its children.
  update_child(child) {
    this.children[child.get_token_string()] = [child.get_fragment_id(), child.node_id]
    this.notify_fragment_dirty();
  }

  // Returns the objects of all children for iteration purposes.
  get_children_objects() {
    let fc = this.fc
    let children = this.children
    var values = Object.keys(this.children).map(function(key){
      return fc.get_fragment_by_id(children[key][0]).get_node_by_id(children[key][1]);
    });
    return values;
  }

  // Returns the list of all children without fetching the objects
  get_children_token_strings() {
    var values = Object.keys(this.children);
    return values;
  }

  // Returns the amount of children this node has.
  get_child_count(){
    return Object.keys(this.children).length;
  }

  // Set the children of this node
  // Destructive function!
  // Use only when transfering children from existing node to a newly created node
  set_children(new_children) {
    this.children = new_children
    this.update_children()
    this.notify_fragment_dirty();
  }

  // Return sthe children dict
  get_children() {
    return this.children;
  }

  // Returns the fragment id
  get_fragment_id() {
    return this.fragment_id
  }

  // Gets the fragment object and returns it
  get_fragment() {
    return this.fc.get_fragment_by_id(this.get_fragment_id());
  }

  // Sets the fragment id to the id of a given fragment object
  set_fragment(fragment) {
    this.fragment_id = fragment.fragment_id
    this.notify_fragment_dirty();
  }


  // This function changes the fragment of the given node and all its children
  // within the same original fragment -- INCLUDES THE ORIGINAL NODE
  // Also updates fragment with nodes
  change_fragment_node_and_children(old_fragment_id, new_fragment) {
    let current_fragment_id = this.get_fragment_id();
    if (current_fragment_id == old_fragment_id) {
      // Updating the nodes in the same original fragment
      this.change_fragment(new_fragment);
      let children = this.get_children_objects();
      for (var i = 0; i < children.length; i++){
        children[i].change_fragment_node_and_children(old_fragment_id, new_fragment)
      }
    }
    this.notify_fragment_dirty();
  }

  /**
   * This function changes the fragment of this node and updates the parent and the child nodes with the new information of this node.
   */
  change_fragment(new_fragment) {
    if (this.get_fragment_id() != null) {
      let fragment = this.get_fragment();
      fragment.remove_node(this);
      if (fragment.get_contents_size() == 0){
        this.fc.delete_fragment(fragment);
      }

    }
    this.set_fragment(new_fragment)
    new_fragment.add_node(this);
    if (this.node_id != 1) {
      this.get_parent_node().update_child(this);
    }
    this.update_children();
    this.notify_fragment_dirty();
  }

  /**
   * Private method
   * Updates all child nodes with the new fragment of the parent node.
   */
  update_children(){
    let children = this.get_children_objects()
    for (var i = 0; i < children.length; i++) {
      children[i].set_parent_node(this);
    }
    this.notify_fragment_dirty();
  }

  /**
   * Returns the token string of this node.
   */
  get_token_string(){
    return this.token_string;
  }

  /**
   * Sets the parent node.
   * @param {Node} node 
   */
  set_parent_node(node){
    this.parent_node = [node.get_fragment_id(), node.node_id]
    this.notify_fragment_dirty();
  }

  /**
   * Returns if this node has a parent node.
   * If this is not the case, this is the root node.
   */
  has_parent_node(){
    return this.parent_node != null;
  }
  
  /**
   * returns the parent node.
   */
  get_parent_node(){
    return this.fc.get_fragment_by_id(this.parent_node[0]).get_node_by_id(this.parent_node[1])
  }

  /**
   * Overwrites the treeDataObjects in this node.
   * @param {TreeDataObject} treeDataObjects 
   */
  set_treeDataObjects(treeDataObjects) {
    this.treeDataObjects = treeDataObjects;
    this.notify_fragment_dirty();
  }

  /**
   * Returns the treeDataObjects contained in this node.
   */
  get_treeDataObjects() {
    return this.treeDataObjects;
  }

  /**
   * Adds 
   * @param {TreeDataObject} treeDataObject 
   */
  add_data(treeDataObject){
    this.treeDataObjects.push(treeDataObject);
    if (this.treeDataObjects.length == 1){
      this.propagate_suggestion(new Suggestion(this.treeDataObjects))
    } else {
      this.update_suggestions_fragment_id(treeDataObject)
    }
    this.notify_fragment_dirty();
  }

  /**
   * Returns suggestions contained in this node.
   */
  get_suggestions(){
    let newsuggestions = {}
    for(var key in this.suggestions){
      if (this.suggestions.hasOwnProperty(key)) {           
        newsuggestions[key] = new Suggestion(this.suggestions[key].get_treeDataObjects())
      }
    }
    return newsuggestions;
  }
  
  set_suggestions(suggestions){
    this.suggestions = suggestions
    this.notify_fragment_dirty();
  }

  /**
   * Helper method to transfer node information to a new node.
   * @param {Node} othernode 
   */
  copy_info(othernode){
    this.set_children(othernode.get_children())
    this.set_treeDataObjects(othernode.get_treeDataObjects())
    this.set_suggestions(othernode.get_suggestions())
    this.set_total_children_count(othernode.get_total_children_count())
    this.notify_fragment_dirty();
  }

  /**
   * Private method
   * Updates the suggestions in the tree of the same representation as the newly added object.
   * (for example a streetname that occurs multiple times)
   * Only executed if such a suggestion already exists.
   * @param {TreeDataObject} treeDataObject 
   */
  update_suggestions_fragment_id(treeDataObject){
    let suggested_word = treeDataObject.get_representation();
    let keys = Object.keys(this.suggestions)
    if (keys.indexOf(suggested_word) != -1){
      if (treeDataObject != null){
        // Adding the new dataobject to the suggestion.
        if (this.suggestions[suggested_word].add_sugested_treeDataObject(treeDataObject)){
          this.notify_fragment_dirty();
          if (this.has_parent_node()){
            this.get_parent_node().update_suggestions_fragment_id(treeDataObject)
          }
        }
      } else {
        throw "Trying to propagate null value treeDataObject"
      }
    }
  }

  /**
   * Private method
   * propagates suggestion to parent node untill the current node is already full of suggestions
   * Comparing happens alphabetically at the moment, needs to be ordered with a score given to a suggestion. TODO.
   * This is only called the first time a data item with the given representation is added. 
   * All following times will call update_suggestions_fragment_id
   */
  propagate_suggestion(suggestion){
    let MAX_SUGGESTION_SIZE = 10
  
    if (Object.keys(this.suggestions).length < MAX_SUGGESTION_SIZE){
      let newsuggestion = new Suggestion(suggestion.get_treeDataObjects())
      this.suggestions[newsuggestion.get_suggested_word()] = newsuggestion
      this.notify_fragment_dirty();
      if (this.has_parent_node()){
        this.get_parent_node().propagate_suggestion(suggestion)
      }
    } else {
      let sortedkeys = Object.keys(this.suggestions).sort()
      // TODO COMPARE WITS SCORE AND NOT ALPHABETICALLY
      if (suggestion.get_suggested_word() < sortedkeys[sortedkeys.length - 1]){
        delete this.suggestions[sortedkeys[sortedkeys.length - 1]]
        let newsuggestion = new Suggestion(suggestion.get_treeDataObjects())
        this.suggestions[newsuggestion.get_suggested_word()] = newsuggestion
        this.notify_fragment_dirty();
        if (this.has_parent_node()){
          this.get_parent_node().propagate_suggestion(suggestion)
        }
      }
      // Else no changes were made and we stop forwarding the suggestion
    }
  } 
}
