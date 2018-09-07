var DefaultBalancer = require('../lib/fragment_balancers/DefaultBalancer.js')

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

function getTree(Location, ){

}

function addBatch(tree, ){
}

function addData(tree, representation, data) {
  let newtreeDataObject = new Triple(representation, data)
  tree.addData(newtreeDataObject)
}


createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize, maxcachedfrags);

function createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize = 100, maxcachedfrags = 10000){

  // Initialize a balancer of choice to balance the tree.
  // This balancing is done on fragment-level. No nodes or connections between nodes should be altered.
  balancer = new DefaultBalancer();
  // Initialize a new fragment cache.
  var fc = new FC(sourceDirectory, datadir, maxcachedfrags);
  // Initialize the new tree. Passing the maximal allowed fragment size, the fragment cache and the fragment balancer.
  var newB3 = new Tree(maxfragsize, fc, balancer);

  // Read input file
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(sourcefile)
  });

  var linecounter = 0

  lineReader.on('line', function (line) {

      // Create new Triple object to add to the given tree, containing a representation and an object.
      let long = (Math.random() * 2) + 2;
      let lat = (Math.random() * 3) + 50;

      // Add the treeDataObject to the tree.
      addData(newB3, line, {"http://example.com/terms#name": line, "http://www.w3.org/2003/01/geo/wgs84_pos#long": long.toString(), "http://www.w3.org/2003/01/geo/wgs84_pos#lat": lat.toString()})

      // Log progress.
      linecounter += 1;
      if (linecounter % 100 === 0){
          console.log("LINE " + linecounter)
      }
  });

lineReader.on('close', function () {
    console.log("DONE ADDING")
    fc.flush_cache()
    let treeIO = new TreeIO(sourceDirectory, collectiondir, datadir, collectionfilename, fc);
    treeIO.write_tree(newB3);
    console.log('Tree written')
  })
}
