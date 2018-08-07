var FIO = require('./fragment_IO.js')

module.exports = class {

  constructor(fragment_location_folder){
    this.fragment_cache = {}
    this.fragment_location_folder = fragment_location_folder;
    this.fio = new FIO(fragment_location_folder);
  }

  add_fragment(fragment){
    this.fragment_cache[fragment.id] = fragment
  }

  get_fragment_by_id(fragment_id){
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {
      return this.fragment_cache[fragment_id]
    } else {
      return import_fragment(fragment_id);
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
    if (this.fragment_cache.hasOwnProperty(fragment.id)) {throw "FRAGMENT NOT CORRECTLY REMOVED"}
  }

  remove_fragment_by_id(fragment_id){
    delete this.fragment_cache[fragment_id]
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {throw "FRAGMENT NOT CORRECTLY REMOVED"}
  }

  delete_fragment(fragment){
    this.remove_fragment(fragment);
    this.delete_fragment_file(fragment);
  }

  import_fragment(fragment_id){
    let fragment = this.load_fragment_from_file(fragment_id);
    this.fragment_cache.add_fragment(fragment);
    return fragment;
  }

  export_fragment(fragment){
    this.write_fragment_to_file(fragment);
  }

  delete_fragment_file(fragment){
    console.log("DELETING FILE:: " + this.fragment_location_folder + "/fragment" + fragment.id + ".json")
    return;
  }


  async read_fragment_from_file(fragment_id){
    let fc = this.fragment_cache;
    let result = this.fio.read_fragment(fragment_id);
    result.then((value) => {
      for (var i in value.contents){
        value.contents[i]['fc'] = this
      }
    })
    return result;
  }

  async write_fragment_to_file(fragment, cb){
    return this.fio.write_fragment(fragment);
  }
}
