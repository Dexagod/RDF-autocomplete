
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

function B3(max_fragment_size, max_fragment_depth) {
  this.max_fragment_size = max_fragment_size;
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
    if (child != null) {
      node = child;
    } else {
      let current_fragment = node.fragment;
      let child = new Node(letter, current_fragment, node)
      this.assign_node_id(child)
      node.insert_node(child);
      if (current_fragment.contents.length > this.max_fragment_size) {
        this.balance(child)
      } else {
        current_fragment.add_node(child);
      }
      node = child;
    }

  }
  node.triple = triple
}

B3.prototype.balance = function(node){
  let fragment = node.fragment;
  let parent_node = node.parent_node;
  while (parent_node.children.length < 2 && parent_node.parent_node.fragment == fragment) {
    parent_node  = parent_node.parent_node;
  }
  if (parent_node.parent_node == B3.root_node || parent_node.parent_node.fragment != fragment){
    let new_fragment = new Fragment();
    this.assign_fragment_id(new_fragment);
    new_fragment.root_node = node;
    node.change_fragment_node_and_children(fragment, new_fragment);
  } else {
    let current_fragment = parent_node.fragment
    for (childindex in parent_node.children){
      let new_fragment = new Fragment();
      this.assign_fragment_id(new_fragment);
      let childnode = parent_node.children[childindex]
      new_fragment.root_node = childnode;
      childnode.change_fragment_node_and_children(current_fragment, new_fragment);
    }
  }
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

Fragment.prototype.remove_node = function(node) {
  var index = this.contents.indexOf(node);
  if (index > -1) {
    this.contents.splice(index, 1);
  }
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
function Node(token, fragment, parent_node) {
  this.id = null;
  this.token = token;
  this.triple = null;
  this.corrections = null;
  this.suggestions = null;
  this.children = new Array();
  this.parent_node = parent_node;
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

Node.prototype.change_fragment_node_and_children = function(old_fragment, new_fragment) {
  if (this.fragment == old_fragment){
    this.fragment = new_fragment;
    new_fragment.add_node(this);
    old_fragment.remove_node(this);
    for (index in this.children) {
      this.children[index].change_fragment_node_and_children(old_fragment, new_fragment);
    }
  }
}



/*
  TESTINGGG
*/



var distances = new Array();
let max_dist = 0;
let max_word = "";
var node_count = 0;

var calculate_average_fragments_passed = function(b3) {
  let root_node = b3.root_node;
  for (index in root_node.children) {
    calculate_node_fragments_passed(root_node.children[index], 1)
  }


  let sum = 0;
  for( var i = 0; i < distances.length; i++ ){
      sum += parseInt( distances[i], 10 ); //don't forget to add the base
  }
  let avg = sum/distances.length;

  var fragment_sizes = new Array();
  let totalsize = 0
  for( var i = 0; i < fragments.length; i++ ){
    if (fragments[i].contents.length > 0) {
      totalsize = totalsize + 1
      fragment_sizes.push(fragments[i].contents.length)
    }
  }
  let frag_sum = 0
  for( var j = 0; j < fragment_sizes.length; j++ ){
      frag_sum += parseInt( fragment_sizes[j], 10 ); //don't forget to add the base
  }
  let avg_frag_size = frag_sum / fragment_sizes.length


  console.log("")
  console.log("TEST RESULTS")

  console.log("")
  console.log("TREE DATA")
  console.log("Total entries: " + linecounter)
  console.log("average distance: " + avg)
  console.log("maximal distance: " + max_dist)
  console.log("word with max dist: " + max_word.representation)

  console.log("")
  console.log("FRAGMENT DATA")
  console.log("total frag count: " + totalsize)
  console.log("avg frag size: " + avg_frag_size)
  console.log("avg frag size: " + avg_frag_size)


  console.log("")
  console.log("NODE DATA")
  console.log("total node count: " + node_count)
  let node_per_word = node_count / linecounter;
  console.log("nodes per word: " + node_per_word)
}
var calculate_node_fragments_passed = function(node, distance) {
  node_count += 1
  let newdist;
  if (node.parent_node.fragment != node.fragment) {
    newdist = distance + 1;
  } else {
    newdist = distance;
  }
  if (node.triple != null){
    distances.push(newdist)
    if (newdist > max_dist){
      max_dist = newdist
      max_word = node.triple
    }
  }
  for (index in node.children) {
    calculate_node_fragments_passed(node.children[index], newdist);
  }
}




var newB3 = new B3(10);
//
// for (index in fragments) {
//   console.log(index)
//   console.log(fragments[index])
//   fragments[index].write_to_file();
// }


var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('data/straatnamen.txt')
});

var linecounter = 0

lineReader.on('line', function (line) {
  let newtriple = new Triple(line)
  newB3.add_triple(newtriple)
  linecounter += 1;
  if (line == "Grüffl") {
    calculate_average_fragments_passed(newB3);
  }
});
