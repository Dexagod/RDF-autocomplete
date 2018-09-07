var TreeBalancer = require("./TreeBalancer");
var Fragment = require('../fragment')

module.exports = class DefaultBalancer extends TreeBalancer{
    balance(node){
        let fragment = node.get_fragment()
        let fragment_id = node.get_fragment_id();
        if ( (! node.has_parent_node()) || node.get_parent_node().get_fragment_id() != fragment_id){
            let childnodes = node.get_children_objects()
            for (var i = 0; i < childnodes.length; i++){
                if (childnodes[i].get_fragment_id() == fragment_id) {
                    let new_fragment = new Fragment(this.tree);
                    this.tree.add_fragment(new_fragment);
                    new_fragment.set_root_node(childnodes[i])
                    childnodes[i].change_fragment_node_and_children(fragment_id, new_fragment);
                    if (new_fragment.get_contents_size() > this.tree.max_fragment_size){
                        this.balance(childnodes[i])
                    }
                }
            }
        } else {
            let new_fragment = new Fragment(this.tree);
            this.tree.add_fragment(new_fragment);
            new_fragment.set_root_node(node)
            node.change_fragment_node_and_children(fragment_id, new_fragment);
            if (fragment.get_contents_size() > this.tree.max_fragment_size){
                this.balance(node.get_parent_node())
            }
        }
        
          
    }
}