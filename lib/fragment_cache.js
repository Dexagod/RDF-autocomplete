
module.exports = class {

  constructor(){
    this.fragment_cache = {}
  }

  add_fragment(fragment){
    this.fragment_cache[fragment.id] = fragment
  }

  get_fragment(fragment){
    return this.fragment_cache[fragment.id]
  }

  get_fragment_by_id(fragment_id){
    return this.fragment_cache[fragment_id]
  }

  list_fragments(){
    var values = Object.keys(this.fragment_cache).map(function(key){
      return this.fragment_cache[key];
    });
    return values;
  }


  remove_fragment(fragment){
    delete this.fragment_cache[fragment.id]
  }

  remove_fragment_by_id(fragment_id){
    delete this.fragment_cache[fragment_id]
  }

}
