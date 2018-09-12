const FC = require('../lib/FragmentCache.js')
const DefaultBalancer = require('../lib/fragment_balancers/DefaultBalancer.js')
const Tree = require("../lib/Tree.js")
const Triple = require('../lib/TreeDataObject.js');

module.exports = class {
    constructor(tree, sourceDirectory, dataFolder, maxFragmentSize, maxCachedFragments){
        if (tree === undefined || tree === null){
            var balancer = new DefaultBalancer();
            var fc = new FC(sourceDirectory, dataFolder, maxCachedFragments);
            this.tree = new Tree(maxFragmentSize, fc, balancer);
        } else {
            this.tree = tree;
        }
    }

    /**
     * Add given data to the tree in the node of the representation.
     * @param {string} representation 
     * @param {any} data 
     */
    addData(representation, data) {
      let newtreeDataObject = new Triple(representation, data)
      this.tree.addData(newtreeDataObject)
    }
  
    /**
     * Indicate finished adding data.
     * Cache can be flushed.
     */
    doneAdding() {
        this.tree.get_fragmentCache().flush_cache();
    }
}