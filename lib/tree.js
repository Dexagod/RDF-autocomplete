var fs = require('fs');
var rimraf = require('rimraf');
const assert = require('assert');

var Pattree = require('./pattree.js')
var Fragment = require('./fragment.js');
var Node = require('./node.js');
var Triple = require('./triple.js');


// DEBUGGING PURPOSES







/*
  TESTINGGG
*/
var FRAGMENT_SIZE = 50;
var FILENAME = "../data/straatnamen.txt"



var distances = new Array();
let max_dist = 0;
let max_word = "";
var node_count = 0;
var inner_node_count = 0;
var node_children_count = 0;
var max_node_children_count = 0;
var max_node_children_node = 0;
var triple_nodes = 0;


var triple_reps_found = new Set()
var fragments_set = new Set();

var calculate_average_fragments_passed = function(b3) {
  let root_node = b3.root_node;
  calculate_node_fragments_passed(root_node, 1)

  let sum = 0;
  for( var i = 0; i < distances.length; i++ ){
      sum += parseInt( distances[i], 10 ); //don't forget to add the base
  }
  let avg = sum/distances.length;

  var fragment_sizes = new Array();
  let totalsize = 0;
  var fragments = Array.from(fragments_set);

  for( var i = 0; i < fragments.length; i++ ){
    if (fragments[i].contents.length > 0) {
      totalsize += 1;
      fragment_sizes.push(fragments[i].contents.length)
    }
  }
  let frag_sum = 0
  for( var j = 0; j < fragment_sizes.length; j++ ){
      frag_sum += parseInt( fragment_sizes[j], 10 ); //don't forget to add the base
  }
  let avg_frag_size = frag_sum / fragment_sizes.length

  console.log(triple_reps_found.size, added_triples.length)





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
  console.log("triple node count: " + triple_nodes)
  console.log("total node count: " + node_count)
  let node_per_word = node_count / unique_lines;
  console.log("nodes per word: " + node_per_word)
  let avg_node_children = node_children_count / inner_node_count;
  console.log("average node children: " + avg_node_children)
  console.log("max node children: " + max_node_children_count)

}

var calculate_node_fragments_passed = function(node, distance) {
  fragments_set.add(node.fragment)
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

  if (node.parent_node != null && node.parent_node.fragment != node.fragment) {
    newdist = distance + 1;
  } else {
    newdist = distance;
  }
  if (node.triple != null){
    triple_nodes += 1
    triple_reps_found.add(node.triple.representation)
    distances.push(newdist)
    if (newdist > max_dist){
      max_dist = newdist
      max_word = node.triple
    }
  }

  for (var i = 0; i < node.children.length; i++) {
    calculate_node_fragments_passed(node.children[i], newdist);
  }
}

var newB3 = new Pattree(FRAGMENT_SIZE);


var exec = require('child_process').exec;
var unique_lines;
function puts(error, stdout, stderr) { unique_lines = parseInt(stdout, 10); }
exec("cat " + FILENAME + " | sort -u | wc -l", puts);

added_triples = new Array();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(FILENAME)
});

var linecounter = 0


lineReader.on('line', function (line) {
  let newtriple = new Triple(line)
  newB3.add_triple(newtriple)
  linecounter += 1;
  added_triples.push(newtriple)
  if (line == "Grüffl") {
    calculate_average_fragments_passed(newB3);
  }
});
