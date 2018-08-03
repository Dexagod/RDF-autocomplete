
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
  this.root_node = new Node("ROOT", this.root_fragment, null)
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

  // console.log("")
  // console.log("")
  // console.log("##############################")
  // console.log("NEW ITERATION")
  // console.log(triple.representation)
  // for (var i = 0; i < fragments.length; i++) {
  //   console.log("  fragment: " + fragments[i].id)
  //   for (var j = 0; j < fragments[i].contents.length; j++) {
  //     console.log("    " + fragments[i].contents[j].token_string)
  //   }
  // }
  //
  // console.log("")
  // console.log("")


  let node = this.root_node;
  let repr = triple.representation;
  // Iterate the tree letter per letter
  let index = 0
  while (index < repr.length){
    // check if the node has a child node containing the next letter
    let children_array = node.request_paths();
    let found_child = false;
    if (children_array.length != 0) {
      //There are children in this node
      for (var i = 0; i < children_array.length; i++) {

        let checking_index = index;
        let letter = repr[checking_index];
        let found_total_match = false;
        let found_partial_match = false;
        let current_child_token_array = children_array[i];

        let node_match_index = 0;

        // Iterate over all the letters in the childs character array
        for (node_match_index = 0; node_match_index < current_child_token_array.length; node_match_index++) {

          // If the child contains the n-th position letter, shift one and set flag
          if (current_child_token_array[node_match_index] == letter){
            found_partial_match = true
            checking_index += 1;
            letter = repr[checking_index];
  // console.log(fragment.contents.length)
  // console.log(new_fragment.contents.length)
  //
  // console.log("####################")
  // for (var i = 0; i < fragment.contents.length; i++) {
  //   console.log(fragment.contents[i].token_string)
  // }
  //
  // console.log(":::::::::::::::::::::::")
  // for (var i = 0; i < new_fragment.contents.length; i++) {
  //   console.log(new_fragment.contents[i].token_string)
  // }
          } else {
            break;
          }
          if (checking_index == children_array[i].length){
            found_total_match = true;
          }
        }
        // Checking if matching child was found
        if (found_total_match == true) {
          let found_child = true;
          node = total_matching_child_node(node.children[i]);
          // Move the search index
          index = checking_index;
          break;
        } else if (found_partial_match == true) {
          let found_child = true;
          node = partial_matching_child_node(this, node.children[i], node_match_index, checking_index, triple);
          node.triple = triple
          return node;
        }
      }
      if (found_child != true) {
        node = no_matching_child_node(this, node, index, triple);
        node.triple = triple
        return node;
      }

    } else {
      node = no_matching_child_node(this, node, index, triple);
      node.triple = triple
      return node;
    }

  }
  node.triple = triple
  return node;
}

var no_matching_child_node = function(b3, node, index, triple){

  // There are no children in this node
  let repr = triple.representation;
  let current_fragment = node.fragment;

  let string = "";
  for (var i = index; i < repr.length; i++) {
    string += repr.charAt(i)
  }

  let child = new Node(string, current_fragment, node)
  index = repr.length
  b3.assign_node_id(child)
  node.insert_node(child);
  current_fragment.add_node(child)

  if (current_fragment.contents.length > b3.max_fragment_size) {
    b3.balance(child)
  }
  node = child;
  return node;
}

// Changes the node that matches partly into two nodes, and adds a new node on the place untill where they matched
// This new node will be the node containing the given triple and is returned.
var partial_matching_child_node = function(b3, node, nodeindex, tripleindex, triple){

  let root_parent = node.parent_node;
  let children = node.children;
  let current_fragment = node.fragment;

  let before_string_match = node.token_string.slice(0, nodeindex)
  let after_string_match = node.token_string.slice(nodeindex, node.token_string.length)
  let after_triple_match = triple.representation.slice(tripleindex, triple.representation.length)

  let root_node = new Node(before_string_match, current_fragment, root_parent)
  b3.assign_node_id(root_node)
  let old_match_node = new Node(after_string_match, current_fragment, root_node)
  b3.assign_node_id(old_match_node)
  let new_match_node = new Node(after_triple_match, current_fragment, root_node)
  b3.assign_node_id(new_match_node)


  current_fragment.remove_node(node)
  current_fragment.add_node(root_node)
  current_fragment.add_node(old_match_node)
  current_fragment.add_node(new_match_node)

  // old children are transfered to the child node that leads to these children
  old_match_node.children = node.children;

  // Replace node with three new nodes
  root_node.insert_node(old_match_node)
  root_node.insert_node(new_match_node)
  root_parent.replace_child(node, root_node)
  if (current_fragment.contents.length > b3.max_fragment_size) {
    b3.balance(root_node)
  }

  return new_match_node;

}

var total_matching_child_node = function(node){
  return node;
}


// The newly added node will need to have an existing fragment
B3.prototype.balance = function(node){
  let fragment = node.fragment;
  let parent_node = node.parent_node;
  while (parent_node.children.length < 2 && parent_node.parent_node.fragment == fragment) {
    parent_node  = parent_node.parent_node;
  }
  if (parent_node.parent_node == B3.root_node || parent_node.parent_node.fragment != fragment){

    var new_fragment = new Fragment();
    this.assign_fragment_id(new_fragment);
    new_fragment.root_node = node;
    node.change_fragment_node_and_children(fragment, new_fragment);
  } else {
    let fragment = parent_node.fragment

    for (childindex in parent_node.children){
      var new_fragment = new Fragment();
      this.assign_fragment_id(new_fragment);
      let childnode = parent_node.children[childindex]
      new_fragment.root_node = childnode; // PROBABLY USELESS
      childnode.change_fragment_node_and_children(fragment, new_fragment);
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
    string += node.id + " :: " + node.token_string + " || " ;
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
function Node(token_string, fragment, parent_node) {
  this.id = null;
  this.token = null;
  this.token_string = token_string;
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

Node.prototype.replace_child = function(oldchild, newchild){
  var index = this.children.indexOf(oldchild);
  if (index > -1) {
    this.children.splice(index, 1);
  }
  this.children.push(newchild)
}


Node.prototype.request = function(letter){
  for (index in this.children) {
    if (this.children[index].token == letter){
        return this.children[index];
    }
  }
  return null;
}


Node.prototype.request_paths = function(){
  let child_array = new Array()
  for (index in this.children) {
    child_array.push(this.children[index].token_string)
  }
  return child_array;
}

// This funcction changes the fragment of the given node and all its children withing the same original fragment -- INCLUDES THE ORIGINAL NDOE
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

var FRAGMENT_SIZE = 50;

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
  console.log("max fragment size allowed: " + FRAGMENT_SIZE)
  console.log("avg fragment nodes contained: " + avg_frag_size)
  let avgfragfill = avg_frag_size / FRAGMENT_SIZE;
  console.log("avg frag fill: " + avgfragfill )


  console.log("")
  console.log("NODE DATA")
  console.log("total triple count: " + 49711) //linecounter)
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
  } else {
    console.log(node.token_string)
  }
  for (index in node.children) {
    calculate_node_fragments_passed(node.children[index], newdist);
  }
}

var newB3 = new B3(FRAGMENT_SIZE);




var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('data/laatstestraatnamen.txt')
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

//
//
// var newB3 = new B3(6);
// let triples = new Array();
// triples.push(new Triple("test"))
// triples.push(new Triple("aapje"))
// triples.push(new Triple("aarde"))
// triples.push(new Triple("dank"))
// triples.push(new Triple("dankbaar"))
// triples.push(new Triple("boom"))
// triples.push(new Triple("boek"))
// triples.push(new Triple("daarboven"))
// triples.push(new Triple("dacht"))
// triples.push(new Triple("daarbij"))
//
// for (var i = 0; i < triples.length; i++) {
//   newB3.add_triple(triples[i])
// }
//
// for (index in fragments) {
//  if (fragments[index].contents.length > 0){
//     fragments[index].write_to_file();
//   }
// }
