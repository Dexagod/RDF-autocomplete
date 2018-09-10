var DefaultBalancer = require('../lib/fragment_balancers/DefaultBalancer.js')
var FC = require('../lib/FragmentCache.js')
var TreeIO = require('../lib/TreeIO')
var Tree = require('../lib/tree.js')
var Triple = require('../lib/TreeDataObject.js');


module.exports = class TreeManager{
    
/** 
 * Gets the tree object from the given location.
 * @param {string} sourceDirectory - base folder of the tree data
 * @param {*} treeLocation - folder containing the tree file in the sourceDirectory
 * @param {*} treeFile - tree file filename
 * @param {*} dataFolder - folder containing the fragment files in the sourceDirectory
 * @param {*} maxCachedFragments - maximal cachable fragments at once
 */
  readTree(sourceDirectory, treeLocation, treeFile, dataFolder, maxCachedFragments){
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
  writeTree(tree, treeLocation, treeFile){
    let treeIO = new TreeIO(tree.get_fragmentCache().sourceDirectory, treeLocation, tree.get_fragmentCache().dataFolder, treeFile, tree.get_fragmentCache());
    treeIO.write_tree(tree);
  }
  
  /**
   * Creates a new tree object.
   * @param {string} sourceDirectory - base forlder of the tree data
   * @param {string} dataFolder - folder containing the fragment files in the sourceDirectory
   * @param {number} maxCachedFragments - the maximal amount of elements in the cache
   */
  createTree(sourceDirectory, dataFolder, maxCachedFragments, maxFragmentSize){
    var balancer = new DefaultBalancer();
    var fc = new FC(sourceDirectory, dataFolder, maxCachedFragments);
    return new Tree(maxFragmentSize, fc, balancer);
  }
  
  
  /**
   * Add given data to the tree in the node of the representation.
   * @param {Tree} tree 
   * @param {string} representation 
   * @param {any} data 
   */
  addData(tree, representation, data) {
    let newtreeDataObject = new Triple(representation, data)
    tree.addData(newtreeDataObject)
  }

}