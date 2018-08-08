var FIO = require('./fragment_IO.js')
var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Triple = require('./triple.js')

module.exports = class {

  constructor(fragment_location_folder, max_cache_size = 200) {
    this.fragment_cache = {}
    this.last_used_cache_counter = 0
    this.fragment_cache_hits = {}
    this.writing_fragments = {}
    this.fragment_location_folder = fragment_location_folder;
    this.fio = new FIO(fragment_location_folder);
    this.max_cache_size = max_cache_size;
  }

  add_fragment(fragment) {
    this.fragment_cache[fragment.id] = fragment
    this.fragment_cache_hits[fragment.id] = this.assign_cache_counter();
    if (Object.keys(this.fragment_cache).length > this.max_cache_size) {
      this.clean_cache()
    }
  }

  assign_cache_counter() {
    this.last_used_cache_counter += 1;
    return this.last_used_cache_counter;
  }

  get_fragment_by_id(fragment_id) {
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {
      this.fragment_cache_hits[fragment_id] = this.assign_cache_counter();
      return this.fragment_cache[fragment_id]
    } else {
      return this.import_fragment(fragment_id);
    }
  }

  list_fragments() {
    let fc = this;
    var values = Object.keys(this.fragment_cache).map(function(key) {
      return fc.fragment_cache[key];
    });
    return values;
  }

  remove_fragment(fragment) {
    this.remove_fragment_by_id(fragment.id)
  }

  remove_fragment_by_id(fragment_id) {
    console.log("REMOVING FRAGMENT " + fragment_id)
    let fragment = this.get_fragment_by_id(fragment_id)
    this.write_fragment_to_file(fragment)
    delete this.fragment_cache[fragment_id]
    delete this.fragment_cache_hits[fragment_id]
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {
      throw "FRAGMENT NOT CORRECTLY REMOVED"
    }
  }

  delete_fragment(fragment) {
    this.remove_fragment(fragment);
    this.delete_fragment_file(fragment);
  }

  delete_fragment_file(fragment) {
    console.log("DELETING FILE:: " + this.fragment_location_folder + "/fragment" + fragment.id + ".json")
    return;
  }

  import_fragment(fragment_id) {
    let fragment = this.read_fragment_from_file(fragment_id);
    this.add_fragment(fragment);
    return fragment;
  }

  export_fragment(fragment) {
    this.write_fragment_to_file(fragment);
  }

  read_fragment_from_file(fragment_id) {
    console.log("reading fragment " + fragment_id)
    // if (this.writing_fragments.hasOwnProperty(fragment_id)){
    //   this.writing_fragments[fragment_id].then()
    //   return ;
    // }
    let fc = this.fragment_cache;
    let result = this.fio.read_fragment(fragment_id);
    Object.setPrototypeOf(result, Fragment.prototype)
    for (var i in result.contents) {
      result.contents[i]['fc'] = this
      if(result.contents[i]['triple'] != null){
        Object.setPrototypeOf(result.contents[i]['triple'], Triple.prototype)
      }
      Object.setPrototypeOf(result.contents[i], Node.prototype)
    }
    return result;
  }

  write_fragment_to_file(fragment) {
    console.log("writing fragment " + fragment.id)
    //this.writing_fragments[fragment.id] =
    this.fio.write_fragment(fragment);
  }

  clean_cache(){
    console.log("CLEANING CACHE")
    let min_val = Number.MAX_SAFE_INTEGER;
    let min_key = 0;
    for (var key in this.fragment_cache) {
      if (this.fragment_cache_hits[key] < min_val){
        min_val = this.fragment_cache_hits[key];
        min_key = key;
      }
    }
    this.remove_fragment_by_id(min_key)
    return ;
  }
}
