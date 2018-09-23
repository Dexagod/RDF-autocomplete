var TreeBalancer = require("./TreeBalancer");
var Fragment = require('../Fragment.js')
/** 
 * Balances the tree through splitting at the passed Node. 
 * Not very efficient.
*/
module.exports = class DefaultBalancer extends TreeBalancer{
    balance(fragment){
        let rootnode = fragment.get_root_node();
        
        let childnodes = rootnode.get_children_objects()
        for (var i = 0; i < childnodes.length; i++){
            let new_fragment = new Fragment(this.tree);
            this.tree.add_fragment(new_fragment);
            new_fragment.set_root_node(childnodes[i])
            childnodes[i].change_fragment_node_and_children(rootnode.get_fragment_id(), new_fragment);
        }

        if (rootnode.has_parent_node()){
            let parentnode = rootnode.get_parent_node();
            let parentfragment = parentnode.get_fragment();
            rootnode.change_fragment(parentfragment)
            if (parentfragment.get_contents_size() > this.tree.max_fragment_size){
                this.balance(parentfragment);
            }
        }
    }
        
}