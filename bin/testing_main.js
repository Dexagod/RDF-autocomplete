var fs = require('fs');
const assert = require('assert');

var Tree = require('../lib/tree.js')
var Fragment = require('../lib/fragment.js');
var Node = require('../lib/node.js');
var Triple = require('../lib/triple.js');
var FC = require('../lib/fragment_cache.js')




/*
  TESTINGGG
*/
var FRAGMENT_SIZE = 25;
var FILENAME = "data/straatnamen.txt"
// var FILENAME = "data/5dlaatstestraatnamen.txt"
// var FILENAME = "data/500laatstestraatnamen.txt"
var CACHE_SIZE = 8000;
var fc = new FC("searchfragments", FRAGMENT_SIZE*20, CACHE_SIZE);
var newB3 = new Tree(FRAGMENT_SIZE, fc);




// var distances = new Array();
// let max_dist = 0;
// let max_word = "";
// var node_count = 0;
// var inner_node_count = 0;
// var node_children_count = 0;
// var max_node_children_count = 0;
// var max_node_children_node = 0;
// var triple_nodes = 0;


// var triple_reps_found = new Set()
// var fragments_set = new Set();

// var calculate_average_fragments_passed = function(b3) {
//   let root_node = b3.get_root_node();
//   calculate_node_fragments_passed(root_node, 1)

//   let sum = 0;
//   for( var i = 0; i < distances.length; i++ ){
//       sum += parseInt( distances[i], 10 ); //don't forget to add the base
//   }
//   let avg = sum/distances.length;

//   var fragment_sizes = new Array();
//   let totalsize = 0;
//   var fragments = Array.from(fragments_set);

//   // for( var i = 0; i < fragments.length; i++ ){
//   //   if (fragments[i]["@graph"].length > 0) {
//   //     totalsize += 1;
//   //     fragment_sizes.push(fragments[i]["@graph"].length)
//   //   }
//   // }
//   // let frag_sum = 0
//   // var max_frag_size = fragment_sizes.reduce(function(a, b) {
//   //   return Math.max(a, b);
//   // });

//   var max_frag_size = 0;
//   var frag_sum = 0;
//   for( var j = 0; j < fragment_sizes.length; j++ ){
//       frag_sum += parseInt( fragment_sizes[j], 10 ); //don't forget to add the base
//   }
//   let avg_frag_size = frag_sum / fragment_sizes.length

//   console.log(triple_reps_found.size, added_triples.length)

//   console.log("")
//   console.log("TEST RESULTS")

//   console.log("")
//   console.log("TREE DATA")
//   console.log("Total entries: " + linecounter)
//   console.log("Total unique entries: " + unique_lines)
//   console.log("average distance: " + avg)
//   console.log("maximal distance: " + max_dist)
//   console.log("word with max dist: " + max_word.get_representation())

//   console.log("")
//   console.log("FRAGMENT DATA")
//   console.log("total frag count: " + totalsize)
//   console.log("max fragment size allowed: " + FRAGMENT_SIZE)
//   console.log("max fragment size: " + max_frag_size)
//   console.log("avg fragment nodes contained: " + avg_frag_size)
//   let avgfragfill = avg_frag_size / FRAGMENT_SIZE;
//   console.log("avg frag fill: " + avgfragfill )

//   console.log("")
//   console.log("CACHE DATA")
//   console.log("number of hits: " + fc.cache_hits)
//   console.log("number of misses: " + fc.cache_misses)
//   console.log("number of cache cleans: " + fc.cache_cleans)
//   console.log("number of writes: " + fc.writes)
//   console.log("number of reads: " + fc.reads)


//   console.log("")
//   console.log("NODE DATA")
//   console.log("total unique triple count: " + unique_lines) //linecounter)
//   console.log("triple node count: " + triple_nodes)
//   console.log("total node count: " + node_count)
//   let node_per_word = node_count / unique_lines;
//   console.log("nodes per word: " + node_per_word)
//   let avg_node_children = node_children_count / inner_node_count;
//   console.log("average node children: " + avg_node_children)
//   console.log("max node children: " + max_node_children_count)

//   console.log("TESTING EQUALITY", added_triples.length)


//   /*
//   FLUSHING CACHE, WRITE EVERYTHING BEFORE SEARCHING
//   */
//   fc.flush_cache()

//   fc.searching = true;
//   for (var k = 0; k < added_triples.length; k++) {
//     if (k % 100 === 0) {
//       console.log("CHECKING  ", k)
//     }
//     let searched_triples = b3.search_triple(added_triples[k])
//     assert.equal(searched_triples[0].get_representation(), added_triples[k].get_representation())
//   }
//   console.log("ASSERTIONS CORRECT")

//   // fc.clear_cache()

// }

// var calculate_node_fragments_passed = function(node, distance) {
//   fragments_set.add(node.get_fragment())
//   node_count += 1

//   if (node.get_child_count() != 0) {
//     inner_node_count += 1;
//     node_children_count += node.get_child_count();
//     if (node.get_child_count() > max_node_children_count){
//       max_node_children_count = node.get_child_count();
//       max_node_children_node = node;
//     }
//   }

//   let newdist;

//   if (node.has_parent_node() && node.get_parent_node().get_fragment_id() != node.get_fragment_id()) {
//     newdist = distance + 1;
//   } else {
//     newdist = distance;
//   }
//   if (node.get_triples().length > 0){
//     triple_nodes += 1
//     triple_reps_found.add(node.get_triples()[0].get_representation())
//     distances.push(newdist)
//     if (newdist > max_dist){
//       max_dist = newdist
//       max_word = node.get_triples()[0]
//     }
//   }

//   let node_children = node.get_children_objects();
//   for (var i = 0; i < node_children.length; i++) {
//     calculate_node_fragments_passed(node_children[i], newdist);
//   }
// }





added_triples = new Array();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(FILENAME)
});

var linecounter = 0


lineReader.on('line', function (line) {
  let newtriple = new Triple(line)
  newB3.add_triple(newtriple)
  linecounter += 1;
  if (linecounter % 100 == 0){
    console.log("LINE " + linecounter)
  }
});

lineReader.on('close', function () {
  // calculate_average_fragments_passed(newB3);
  console.log("DONE ADDING")
  fc.flush_cache()

  fc.searching = true;
  var lineReader2 = require('readline').createInterface({
    input: require('fs').createReadStream(FILENAME)
  });
   
  linecounter = -1;
  lineReader2.on('line', function (line) {
    let newtriple = new Triple(line)
    linecounter += 1;

    if (linecounter % 100 == 0){
      console.log("LINE " + linecounter)
    }
    if (newtriple.get_representation() != ""){
      let searched_triple = newB3.search_triple(newtriple)
      assert.equal(searched_triple[0].get_representation(), newtriple.get_representation())
    }
    
  });

  lineReader2.on('close', function (line) {
   console.log("Triples have been successfully added")
  });
});
