var TreeManager = require('./TreeManager')


var sourceDirectory = process.argv[2]
var sourcefile = process.argv[3]
var dataFolder = process.argv[4]
var treeLocation = process.argv[5]
var treeFile = process.argv[6]
var maxfragsize = process.argv[7];
var maxCachedFragments = process.argv[8];

var treeManager = new TreeManager();

main(sourceDirectory, sourcefile, dataFolder, treeLocation, treeFile, maxfragsize, maxCachedFragments);

function main(sourceDirectory, sourcefile, dataFolder, treeLocation, treeFile, maxfragsize = 100, maxCachedFragments = 10000){

  var tree = treeManager.createTree(sourceDirectory, dataFolder, maxCachedFragments, maxfragsize)

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
      treeManager.addData(tree, line, {"http://example.com/terms#name": line, "http://www.w3.org/2003/01/geo/wgs84_pos#long": long.toString(), "http://www.w3.org/2003/01/geo/wgs84_pos#lat": lat.toString()})

      // Log progress.
      linecounter += 1;
      if (linecounter % 100 === 0){
          console.log("LINE " + linecounter)
      }
  });

lineReader.on('close', function () {
    console.log("DONE ADDING")
    tree.get_fragmentCache().flush_cache()
    treeManager.writeTree(tree, treeLocation, treeFile);
    console.log('Tree written')
  })
}
