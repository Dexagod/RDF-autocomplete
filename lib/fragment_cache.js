
module.exports = class {

  constructor(){
    this.fragment_cache = {}
  }

  add_fragment(fragment){
    this.fragment_cache[fragment.id] = fragment
  }

  get_fragment_by_id(fragment_id){
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {
      return this.fragment_cache[fragment_id]
    } else {
      load_fragment_from_file(fragment_id)
    }
  }

  list_fragments(){
    let fc = this;
    var values = Object.keys(this.fragment_cache).map(function(key){
      return fc.fragment_cache[key];
    });
    return values;
  }


  remove_fragment(fragment){
    delete this.fragment_cache[fragment.id]
  }

  remove_fragment_by_id(fragment_id){
    delete this.fragment_cache[fragment_id]
  }

  load_fragment_from_file(fragment_id){

  }

  write_fragment_to_file(fragment_id){

  }
}
