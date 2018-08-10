var Suggestion = require('./suggestion.js')
module.exports = class {

  // CHILDREN:: node.token_string => [child.fragment, child.id]
  // CHILDREN:: node.parent_node => [parent_node.fragment, parent_node.id]
  constructor(token_string, fragment, parent_node, b3) {
    this.id = b3.provide_node_id(this);
    this.token_string = token_string;
    this.triples = new Array();
    this.children = {};
    this.fragment_id = fragment.id;
    this.fc = b3.get_fragment_cache();
    if (parent_node != null){
      this.parent_node = [parent_node.get_fragment_id(), parent_node.id];
    } else {
      this.parent_node = null;
    }

    this.suggestions = {};
  }

  // This function adds a child node to this node.
  // The parent node is set upon creation

  add_child(node) {
    this.children[node.get_token_string()] = [node.get_fragment_id(), node.id];
    node.set_parent_node(this);
  }

  // Removes a child node from this node
  // Compares on token string so no need for the same Node object
  remove_child(node) {
    delete this.children[node.get_token_string()];
  }

  // Return the child given its token string
  get_child_by_token_string(token_string){
    return this.fc.get_fragment_by_id(this.children[token_string][0]).get_node_by_id(this.children[token_string][1])
  }

  // Replaces a child node by another node.
  // This is needed for a partial match where a node is split into two nodes.
  replace_child(oldchild, newchild) {
    this.remove_child(oldchild)
    this.add_child(newchild)
  }

  // Updates the child node.
  // Used when child changes fragment, so the parent needs to update the child fragment id in its children.
  update_child(child) {
    this.children[child.get_token_string()] = [child.get_fragment_id(), child.id]
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
    this.fragment_id = fragment.id
    if (this.triples.length != 0){
      this.fix_suggestions_fragment_id(this.get_triples()[0].get_representation(), this.fragment_id)
    }
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
  }

  // This function changes the fragment of this node and updates the parent and the child nodes with the new information
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
    if (this.id != 1) {
      this.get_parent_node().update_child(this);
    }
    this.update_children();
  }

  // Updates all child nodes with the new fragment of the parent node.
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

  set_triples(triples) {
    this.triples = triples;
  }

  get_triples() {
    return this.triples;
  }

  add_triple(triple){
    this.triples.push(triple);
    if (this.triples.length == 1){
      this.percolate_suggestion(new Suggestion(this.triples, this.fragment_id, this.id))
    } else {
      this.fix_suggestions_fragment_id(this.triples[0].get_representation(), this.fragment_id, triple)
    }
  }

  get_suggestions(){
    return this.suggestions
  }
  
  set_suggestions(suggestions){
    this.suggestions = suggestions
  }

  copy_info(othernode){
    this.set_children(othernode.get_children())
    this.set_triples(othernode.get_triples())
    this.set_suggestions(othernode.get_suggestions())
  }

  fix_suggestions_fragment_id(suggested_word, fragment_id, to_add_triple){
    let keys = Object.keys(this.suggestions)
    if (keys.indexOf(suggested_word) != -1){
      this.suggestions[suggested_word].fragment_id = fragment_id
      if (to_add_triple != null){

        this.suggestions[suggested_word].add_sugested_triple(to_add_triple)
      }
      if (this.has_parent_node()){
        this.get_parent_node().fix_suggestions_fragment_id(suggested_word, fragment_id)
      }
    }
  }

  percolate_suggestion(suggestion){
    let MAX_SUGGESTION_SIZE = 10
   
    if (Object.keys(this.suggestions).length < MAX_SUGGESTION_SIZE){
      this.suggestions[suggestion.get_suggested_word()] = suggestion

      if (this.has_parent_node()){
        this.get_parent_node().percolate_suggestion(suggestion)
      }
    } else {
      let sortedkeys = Object.keys(this.suggestions).sort()
      if (suggestion.get_suggested_word() < sortedkeys[sortedkeys.length - 1]){
        delete this.suggestions[sortedkeys[sortedkeys.length - 1]]
        this.suggestions[suggestion.get_suggested_word()] = suggestion

        if (this.has_parent_node()){
          this.get_parent_node().percolate_suggestion(suggestion)
        }
      }
      // Else no changes were made and we stop forwarding the suggestion
    }
  } 
}
