var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Tree = require('./tree.js')
var FC = require('./fragment_cache.js')
var fs = require('fs');
var lockFile = require('lockfile')


module.exports = class {
  constructor(fragment_location_folder, fc){
    this.fragment_location_folder = fragment_location_folder;
    this.fc = fc;
  }

  write_tree(tree) {

  }
  read_tree(path) {

  }

  write_fragment(fragment) {
    let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fragment_cache') ? undefined : value;
    });
    fs.writeFileSync(location, JSONSTRING, 'utf-8')
  }

  write_fragment_async(fragment, cb) {
    let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
    let location_lock = this.fragment_location_folder + "/fragment" + fragment.id + ".lock"
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fragment_cache') ? undefined : value;
    });
    fs.writeFile(location, JSONSTRING, cb);
  }

  read_fragment(fragment_id) {
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".json"
    let file_contents = JSON.parse(fs.readFileSync(location, 'utf8'));
    return file_contents
  }


}
