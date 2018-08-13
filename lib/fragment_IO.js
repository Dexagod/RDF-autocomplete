var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Suggestion = require('./suggestion.js')
var Triple = require('./triple.js')
var Tree = require('./tree.js')
var fs = require('fs');
var lockFile = require('lockfile')

var context = {
  "contents": "https://example.org/Node",
  "token_string": "https://example.org/Node#TokenString",
  "triples": "https://example.org/Triple",
  "representation": "https://example.org/Triple#Representation",
  "children": "https://example.org/Node#Children",
  "fragment_id": "https://example.org/Fragment#Identifyer",
  "parent_node": "https://example.org/Node#Parent",
  "suggestions": "https://example.org/Suggestion",
}

module.exports = class {
  constructor(fragment_location_folder, fc){
    this.fragment_location_folder = fragment_location_folder;
    this.fc = fc
  }


  write_fragment_batch(fragment_array) {
    for (var index = 0; index < fragment_array.length; index++){
      this.write_fragment(fragment_array[index])
    }
  }

  delete_fragment(fragment_id){
    let location = this.fragment_location_folder + "/fragment" + fragment.fragment_id + ".json"
    if (fs.exists(location)){
      fs.unlink(location)
    }
  }
  
  write_fragment(fragment) {
    let location = this.fragment_location_folder + "/fragment" + fragment.fragment_id + ".json"

    fragment = this.encode_fragment(fragment)

    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    }, 2);

    fs.writeFileSync(location, JSONSTRING, 'utf-8')
  }

  read_fragment(fragment_id) {
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".json"
    let input_string = fs.readFileSync(location, 'utf8')
    let fragment = JSON.parse(input_string);
    fragment = this.decode_fragment(fragment);

    return fragment
  }


  // This is where we encode a fragment to a jsonld format
  encode_fragment(fragment){


    let nodes = []
    for (var key in fragment.contents){
      let node = fragment.contents[key]
      nodes.push(this.encode_node(node))
    }
    fragment.contents = nodes    

    fragment["@context"] = context

    fragment["@id"] = fragment["fragment_id"]
    fragment["@type"] = "Fragment"
    fragment["@graph"] = fragment["contents"]

    delete fragment["fragment_id"]
    delete fragment["contents"]

    return fragment
  }
  

  encode_node(node){
    node["@id"] = node.fragment_id + "#" + node.node_id;
    node["@type"] = "Node";
    
    delete node["fragment_id"];
    delete node["node_id"];

    let suggestionlist = []
      for (var suggestionkey in node.suggestions){
        let suggestion = this.encode_suggestion(node.suggestions[suggestionkey])
        suggestionlist.push(suggestion)
      }
      node.suggestions = suggestionlist
    return node;
  }

  encode_suggestion(suggestion){
    // console.log(suggestion)
    for (var i = 0; i < suggestion.triples.length; i++){
      suggestion.triples[i] = this.encode_triple(suggestion.triples[i])
    }
    suggestion["@graph"] = suggestion["triples"]
    delete suggestion["triples"]
    return suggestion
  }

  encode_triple(triple){
    return triple
  }


  decode_fragment(fragment){
    Object.setPrototypeOf(fragment, Fragment.prototype)
    fragment["contents"] = fragment["@graph"]
    fragment["fragment_id"] = fragment["@id"]

    delete fragment["@id"]
    delete fragment["@graph"]
    delete fragment["@type"]
    delete fragment["@context"]


    let contents = {}
    for (var i = 0; i < fragment.contents.length; i++){
      let node = fragment["contents"][i]

      node = this.decode_node(node)
      let node_id = node.node_id
      contents[node_id] = node
    }
    
    fragment.contents = contents

    // console.log(fragment)
    return fragment
  }

  decode_node(node){
    Object.setPrototypeOf(node, Node.prototype)
    let splitid = node["@id"].split("#")
    node["node_id"] = splitid[1]
    node["fragment_id"] = splitid[0]
    node["fc"] = this.fc
    
    delete node["@id"];
    delete node["@type"];

    let suggestions = {}
    for (var j = 0; j < node.suggestions.length; j++){
      let suggestion = node.suggestions[j]
      suggestion = this.decode_suggestion(suggestion)
      suggestions[suggestion.get_suggested_word()] = suggestion
    }

    for (var j = 0; j < node.children.length; j++){
      node.children[j] = this.decode_triple(node.children[j])
    }
    node.suggestions = suggestions

    return node;
  }

  decode_suggestion(suggestion){
    suggestion["triples"] = suggestion["@graph"]
    delete suggestion["@graph"]
    Object.setPrototypeOf(suggestion, Suggestion.prototype)
    let triples = suggestion.triples
    for (var i = 0; i < triples.length ; i++){
      this.decode_triple(triples[i])
    }
    return suggestion
  }

  decode_triple(triple){
    Object.setPrototypeOf(triple, Triple.prototype)
    return triple
  }

}




