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
var dataFolder = process.argv[4]
var treeLocation = process.argv[5]
var treeFile = process.argv[6]
var maxfragsize = process.argv[7];
var maxCachedFragments = process.argv[8];

/** 
 * Gets the tree object from the given location.
 * @param {string} sourceDirectory - base folder of the tree data
 * @param {*} treeLocation - folder containing the tree file in the sourceDirectory
 * @param {*} treeFile - tree file filename
 * @param {*} dataFolder - folder containing the fragment files in the sourceDirectory
 * @param {*} maxCachedFragments - maximal cachable fragments at once
 */
function readTree(sourceDirectory, treeLocation, treeFile, dataFolder, maxCachedFragments){
  var fc = new FC(sourceDirectory, dataFolder, maxCachedFragments);
  let treeIO = new TreeIO(sourceDirectory, treeLocation, dataFolder, treeFile, fc);
  return treeIO.read_tree();
}

/**
 * Writes given tree object to a given location.
 * @param {Tree} tree - the Tree object that needs to be written.
 * @param {string} treeLocation - the folder in which the tree file needs to be written (in the sourceDirectory of the given tree), dependency of its fragment cache. 
 * @param {string} treeFile - the filename to which the tree needs to be written
 */
function writeTree(tree, treeLocation, treeFile){
  let treeIO = new TreeIO(tree.get_fragmentCache().sourceDirectory, treeLocation, tree.get_fragmentCache().dataFolder, treeFile, tree.get_fragmentCache());
  treeIO.write_tree(tree);
}

/**
 * Creates a new tree object.
 * @param {string} sourceDirectory - base forlder of the tree data
 * @param {string} dataFolder - folder containing the fragment files in the sourceDirectory
 * @param {number} maxCachedFragments - the maximal amount of elements in the cache
 */
function createTree(sourceDirectory, dataFolder, maxCachedFragments){
  var balancer = new DefaultBalancer();
  var fc = new FC(sourceDirectory, dataFolder, maxCachedFragments);
  return new Tree(maxfragsize, fc, balancer);
}


/**
 * Add given data to the tree in the node of the representation.
 * @param {Tree} tree 
 * @param {string} representation 
 * @param {any} data 
 */
function addData(tree, representation, data) {
  let newtreeDataObject = new Triple(representation, data)
  tree.addData(newtreeDataObject)
}

module.exports = { createTree, readTree, writeTree, addData };

main(sourceDirectory, sourcefile, dataFolder, treeLocation, treeFile, maxfragsize, maxCachedFragments);

function main(sourceDirectory, sourcefile, dataFolder, treeLocation, treeFile, maxfragsize = 100, maxCachedFragments = 10000){

  var tree = createTree(sourceDirectory, dataFolder, maxCachedFragments)

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
      addData(tree, line, {"http://example.com/terms#name": line, "http://www.w3.org/2003/01/geo/wgs84_pos#long": long.toString(), "http://www.w3.org/2003/01/geo/wgs84_pos#lat": lat.toString()})

      // Log progress.
      linecounter += 1;
      if (linecounter % 100 === 0){
          console.log("LINE " + linecounter)
      }
  });

lineReader.on('close', function () {
    console.log("DONE ADDING")
    tree.get_fragmentCache().flush_cache()
    writeTree(tree, treeLocation, treeFile);
    console.log('Tree written')
  })
}
