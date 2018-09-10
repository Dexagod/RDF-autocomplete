var Fragment = require('./fragment.js')
var Node = require('./node.js')
var Suggestion = require('./suggestion.js')
var Triple = require('./TreeDataObject.js')
var Tree = require('./tree.js')
var fs = require('fs');
var jsonld = require('jsonld')


var context = {
  "tree": "https://w3id.org/tree#",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "hydra": "http://www.w3.org/ns/hydra/core#",
  "schema": "http://schema.org//",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "representation": "https://example.org/Triple#Representation",
  "contents": "hydra: collection",
  "token_string": "tree:value",
  "treeDataObjects": "hydra:member",
  "children": "tree:hasChildRelation",
  "parent_node": "tree:parent",
  "suggestions": "hydra:member",
  "score": "hydra:value",
  "childcount" : "hydra:totalItems",
  "child" : "tree:child",
}

module.exports = class FragmentIO{
  /**
   * Initialize the fragment IO managing object.
   * @param {string} sourceDirectory - The source directory where all data of this tree is stored.
   * @param {string} dataFolder - The subfolder of the source directory where the fragments are stored.
   * @param {FragmentCache} fc 
   */
  constructor(sourceDirectory, dataFolder, fc){
    this.sourceDirectory = sourceDirectory;
    this.dataFolder = dataFolder;
    this.fc = fc
  }


  write_fragment_batch(fragment_array) {
    for (var index = 0; index < fragment_array.length; index++){
      this.write_fragment(fragment_array[index])
    }
  }

  delete_fragment(fragment_id){
    let location = this.getFragmentlocation(fragment_id)
    if (fs.exists(location)){
      fs.unlink(location)
    }
  }
  
  write_fragment(fragment) {
    let location = this.getFragmentlocation(fragment.fragment_id)

    fragment = this.encode_fragment(fragment)

    // The fragment cache has to be removed because of circular dependency.
    // Is reinserted on reading of node.
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    }, 2);
    
    fs.writeFileSync(location, JSONSTRING, {encoding: 'utf-8'})
    
  }

  read_fragment(fragment_id) {
    let location = this.getFragmentlocation(fragment_id)
    let input_string = fs.readFileSync(location, {encoding: 'utf-8'})
    let fragment = JSON.parse(input_string);
    fragment = this.decode_fragment(fragment);

    return fragment
  }
    
  /**
   * Encoding the fragment to a jsonld-ready fragment.
   * @param {Fragment} fragment 
   */
  encode_fragment(fragment){

    let nodes = []
    for (var key in fragment.contents){
      let node = fragment.contents[key]
      nodes.push(this.encode_node(node))
    }
    fragment.contents = nodes    

    fragment["@context"] = context

    fragment["@id"] = this.getId(fragment["fragment_id"] );
    fragment["@type"] = "Fragment"
    fragment["@graph"] = fragment["contents"]

    delete fragment["fragment_id"]
    delete fragment["contents"]
    delete fragment["dirty"]

    return fragment
  }
  

  encode_node(node){

    node["@id"] = this.getId( node.fragment_id, node.node_id ); 
    node["@type"] = "tree:Node";

    let suggestions_objects = []
    let suggestions_metadata = []
    for (var suggestionkey in node.suggestions){
      let encoded_suggestion = this.encode_suggestion(node.suggestions[suggestionkey]);
      suggestions_objects = suggestions_objects.concat(encoded_suggestion[0])
      suggestions_metadata.push({representation_list: encoded_suggestion[1], score: encoded_suggestion[2]})
    }
    node.suggestions = suggestions_objects
    node.suggestions_metadata = suggestions_metadata

    let treeDataObject_objects = []
    let treeDataObject_representations = []
    for (var i = 0; i < node.treeDataObjects.length; i++){
      let encoded_treeDataObject = this.encode_treeDataObject(node.treeDataObjects[i])
      treeDataObject_objects.push(encoded_treeDataObject[0])
      treeDataObject_representations.push(encoded_treeDataObject[1])
    }
    node.treeDataObjects = treeDataObject_objects;
    node.treeDataObjects_metadata = treeDataObject_representations;
    // node["@graph"] = node.treeDataObjects
    
    let childlist = []
    for (var childkey in node.children){
      let new_child = {}
      let new_child_relation = {}
      new_child_relation["@type"] = "tree:StringCompletesRelation"
      new_child["@id"] = this.getId( node.children[childkey][0], node.children[childkey][1] ); 
      new_child["@type"] = "tree:Node"
      new_child["token_string"] = childkey
      new_child_relation["tree:child"] = [new_child]
      
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
      new_parent_node["@id"] = this.getId(  node.parent_node[0],  node.parent_node[1] );
      new_parent_node["@type"] = "tree:Node"

      node.parent_node = new_parent_node
    }


    delete node["fragment_id"];
    delete node["node_id"];

    return node;
  }

  encode_suggestion(suggestion){
    let treeDataObject_list = []
    let treeDataObject_representations = []
    for (var i = 0; i < suggestion.treeDataObjects.length; i++){
      let encoded_treeDataObject = this.encode_treeDataObject(suggestion.treeDataObjects[i])
      treeDataObject_list.push(encoded_treeDataObject[0])
      treeDataObject_representations.push(encoded_treeDataObject[1])
    }
    return [treeDataObject_list, treeDataObject_representations, suggestion.score]
  }

  encode_treeDataObject(treeDataObject){
    return [treeDataObject.contents, treeDataObject.representation]
  }


  decode_fragment(fragment){
    Object.setPrototypeOf(fragment, Fragment.prototype)
    fragment["dirty"] = false
    fragment["contents"] = fragment["@graph"]
    fragment["fragment_id"] = this.retrieveId(fragment["@id"])[0] //fragment["@id"].replace(this.dataFolder + "fragment", "").replace(".jsonld", "")

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
    let splitid = this.retrieveId(node["@id"]) // node["@id"].replace(this.dataFolder + "fragment", "").replace(".jsonld", "").split("#")
    node["node_id"] = splitid[1]
    node["fragment_id"] = splitid[0]
    
    delete node["@id"];
    delete node["@type"];

    let suggestions = {}
    let suggestion_index = 0;
    for (var j = 0; j < node.suggestions_metadata.length; j++){
      let current_suggestion_metadata = node.suggestions_metadata[j];
      let suggestion = {}
      suggestion["score"] = current_suggestion_metadata["score"]
      let rep_list = current_suggestion_metadata["representation_list"];

      let treeDataObject_list = [];
      suggestion.treeDataObjects = []
      for (var k = 0; k < rep_list.length; k++){
        let treeDataObject = {}
        treeDataObject["representation"] = rep_list[k]
        treeDataObject["object"] =  node.suggestions[suggestion_index]
        suggestion.treeDataObjects.push(treeDataObject)
        suggestion_index += 1;
      }
      suggestion = this.decode_suggestion(suggestion)
      suggestions[suggestion.get_suggested_word()] = suggestion
    }

    node.suggestions = suggestions

    let treeDataObject_list = [];
    for (var j = 0; j < node.treeDataObjects.length; j++){
      let treeDataObject = {}
      treeDataObject["representation"] = node.treeDataObjects_metadata[j]
      treeDataObject["object"] =  node.treeDataObjects[j]
      treeDataObject = this.decode_treeDataObject(treeDataObject)
      treeDataObject_list.push(treeDataObject)
    }
    node.treeDataObjects = treeDataObject_list
    
    if (node.hasOwnProperty('children')){
      let new_children = {}
      for (var i = 0; i < node.children.length; i++){
        let child = node.children[i]["tree:child"]
        for (var j = 0; j < child.length; j++){
          let splitid = this.retrieveId(child[j]["@id"])                //child[j]["@id"].replace(this.dataFolder + "fragment", "").replace(".jsonld", "").split("#")
          let token_string = child[j]["token_string"]
          new_children[token_string] = [splitid[0], splitid[1]]
        }
        //  ADD HREF?
      }
      node.children = new_children
    } else {
      node["children"] = {}
    }

    if (node.parent_node != null){
      node.parent_node = this.retrieveId(node.parent_node["@id"])  //node.parent_node["@id"].replace(this.dataFolder + "fragment", "").replace(".jsonld", "").split("#")
    }
    node["fc"] = this.fc
    // delete node["@graph"]
    delete node.treeDataObjects_metadata;
    delete node.suggestions_metadata;
    return node;
  }

  decode_suggestion(suggestion){
    // delete suggestion["@type"]
    // suggestion["treeDataObjects"] = suggestion["@graph"]
    // delete suggestion["@graph"]
    Object.setPrototypeOf(suggestion, Suggestion.prototype)
    let treeDataObjects = suggestion.treeDataObjects
    for (var i = 0; i < treeDataObjects.length ; i++){
      this.decode_treeDataObject(treeDataObjects[i])
    }
    return suggestion
  }

  decode_treeDataObject(treeDataObject){
    Object.setPrototypeOf(treeDataObject, Triple.prototype)
    delete treeDataObject["@type"]
    return treeDataObject
  }


  getFragmentlocation(fragmentId){
    return this.sourceDirectory + this.dataFolder + "fragment" + fragmentId + ".jsonld"
  }

  getId(fragmentId, nodeId){
    if (nodeId == undefined || nodeId == null){
      return "/" + this.dataFolder + "fragment" + fragmentId + ".jsonld"
    }
    return "/" + this.dataFolder + "fragment" + fragmentId + ".jsonld#" + nodeId
  }

  retrieveId(str){
    if (str.indexOf(".jsonld#") != -1){
      return  str.replace(this.dataFolder + "fragment", "").replace("/","").split(".jsonld#");
    }
    return [str.replace(this.dataFolder + "fragment", "").replace(".jsonld", "").replace("/",""), null]
  }



}

