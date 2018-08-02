
var fs = require('fs');

/*
 * B3
*/

// DEBUGGING PURPOSES
var fragments = new Array();


function Search(string){
  this.search = search;
}

function Triple(representation){
  this.representation = representation;
}

function B3(fragment_size) {
  this.fragment_size = fragment_size;
  this.fragment_count = 0;
  this.root_fragment = new Fragment(this.fragment_count, null);
  this.root_fragment.root_node = new Node(null, this.root_fragment, null)
  this.increase_fragment_count(this.root_fragment);

}

B3.prototype.increase_fragment_count = function(fragment) {
  this.fragment_count = this.fragment_count + 1;
  fragments.push(fragment)
}

B3.prototype.add_triple = function(triple) {
  let node = this.root_fragment.root_node;
  let repr = triple.representation;
  // Iterate the tree letter per letter
  for (index in repr){
    let letter = repr[index];
    // check if the node has a child node containing the next letter
    let child = node.request(letter);
    if (child != null) {
      node = child;
    } else {
      let current_fragment = node.fragment;
      let child = new Node(letter, current_fragment, node)
      node.insert_node(child)
      current_fragment.add_node(child);
      if (current_fragment.contents.length > this.fragment_size) {
        this.balance(fragment);
      }
      node = child;
    }

  }
}

B3.prototype.balance = function(fragment){

}

/*
 * FRAGMENT
*/
function Fragment(identifyer, predecessor_fragment) {
  this.contents = new Array();
  this.predecessor_fragment = predecessor_fragment;
  this.root_node = null;
}

Fragment.prototype.add_node = function(node) {
  this.contents.push(node);
  // CHeck if too big here or in tree itself? makes possible to exchange fragments to other trees or to adapt maxsize on the fly?
}

Fragment.prototype.request_node = function(content){
  for (index in this.contents) {
    if (this.contents[index] == searched_contents) {
      return this.contents[index];
    }
  }
}

/*
 * NODE
*/
function Node(id, fragment, parent) {
  this.id = id
  this.triple = null;
  this.corrections = null;
  this.suggestions = null;
  this.children = new Array();
  this.parent = parent;
  this.fragment = fragment;
}

Node.prototype.insert_node = function(node){
  this.children.push(node);
}

Node.prototype.request = function(letter){
  for (index in this.children) {
    if (this.children[index].id == letter){
        return this.children[index];
    }
  }
  return null;
}


var newB3 = new B3(5);
console.log(newB3)
var hallo_triple = new Triple("test")
newB3.add_triple(hallo_triple)
console.log(newB3)

for (index in fragments) {
  console.log(fragments[index])
}
