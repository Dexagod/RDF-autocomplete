
var fs = require('fs');
var rimraf = require('rimraf')

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
  this.node_count = 0;
  this.root_fragment = new Fragment(null);
  this.root_node = new Node(null, this.root_fragment, null)
  this.assign_fragment_id(this.root_fragment);
  this.assign_node_id(this.root_node)
  this.root_fragment.add_node(this.root_node);

}

B3.prototype.assign_fragment_id = function(fragment) {
  fragment.id = this.fragment_count;
  this.fragment_count = this.fragment_count + 1;
  fragments.push(fragment)
}


B3.prototype.assign_node_id = function(node) {
  node.id = this.node_count;
  this.node_count = this.node_count + 1;
}


B3.prototype.add_triple = function(triple) {
  let node = this.root_node;
  let repr = triple.representation;
  // Iterate the tree letter per letter
  for (index in repr){
    let letter = repr[index];
    // check if the node has a child node containing the next letter
    let child = node.request(letter);
    console.log(node)
    if (child != null) {
      node = child;
    } else {
      let current_fragment = node.fragment;
      let child = new Node(letter, current_fragment, node)
      this.assign_node_id(child)
      node.insert_node(child);
      if (current_fragment.contents.length > this.fragment_size) {
        //this.balance(fragment);
        // Temporary try-out
        let new_fragment = new Fragment(current_fragment);
        this.assign_fragment_id(new_fragment);
        child.fragment = new_fragment
        new_fragment.add_node(child);
        new_fragment.root_node = child;
      } else {
        current_fragment.add_node(child);
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
function Fragment(predecessor_fragment) {
  this.contents = new Array();
  this.id = null;
  this.predecessor_fragment = predecessor_fragment;
  this.root_node = null;
}

Fragment.prototype.add_node = function(node) {
  this.contents.push(node);
}

Fragment.prototype.request_node = function(content){
  for (index in this.contents) {
    if (this.contents[index] == searched_contents) {
      return this.contents[index];
    }
  }
}


var serialize_fragment = function(fragment){
  let filename = "searchfragments/serialized_fragment_"+fragment.id

}

var deserialize_fragment = function(fragment_id){
  let filename = "searchfragments/serialized_fragment_"+fragment_id


}

Fragment.prototype.write_to_file = function(){
  let filename = "searchfragments/fragment"+this.id
  console.log(filename)
  let cache = []
  let string = "fragment" + this.id + "\n";
  for (nodeindex in this.contents){
    node = this.contents[nodeindex]
    string += node.id + " :: " + node.token + " || " ;
    for (i in node.children){
      string += node.children[i].id + " - "
    }
    string += "\n"
  }
  string += "\n"
  fs.writeFile(filename, string, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
}

/*
 * NODE
*/
function Node(token, fragment, parent) {
  this.id = null;
  this.token = token;
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
    if (this.children[index].token == letter){
        return this.children[index];
    }
  }
  return null;
}


var newB3 = new B3(5);
var trip_1 = new Triple("aapje")
var trip_2 = new Triple("aarde")
var trip_3 = new Triple("boom")
newB3.add_triple(trip_1)
newB3.add_triple(trip_2)
newB3.add_triple(trip_3)
console.log(newB3)

for (index in fragments) {
  console.log(index)
  console.log(fragments[index])
  fragments[index].write_to_file();
}
