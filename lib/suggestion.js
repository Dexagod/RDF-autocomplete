
var maximalSuggestedItems = 10;

module.exports = class {
    /**
     * Constructs the suggestion from a list of TreeDataObject objects.
     * @param {Array<TreeDataObject>} treeDataObjects 
     */
    constructor(treeDataObjects){
        this.treeDataObjects = treeDataObjects;
        this.score = 0;
    }
    
    /** 
     * returns the representation of these suggestions.
    */
    get_suggested_word(){
        return this.treeDataObjects[0].get_representation();
    }

    /**
     * Adds the given object to the suggestion.
     * @param {TreeDataObject} treeDataObject 
     */
    add_sugested_treeDataObject(treeDataObject) {
        if (this.treeDataObjects.length > this.maximalSuggestedItems){
            return false
        }else {
            this.treeDataObjects.push(treeDataObject)
            return true
        }
    }

    /** 
     * returns the objects of this suggestion.
    */
    get_treeDataObjects(){
        return this.treeDataObjects
    }
}
