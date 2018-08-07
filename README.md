# RDF-autocomplete

## Client side autocompletion using RDF data
This project investigates the usefulness and performance of client-side autocompletion using http requests over the web.
The prefix tree used for the autocompletion is located on a remote server.
This server will provide access to the prefix tree fragmented in interlinked information resources.

Suggestions and corrections can be added to provide links to other nodes of possible intrest in the prefix tree.
This gives the client the freedom to persue whatever kind of link is best suited for his application.

## Use

```
npm install
node file.js
```

The test data is located in the data folder

## Performance

Performance will be evaluated with different factors.
Variations in size of the data fragments, form and rebalancing will be taken into account.

Benchmarks will be added upon completion.


