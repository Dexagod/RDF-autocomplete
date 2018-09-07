module.exports = class {
  /**
   * Creates a data object in the tree with a given representation.
   * @param {string} representation 
   * @param {any} contents 
   */
  constructor(representation, contents){
    this.representation = representation;
    this.contents = contents;
  }
  
  /** 
   * returns the representation of this data object.
  */
  get_representation(){
    return this.representation;
  }
}
