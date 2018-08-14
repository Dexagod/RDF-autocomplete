
var PageFactory = require('mmap-kit').PageFactory;
var fs = require('fs')
var sizeof = require('object-sizeof')

module.exports = class {
  constructor(pages_directory, PAGE_SIZE){
    this.pages_directory = pages_directory;
    this.PAGE_SIZE = PAGE_SIZE;
    console.log(PAGE_SIZE)
  }

  write_fragment(fragment) {
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    });
    
    var mappedPageFactory = new PageFactory(this.PAGE_SIZE, this.pages_directory);
    var mappedPage = mappedPageFactory.acquirePage(fragment.fragment_id);
    var buffer = mappedPage.getLocal(0);

    buffer.write(JSONSTRING);
    
    mappedPage.setDirty(true);
    mappedPage.flush();
    mappedPage.close(); // gc
    mappedPageFactory.releasePage(fragment.fragment_id)
  }

  write_fragment_no_flush(fragment, mappedPageFactory) {
    let JSONSTRING = JSON.stringify(fragment, function(key, value) {
        return (key == 'fc') ? undefined : value;
    });
    
    var mappedPage = mappedPageFactory.acquirePage(fragment.fragment_id);
    var buffer = mappedPage.getLocal(0);

    buffer.write(JSONSTRING);
    
    mappedPage.setDirty(true);
  }

  write_fragment_batch(fragment_array) {
    var mappedPageFactory = new PageFactory(this.PAGE_SIZE, this.pages_directory);
    for (var index = 0; index < fragment_array.length; index++){
      this.write_fragment_no_flush(fragment_array[index], mappedPageFactory)
      // this.write_fragment(fragment_array[index], mappedPageFactory)
    }
    console.log("FLUSING")

    mappedPageFactory.flush()
    for (var index = 0; index < fragment_array.length; index++){
      mappedPageFactory.close(fragment_array[index].fragment_id)
    }
  }


  read_fragment(fragment_id) {

    var mappedPageFactory = new PageFactory(this.PAGE_SIZE, this.pages_directory);
    var mappedPage = mappedPageFactory.acquirePage(fragment_id);
    var buffer = mappedPage.getLocal(0);
    let result = JSON.parse(buffer.toString().replace(/\0*$/, ''))
    mappedPage.close(); // gc
    mappedPageFactory.releasePage(fragment_id)

    this.delete_fragment(fragment_id)
    return result
  }

  delete_fragment(fragment_id){
    var mappedPageFactory = new PageFactory(this.PAGE_SIZE, this.pages_directory);
    mappedPageFactory.deletePage(fragment_id, function (err) {
      if (err) console.log(err);
    });
    return;

  }


}
