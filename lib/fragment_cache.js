var FIO = require('./fragment_IO.js')
var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Triple = require('./triple.js')
var Suggestion = require('./suggestion.js')
var sizeof = require('object-sizeof');
var PageFactory = require('mmap-kit').PageFactory;
var fs = require('fs')
var MMIO = require('./mmap_IO.js')

module.exports = class {

  constructor(fragment_location_folder, max_fragment_size, max_cache_size = 200) {
    this.fragment_cache = {}
    this.last_used_cache_counter = 0
    this.fragment_cache_hits = {}
    this.writing_fragments = {}
    this.fragment_location_folder = fragment_location_folder;
    this.max_cache_size = max_cache_size;

    this.cache_misses = 0;
    this.cache_hits = 0;
    this.cache_cleans = 0;
    this.writes = 0;
    this.reads = 0;

    this.CACHE_CUTOFF_DIVISOR = 3;

    this.fio = new FIO(fragment_location_folder, this);
    this.mmio = new MMIO(fragment_location_folder + '/pages/', max_fragment_size * 1000)
    
    // SET THE FILE WRITER YOU WANT TO USE
    this.fragio = this.fio
  }

  add_fragment(fragment) {
    this.fragment_cache[fragment.fragment_id] = fragment
    this.fragment_cache_hits[fragment.fragment_id] = this.assign_cache_counter();
    if (Object.keys(this.fragment_cache).length > this.max_cache_size) {
      
      console.time("cacheclean");

      this.clean_cache()

      console.timeEnd("cacheclean");
      
    }
  }

  assign_cache_counter() {
    this.last_used_cache_counter += 1;
    return this.last_used_cache_counter;
  }

  get_fragment_by_id(fragment_id) {
    if (this.fragment_cache.hasOwnProperty(fragment_id)) {

      this.cache_hits += 1

      this.fragment_cache_hits[fragment_id] = this.assign_cache_counter();
      return this.fragment_cache[fragment_id]
    } else {

      this.cache_misses += 1

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
    this.remove_fragment_by_id(fragment.fragment_id)
  }

  remove_fragment_by_id(fragment_id) {
    console.log("REMOVING FRAGMENT " + fragment_id)
    let fragment = this.fragment_cache[fragment_id]
    delete this.fragment_cache[fragment_id]
    delete this.fragment_cache_hits[fragment_id]
    this.write_fragment_to_file(fragment)
  }

  delete_fragment(fragment) {
    console.log("DELETING FRAGMENT with size " + fragment.get_contents_size())


    this.remove_fragment(fragment);
    this.delete_fragment_file_by_id(fragment.fragment_id);
  }

  delete_fragment_file_by_id(fragment_id) {
    this.fragio.delete_fragment(fragment_id);
  }

  import_fragment(fragment_id) {
    // console.log("importing fragment " + fragment_id)
    let fragment = this.read_fragment_from_file(fragment_id);
    this.add_fragment(fragment);
    return fragment;
  }

  export_fragment(fragment) {
    this.write_fragment_to_file(fragment);
  }

  read_fragment_from_file(fragment_id) {
    this.reads += 1;
    let result = this.fragio.read_fragment(fragment_id);    
    return result;
  }

  write_fragment_to_file(fragment) {
    this.writes += 1;
    delete this.fragment_cache[fragment.fragment_id]

    this.fragio.write_fragment(fragment)

  }

  write_fragment_batch_to_file(index_array) {
      this.writes += index_array.length;

      const mapped_array = index_array.map( e => this.fragment_cache[e])
      const write_array = []
      for (var i = 0; i < index_array.length; i++){
        delete this.fragment_cache[index_array[i]]
        if (mapped_array[i].dirty == true){
          write_array.push(mapped_array[i])
        }
      }

      this.fragio.write_fragment_batch(write_array)
  }


  clean_cache(){
    console.log("CLEANING CACHE")
    this.cache_cleans += 1;

    let cache_values = []

    for (var key in this.fragment_cache) cache_values.push([key, this.fragment_cache_hits[key]])

    cache_values.sort(function(a, b) {
        a = a[1];
        b = b[1];
        return a < b ? -1 : (a > b ? 1 : 0);
    });

    let cutoff_length = Math.ceil(cache_values.length / this.CACHE_CUTOFF_DIVISOR)
    
    let index_array = cache_values.slice(0, cutoff_length)
    const mapped_index = index_array.map( e => e[0] )
    this.write_fragment_batch_to_file(mapped_index)
  }

  flush_cache(){
    console.log("FLUSHING CACHE")
    this.write_fragment_batch_to_file(Object.keys(this.fragment_cache))
  }

}


