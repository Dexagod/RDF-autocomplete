var fs = require('fs');
const assert = require('assert');

var Tree = require('../lib/tree.js')
var Fragment = require('../lib/fragment.js');
var Node = require('../lib/node.js');
var Triple = require('../lib/TreeDataObject.js');
var FC = require('../lib/FragmentCache.js')
var TreeIO = require('../lib/TreeManager')

var sizeof = require('object-sizeof')




var sourceDirectory = process.argv[2]
var sourcefile = process.argv[3]
var datadir = process.argv[4]
var collectiondir = process.argv[5]
var collectionfilename = process.argv[6]
var maxfragsize = process.argv[7];
var maxcachedfrags = process.argv[8];

createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize, maxcachedfrags);

function createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize = 100, maxcachedfrags = 10000){
  var fc = new FC(sourceDirectory, datadir, maxcachedfrags);
  var newB3 = new Tree(maxfragsize, fc);

  // Read all the lines from the given test file.
  var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(sourcefile)
  });

  var linecounter = 0


  var added_strings = []

  lineReader.on('line', function (line) {

      // Create new Triple object to add to the given tree, containing a representation and an object.
      let long = (Math.random() * 2) + 2;
      let lat = (Math.random() * 3) + 50;

      let newtreeDataObject = new Triple(line, {"http://example.com/terms#name": line, "http://www.w3.org/2003/01/geo/wgs84_pos#long": long.toString(), "http://www.w3.org/2003/01/geo/wgs84_pos#lat": lat.toString()})

      // Add the treeDataObject to the tree.
      newB3.addData(newtreeDataObject)

      // Log progress.
      linecounter += 1;
      if (linecounter % 100 === 0){
          console.log("LINE " + linecounter)
      }
  });

  lineReader.on('close', function () {
  console.log("DONE ADDING")
  fc.flush_cache()

  console.log(collectiondir)
  console.log(collectionfilename)
  let treeIO = new TreeIO(sourceDirectory, collectiondir, datadir, collectionfilename, fc);
  treeIO.write_tree(newB3)
  newB3 = treeIO.read_tree()

  // Calculate some statistics of the tree.
  calculate_average_fragments_passed(newB3);

  // Iterate the file once more to check that all lines have been successfully added.
  var lineReader2 = require('readline').createInterface({
    input: require('fs').createReadStream(sourcefile)
  });

  fragments = {}
  linecounter = -1;

  lineReader2.on('line', function (line) {
    added_strings.push(line)
    let newtreeDataObject = new Triple(line)
    linecounter += 1;

    if (linecounter % 100 === 0){
      console.log("Confirming line " + linecounter)
    }
    if (newtreeDataObject.get_representation() !== ""){
      let searched_treeDataObject = newB3.searchData(newtreeDataObject)
      assert.equal(searched_treeDataObject[0].get_representation(), newtreeDataObject.get_representation())
    }

  });


  lineReader2.on('close', function (line) {
   console.log("Triples have been successfully added")
  });
});


var fragments_set = new Set();
var fragment_sizes = 0;
var max_frag_size = 0;
var max_frag = null;
var inner_node_count = 0;
var node_count = 0;
var node_children_count = 0;
var treeDataObject_nodes = 0;
var max_dist = 0
var max_word = ""
var distances = []
var max_node_children_count = 0;

var calculate_average_fragments_passed = function(b3) {
  let root_node = b3.get_root_node();
  calculate_node_fragments_passed(root_node, 1)

  let sum = 0;
  for( var i = 0; i < distances.length; i++ ){
      sum += parseInt( distances[i], 10 ); //don't forget to add the base
  }
  let avg = sum/distances.length;

  let avg_frag_size = fragment_sizes / fragments_set.size

  console.log(treeDataObject_nodes, added_strings.size)

  console.log("")
  console.log("TEST RESULTS")

  console.log("")
  console.log("TREE DATA")
  console.log("Total entries: " + linecounter)
  console.log("Total unique entries: " + added_strings.size)
  console.log("average distance: " + avg)
  console.log("maximal distance: " + max_dist)
  console.log("word with max dist: " + max_word.get_representation())

  console.log("")
  console.log("FRAGMENT DATA")
  console.log("total frag count: " + fragments_set.size)
  console.log("max fragment size allowed: " + maxfragsize)
  console.log("max fragment size: " + max_frag_size)
  console.log("avg fragment nodes contained: " + avg_frag_size)
  let avgfragfill = avg_frag_size / maxfragsize;
  console.log("avg frag fill: " + avgfragfill )

  console.log("")
  console.log("CACHE DATA")
  console.log("number of hits: " + fc.cache_hits)
  console.log("number of misses: " + fc.cache_misses)
  console.log("number of cache cleans: " + fc.cache_cleans)
  console.log("number of writes: " + fc.writes)
  console.log("number of reads: " + fc.reads)


  console.log("")
  console.log("NODE DATA")
  console.log("total unique treeDataObject count: " + added_strings.size) //linecounter)
  console.log("treeDataObject node count: " + treeDataObject_nodes)
  console.log("total node count: " + node_count)
  let node_per_word = node_count / added_strings.size;
  console.log("nodes per word: " + node_per_word)
  let avg_node_children = node_children_count / inner_node_count;
  console.log("average node children: " + avg_node_children)
  console.log("max node children: " + max_node_children_count)

}

var calculate_node_fragments_passed = function(node, distance) {
  node_count += 1
  if (node.get_child_count() !== 0) {
    inner_node_count += 1;
    node_children_count += node.get_child_count();
    if (node.get_child_count() > max_node_children_count) {
      max_node_children_count = node.get_child_count();
    }
  }

  if (! fragments_set.has(node.get_fragment())){
    // Check if fragment root nodes are set correctly
    assert(node.get_fragment().get_root_node_id() === node.node_id)

    fragment_sizes += node.get_fragment().get_contents_size();
    if (node.get_fragment().get_contents_size() > max_frag_size){
      max_frag_size = node.get_fragment().get_contents_size()
      max_frag = node.get_fragment
    }
  }
  fragments_set.add(node.get_fragment())

  let newdist;

  if (node.has_parent_node() && node.get_parent_node().get_fragment_id() !== node.get_fragment_id()) {
    newdist = distance + 1;
  } else {
    newdist = distance;
  }
  if (node.get_treeDataObjects().length > 0){
    treeDataObject_nodes += 1
    distances.push(newdist)
    if (newdist > max_dist){
      max_dist = newdist
      max_word = node.get_treeDataObjects()[0]
    }
  }

  let node_children = node.get_children_objects();
  let total_children_count = 0;
  for (var i = 0; i < node_children.length; i++) {
    total_children_count += node_children[i].get_total_children_count();
    calculate_node_fragments_passed(node_children[i], newdist);
  }
  total_children_count += node.get_child_count();
  assert(node.get_total_children_count() === total_children_count)
}
}
