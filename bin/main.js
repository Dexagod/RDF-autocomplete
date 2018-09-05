var fs = require('fs');
const assert = require('assert');
var Tree = require('../lib/tree.js')
var Fragment = require('../lib/fragment.js');
var Node = require('../lib/node.js');
var Triple = require('../lib/triple.js');
var FC = require('../lib/fragment_cache.js')
var TreeIO = require('../lib/tree_IO')
var sizeof = require('object-sizeof')


var sourcefile = "data/straatnamen.txt"
var datadir = "streets/"
var collectiondir = "collections/"
var collectionfilename = "streetnames"
var maxfragsize = 100;
var maxcachedfrags = 10000;

var sourceDirectory = __dirname + "/../../opendata/"

createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize, maxcachedfrags);

function createTree(sourceDirectory, sourcefile, datadir, collectiondir, collectionfilename, maxfragsize = 100, maxcachedfrags = 10000){
  var fc = new FC(sourceDirectory, datadir, maxcachedfrags);
  var newB3 = new Tree(maxfragsize, fc);

  // Read all the lines from the given test file.
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(sourcefile)
  });

  var linecounter = 0
  
  lineReader.on('line', function (line) {
      
      // Create new Triple object to add to the given tree, containing a representation and an object.
      let long = (Math.random() * 2) + 2;
      let lat = (Math.random() * 3) + 50;

      let newtriple = new Triple(line, {"http://example.com/terms#name": line, "http://www.w3.org/2003/01/geo/wgs84_pos#long": long.toString(), "http://www.w3.org/2003/01/geo/wgs84_pos#lat": lat.toString()})

      // Add the triple to the tree.
      newB3.add_triple(newtriple)

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
    console.log(datadir)
    let treeIO = new TreeIO(sourceDirectory, collectiondir, datadir, collectionfilename, fc);
    treeIO.write_tree(newB3);
    console.log('Tree written')
  })
}
