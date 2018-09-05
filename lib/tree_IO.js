var Tree = require('./tree.js')
var fs = require('fs');
var jsonld = require('jsonld')
var FC = require('../lib/fragment_cache.js')


var context = {
  "tree": "https://w3id.org/tree#",
  "hydra": "http://www.w3.org/ns/hydra/core#",
  "manages": "hydra: manages",
  "total_items": "hydra: totalitems",
}


module.exports = class {
    constructor(sourceDirectory, collectionFolder, dataFolder, filename, fragmentCache){this.getTreelocation(this.filename);
      this.fragmentCache = fragmentCache;
      this.filename = filename;
      this.collectionFolder = collectionFolder;
      this.sourceDirectory = sourceDirectory;
      this.dataFolder = dataFolder;

      if (!fs.existsSync(sourceDirectory)){
        console.log("making dir:")
        console.log(sourceDirectory)
        
        fs.mkdirSync(sourceDirectory);
      }
        
      if (!fs.existsSync(sourceDirectory + collectionFolder)){
        console.log("making dir:")
        console.log(sourceDirectory + collectionFolder)
        
        fs.mkdirSync(sourceDirectory + collectionFolder);
      }
    }
  
  write_tree(tree) {
    tree["@context"] = context;
    tree["@type"] = "hydra:Collection";
    tree["@id"] = this.collectionFolder + this.filename + ".jsonld"
    tree.total_items = tree.get_root_node().total_items
    tree["hydra:view"] = { "@id": this.dataFolder + "fragment" + tree.root_fragment_id + ".jsonld#" + tree.root_node_id, "@type": "tree:node"}
    delete tree['fragment_cache']
    let JSONSTRING = JSON.stringify(tree, function(key, value) {
        return (key == 'fragment_cache') ? undefined : value;
    }, 2);
    
    fs.writeFileSync(this.getTreelocation(this.filename), JSONSTRING, {encoding: 'utf-8'})    
  }

  read_tree() {
    let input_string = fs.readFileSync(this.getTreelocation(this.filename), {encoding: 'utf-8'})
    let tree = JSON.parse(input_string);
    tree["fragment_cache"] = this.fragmentCache
    Object.setPrototypeOf(tree, Tree.prototype)
    return tree
  }

  getTreelocation(name){
    return this.sourceDirectory + this.collectionFolder + name + ".jsonld"
  }



}



