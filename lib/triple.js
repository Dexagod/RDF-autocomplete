
module.exports = class {
  constructor(representation, contents){
    this.representation = representation;
    this.contents = contents;
  }

  get_representation(){
    return this.representation;
  }
}
