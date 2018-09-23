
// Superclass of all balancers.
// Balancer takes care of fixing the internal balance of the fragments in the tree.
// A balancer only balances the fragments in the tree, and does not take into account individual nodes.
module.exports = class TreeBalancer{
    constructor(){}
    setTree(tree){ this.tree = tree }
    /**
     * Abstract method.
     * New fragments created must set their root node. fragment.set_root_node(node)
     * @param {Node} node 
     */
    balance(fragment){}
}