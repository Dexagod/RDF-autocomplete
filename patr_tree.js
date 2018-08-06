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
  let node = this.root_node;
  let repr = triple.representation;
  // Iterate the tree letter per letter
  let index = 0
  while (index < repr.length){
    // check if the node has a child node containing the next letter
    let children_tokenstring_array = node.get_child_token_strings();
    let found_child = false;
    if (children_tokenstring_array.length != 0) {
      //There are children in this node
      for (var i = 0; i < children_tokenstring_array.length; i++) {

        let letter = repr[index];
        let found_total_match = false;
        let found_partial_match = false;
        let current_child_token_array = children_tokenstring_array[i];

        // Iterate over all the letters in the childs character array
        let child_tokens_length = current_child_token_array.length;
        let node_match_index = 0
        for (node_match_index; (node_match_index < child_tokens_length && current_child_token_array[node_match_index] == letter) ; node_match_index++) {
          let letter = repr[index];
          index += 1
        }
        // Checking if matching child was found
        if (node_match_index == child_tokens_length) {
          // A total match was found
          found_child = true;
          node = total_matching_child_node(node.children[i]);
          break;
        } else if (node_match_index > 0) {
          // A partial match was found
          found_child = true;
          node = partial_matching_child_node(this, node.children[i], node_match_index, index, triple);
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


// TODO:: FINISH
B3.prototype.search_triple = function(triple) {
  representation = triple.representation;
  node = B3.root_node;
  current_index = 0;
  while (current_index < triple.representation.length) {
    let found = false;
    node.children.forEach(function(child){
      if (triple.representation.startsWith(child.token_string, current_index)){
        found = true
      }
    });
    if (!found) {
      throw "The word " + triple.representation + " was not present in the tree."
    }
  }
}

// The newly added node will need to have an existing fragment

B3.prototype.balance = function(node){
  let fragment = node.fragment;
  let parent_node = node.parent_node;
  let before_parent_node = null;
  while (parent_node.children.length < 2 && parent_node.parent_node.fragment == fragment) {
    parent_node  = parent_node.parent_node;
    before_parent_node = parent_node;
  }
  if (parent_node.parent_node == B3.root_node || parent_node.parent_node.fragment != fragment){
    let new_fragment = new Fragment();
    this.assign_fragment_id(new_fragment);
    new_fragment.root_node = node;
    node.change_fragment_node_and_children(fragment, new_fragment);
  } else {
    let current_fragment = parent_node.fragment
    // for (childindex in parent_node.children){
    let new_fragment = new Fragment();
    this.assign_fragment_id(new_fragment);
    let childnode = node
    if (before_parent_node != null){
      childnode = before_parent_node
    }
    new_fragment.root_node = childnode;
    childnode.change_fragment_node_and_children(current_fragment, new_fragment);
    // }
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

// Fragment.prototype.write_to_file = function(){
//   let filename = "searchfragments/fragment"+this.id
//   console.log(filename)
//   let cache = []
//   let string = "fragment" + this.id + "\n";
//   for (nodeindex in this.contents){
//     node = this.contents[nodeindex]
//     string += node.id + " :: " + node.token_string + " || " ;
//     for (i in node.children){
//       string += node.children[i].id + " - "
//     }
//     string += "\n"
//   }
//   string += "\n"
//   fs.writeFile(filename, string, function(err) {
//     if(err) {
//         return console.log(err);
//     }

//     console.log("The file was saved!");
// });
// }

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


Node.prototype.get_child_token_strings = function(){
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
var FRAGMENT_SIZE = 50;
var FILENAME = "data/straatnamen.txt"



var distances = new Array();
let max_dist = 0;
let max_word = "";
var node_count = 0;
var inner_node_count = 0;
var node_children_count = 0;
var max_node_children_count = 0;
var max_node_children_node = 0;



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
  console.log("total unique triple count: " + unique_lines) //linecounter)
  console.log("total node count: " + node_count)
  let node_per_word = node_count / unique_lines;
  console.log("nodes per word: " + node_per_word)
  let avg_node_children = node_children_count / inner_node_count;
  console.log("average node children: " + avg_node_children)
  console.log("max node children: " + max_node_children_count)

}

var calculate_node_fragments_passed = function(node, distance) {
  node_count += 1

  if (node.children.length != 0) {
    inner_node_count += 1;
    node_children_count += node.children.length;
    if (node.children.length > max_node_children_count){
      max_node_children_count = node.children.length;
      max_node_children_node = node
    }
  }

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

var newB3 = new B3(FRAGMENT_SIZE);


var exec = require('child_process').exec;
var unique_lines;
function puts(error, stdout, stderr) { unique_lines = parseInt(stdout, 10); }
exec("cat " + FILENAME + " | uniq -c | wc -l", puts);


var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(FILENAME)
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

