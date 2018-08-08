var FIO = require('./fragment_IO.js')
var Fragment = require('./fragment.js')
var Node = require('./node.js')

module.exports = class {

  constructor(fragment_location_folder, max_cache_size = 50){
    this.last_used_cache_counter = 0
    this.fragment_cache = {}
    this.fragment_cache_hits = {}
    this.fragment_location_folder = fragment_location_folder;
    this.fio = new FIO(fragment_location_folder);
    this.max_cache_size = max_cache_size;
  }

  async add_fragment(fragment){
    this.fragment_cache[fragment.id] = fragment
    this.fragment_cache_hits[fragment.id] = this.get_cache_counter();
    if (Object.keys(this.fragment_cache) > this.max_cache_size){
      await clean_cache();
    }
  }

  get_cache_counter(){
    this.last_used_cache_counter += 1;
    return this.last_used_cache_counter;
  }

  async get_fragment_by_id(fragment_id){
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {
      return this.fragment_cache[fragment_id]
      this.fragment_cache_hits[fragment_id] = this.get_cache_counter();
    } else {
      let fragment = this.read_fragment_from_file(fragment_id);
      fragment.then( (data) =>
        await this.add_fragment(data)
      ).then(
         (data) =>
        return this.fragment_cache[data.id];
      ).catch( (err) =>
        console.log(err)
      )
    }
  }

  list_fragments(){
    let fc = this;
    var values = Object.keys(this.fragment_cache).map(function(key){
      return fc.fragment_cache[key];
    });
    return values;
  }


  async remove_fragment_by_id(fragment_id){
    if myObj.hasOwnProperty(fragment_id){
      await write_fragment_to_file(this.fragment_cache[fragment_id]);
      delete this.fragment_cache[fragment_id]
      delete this.fragment_cache_hits[fragment_id];
      if (this.fragment_cache.hasOwnProperty(fragment_id)) {throw "FRAGMENT NOT CORRECTLY REMOVED"}
    } else {
      throw "Trying to remove fragment that is not cached " + fragment_id
    }
  }

  async delete_fragment(fragment){
    this.remove_fragment_by_id(fragment.id);
    this.delete_fragment_file(fragment);
  }

  delete_fragment_file(fragment){
    console.log("DELETING FILE:: " + this.fragment_location_folder + "/fragment" + fragment.id + ".json")
    return;
  }

  async read_fragment_from_file(fragment_id){
    let fc = this.fragment_cache;
    let result = this.fio.read_fragment(fragment_id);
    result.then((value) => {
      Object.setPrototypeOf(value, Fragment.prototype)
      for (var i in value.contents){
        value.contents[i]['fc'] = this
        Object.setPrototypeOf(value.contents[i], Node.prototype)
      }
      return value;
    })
    return result;
  }

  async write_fragment_to_file(fragment){
    return this.fio.write_fragment(fragment);
  }

  async clean_cache(){
    console.log("CLEANING CACHE")
    min_val = Number.MAX_SAFE_INTEGER;
    min_key = Number.MAX_SAFE_INTEGER;
    for (var key in fragment_cache) {
      if (fragment_cache.hasOwnProperty(key)) {
        if (fragment_cache[key] < min_val){
          min_val = fragment_cache[key];
          min_key = key;
        }
      }
    }
    await remove_fragment_by_id(min_key)
    return ;
  }
}
