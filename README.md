# RDF-autocomplete

## Client side autocompletion using RDF data
This project investigates the usefulness and performance of client-side autocompletion using http requests over the web.

The used ontology for the linked data of the tree can be found here: https://w3id.org/tree#

The datastructure used to provide this functionality is a distributed patricia tree.
The patricia tree is created in a streaming fashion.
The nodes of the tree are saved in linked data fragments.
Adding nodes to the tree when written will parse the needed fragments, update them and write them back.

Nodes in the tree also contain suggestions (hydra:member elements).
These suggestions are data points from deeper in the tree, with the highest given score.
These permit the client to stop querying the tree earlyer when an answer is found to the question in one of these suggestions.

Querying the data fragments can be done using the linked data tree browser npm package 'ldtree-browser'.


## Use


###command line
```
npm install
node bin/main.js {data source folder} {data folder} {fragment folder} {tree file folder} {tree file name} {fragment size} {max fragment cache elements}
```

###imported

data file locations:
{sourceDirectory}/{dataLocation}/fragment{id}.jsonld
{sourceDirectory}/{treeLocation}/{treeFile}.jsonld

```
var main = require("./main")
var tree = main.createTree(sourceDirectory, dataLocation, maxCachedFragments)

main.addData(tree, representation, object)

main.writeTree(tree, treeLocation, treeFile);

tree = main.readTree(sourceDirectory, treeLocation, treeFile, dataLocation, maxCachedFragments)
```



## Testing and statistics
```
npm install
node bin/testing_main.js {data source folder} {data folder} {fragment folder} {tree file folder} {tree file name} {fragment size} {max fragment cache elements}
```



## Performance

Performance metrics are not yet available.
WIP