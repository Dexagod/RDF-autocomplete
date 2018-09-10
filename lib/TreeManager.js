var Tree = require('./tree.js')
var fs = require('fs');
var jsonld = require('jsonld')
var FC = require('../lib/FragmentCache.js')
var DefaultBalancer = require('./fragment_balancers/DefaultBalancer.js');


var context = {
  "tree": "https://w3id.org/tree#",
  "hydra": "http://www.w3.org/ns/hydra/core#",
  "manages": "hydra: manages",
  "total_items": "hydra: totalitems",
}


module.exports = class {
    constructor(sourceDirectory, collectionFolder, dataFolder, filename, fragmentCache, balancer = null){
      this.readTreelocation(this.filename);
      this.fragmentCache = fragmentCache;
      this.filename = filename;
      this.collectionFolder = collectionFolder;
      this.sourceDirectory = sourceDirectory;
      this.dataFolder = dataFolder;
      this.balancer = balancer;
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
    tree["@type"] = "hydra:Collection";
    tree["@id"] = "/" + this.collectionFolder + this.filename + ".jsonld"
    tree.total_items = tree.get_root_node().total_items
    tree["hydra:view"] = { "@id": "/" + this.dataFolder + "fragment" + tree.root_fragment_id + ".jsonld#" + tree.root_node_id, "@type": "tree:node"}
    delete tree['fragmentCache']

    let wrapper = {}
    wrapper["@context"] = context;
    wrapper["@graph"] = [tree];

    let JSONSTRING = JSON.stringify(wrapper, function(key, value) {
      if (key == 'fragmentCache') {
        return undefined;
      } else if (key == 'balancer') {
        return undefined;
      } else {
        return value
      }
    }, 2);
    
    fs.writeFileSync(this.readTreelocation(this.filename), JSONSTRING, {encoding: 'utf-8'})    
  }

  read_tree() {
    let input_string = fs.readFileSync(this.readTreelocation(this.filename), {encoding: 'utf-8'})

    let wrapper = JSON.parse(input_string);

    let tree = wrapper["@graph"][0]
    tree["fragmentCache"] = this.fragmentCache
    if (this.balancer = null){ this.balancer = new DefaultBalancer()}
    tree.balancer = this.balancer;
    Object.setPrototypeOf(tree, Tree.prototype)
    return tree
  }

  readTreelocation(name){
    return this.sourceDirectory + this.collectionFolder + name + ".jsonld"
  }



}



