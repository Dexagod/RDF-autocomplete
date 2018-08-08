var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Tree = require('./tree.js')
var FC = require('./fragment_cache.js')
var fs = require('fs');


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
    return fs.writeFileSync(location, JSONSTRING, 'utf-8')
  }
  write_fragment_async(fragment) {
    let location = this.fragment_location_folder + "/fragment" + fragment.id + ".json"
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fragment_cache') ? undefined : value;
    });
    return new Promise(function(resolve, reject) {
        fs.writeFile(location, JSONSTRING, (err) => {
            if (err) throw "File could not be written"
            else resolve(JSONSTRING)
        });
    });
  }

  read_fragment(fragment_id) {
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".json"
    return JSON.parse(fs.readFileSync(location, 'utf8'));
  }


}
