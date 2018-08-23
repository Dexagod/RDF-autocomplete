var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Suggestion = require('./suggestion.js')
var Triple = require('./triple.js')
var Tree = require('./tree.js')
var fs = require('fs');
var jsonld = require('jsonld')


var context = {
  "tree": "https://w3id.org/tree#",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "hydra": "http://www.w3.org/ns/hydra/core#",
  "schema": "http://schema.org//",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "contents": "hydra: collection",
  "token_string": "tree:value",
  "triples": "hydra:member",
  "representation": "https://example.org/Triple#Representation",
  "children": "tree:hasChildRelation",
  "parent_node": "tree:parent",
  "suggestions": "hydra:member",
  "score": "hydra:value",
  "token_string": "hydra:value",
  "childcount" : "hydra:totalItems",
  "child" : "tree:child",
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
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".jsonld"
    if (fs.existsSync(location)){
      fs.unlink(location, function(){})
    }
  }
  
  write_fragment(fragment) {
    let location = this.fragment_location_folder + "/fragment" + fragment.fragment_id + ".jsonld"

    fragment = this.encode_fragment(fragment)

    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    }, 2);
    
    fs.writeFileSync(location, JSONSTRING, {encoding: 'utf-8'})

    // let nquadsloc =  this.fragment_location_folder + "/fragment" + fragment.fragment_id + ".nquads"
    // jsonld.toRDF(location, {format: 'application/n-quads'}).then( 
    //   (nquads) => fs.writeFileSync(nquadsloc, nquads, {encoding: 'utf-8'})
    // );
    
  }

  read_fragment(fragment_id) {
    let location = this.fragment_location_folder + "/fragment" + fragment_id + ".jsonld"
    let input_string = fs.readFileSync(location, {encoding: 'utf-8'})
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

    fragment["@id"] = "fragment" + fragment["fragment_id"] + ".jsonld"
    fragment["@type"] = "Fragment"
    fragment["@graph"] = fragment["contents"]

    delete fragment["fragment_id"]
    delete fragment["contents"]
    delete fragment["dirty"]

    return fragment
  }
  

  encode_node(node){

    node["@id"] = "fragment" + node.fragment_id  + ".jsonld#" + node.node_id;
    node["@type"] = "tree:Node";

    let suggestionlist = []
    for (var suggestionkey in node.suggestions){
      let suggestion = this.encode_suggestion(node.suggestions[suggestionkey])
      suggestionlist.push(suggestion)
    }
    node.suggestions = suggestionlist


    for (var i = 0; i < node.triples.length; i++){
      node.triples[i] = this.encode_triple(node.triples[i])
    }
    // node["@graph"] = node.triples


    let childlist = []
    for (var childkey in node.children){
      let new_child = {}
      let new_child_relation = {}
      new_child_relation["@type"] = "tree:StringCompletesRelation"
      new_child["@id"] = "fragment" + node.children[childkey][0]+".jsonld#"+node.children[childkey][1]
      new_child["@type"] = "tree:Node"
      new_child_relation["tree:child"] = [new_child]
      new_child_relation["token_string"] = childkey
      
      //  ADD HREF?
      childlist.push(new_child_relation)
    }
    if (childlist.length == 0){
      delete node["children"]
    } else {
      node.children = childlist
    }
    

    if (node.parent_node != null){
      let new_parent_node = {}
      new_parent_node["@id"] = "fragment" + node.parent_node[0] + ".jsonld#" + node.parent_node[1]
      new_parent_node["@type"] = "tree:Node"

      node.parent_node = new_parent_node
    }

    node.suggestions = suggestionlist    

    delete node["fragment_id"];
    delete node["node_id"];
    // delete node["triples"]

    return node;
  }

  encode_suggestion(suggestion){
    // console.log(suggestion)
    suggestion["@type"] = "Suggestion"
    suggestion["score"] = 0
    for (var i = 0; i < suggestion.triples.length; i++){
      suggestion.triples[i] = this.encode_triple(suggestion.triples[i])
    }
    suggestion["@graph"] = suggestion["triples"]
    delete suggestion["triples"]
    return suggestion
  }

  encode_triple(triple){
    triple["@type"] = "Triple"
    return triple
  }


  decode_fragment(fragment){
    Object.setPrototypeOf(fragment, Fragment.prototype)
    fragment["dirty"] = false
    fragment["contents"] = fragment["@graph"]
    fragment["fragment_id"] = fragment["@id"].replace("fragment", "").replace(".jsonld", "")

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

    return fragment
  }

  decode_node(node){
    Object.setPrototypeOf(node, Node.prototype)
    let splitid = node["@id"].replace("fragment", "").replace(".jsonld", "").split("#")
    node["node_id"] = splitid[1]
    node["fragment_id"] = splitid[0]
    
    delete node["@id"];
    delete node["@type"];

    let suggestions = {}
    for (var j = 0; j < node.suggestions.length; j++){
      let suggestion = node.suggestions[j]
      suggestion = this.decode_suggestion(suggestion)
      suggestions[suggestion.get_suggested_word()] = suggestion
    }

    // node["triples"] = node["@graph"]
    for (var j = 0; j < node.triples.length; j++){
      let triple = node.triples[j]
      triple = this.decode_triple(triple)
    }
    
    if (node.hasOwnProperty('children')){
      let new_children = {}
      for (var i = 0; i < node.children.length; i++){
        let child = node.children[i]["tree:child"]
        let token_string = node.children[i]["token_string"]
        for (var j = 0; j < child.length; j++){
          let splitid = child[j]["@id"].replace("fragment", "").replace(".jsonld", "").split("#")
          new_children[token_string] = [splitid[0], splitid[1]]
        }
        //  ADD HREF?
      }
      node.children = new_children
    } else {
      node["children"] = {}
    }
    

    if (node.parent_node != null){
      node.parent_node = node.parent_node["@id"].replace("fragment", "").replace(".jsonld", "").split("#")
    }
    node.suggestions = suggestions

    node["fc"] = this.fc
    // delete node["@graph"]
    return node;
  }

  decode_suggestion(suggestion){
    delete suggestion["@type"]
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
    delete triple["@type"]
    return triple
  }

}




