var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Tree = require('./tree.js')
var fs = require('fs');
var lockFile = require('lockfile')


module.exports = class {
  constructor(fragment_location_folder){
    this.fragment_location_folder = fragment_location_folder;
  }

  write_fragment(fragment) {
    let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    });
    fs.writeFileSync(location, JSONSTRING, 'utf-8')
  }

  read_fragment(fragment_id) {
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".json"
    let file_contents = JSON.parse(fs.readFileSync(location, 'utf8'));
    return file_contents
  }

  write_fragment_batch(fragment_array) {
    for (var index = 0; index < fragment_array.length; index++){
      this.write_fragment(fragment_array[index])
    }
  }

  delete_fragment(fragment_id){
    let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
    if (fs.exists(location)){
      fs.unlink(location)
    }
  }
  // write_fragment_async(fragment, cb) {
  //   let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
  //   let location_lock = this.fragment_location_folder + "/fragment" + fragment.id + ".lock"
  //   let JSONSTRING = JSON.stringify(fragment, function(key, value) {
  //       return (key == 'fragment_cache') ? undefined : value;
  //   });
  //   fs.writeFile(location, JSONSTRING, cb);
  // }


}
