module.exports = class {
    constructor(triples){
        this.triples = triples;
        this.score = 0;
    }
    
    get_suggested_word(){
        return this.triples[0].get_representation();
    }

    add_sugested_triple(triple) {
        this.triples.push(triple)
    }

    get_triples(){
        return this.triples
    }
}
