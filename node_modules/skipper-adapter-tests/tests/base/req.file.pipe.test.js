/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle'),
  Uploader = require('./helpers/uploader'),
  _ = require('@sailshq/lodash'),
  util = require('util'),
  path = require('path'),
  assert = require('assert'),
  toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse'),
  fsx = require('fs-extra');


// Fixtures
var actionFixtures = {
  uploadAvatar: require('./fixtures/uploadAvatar.action')
};


describe('req.file(...).pipe(...) ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);



  it('bind a file uploader action', function() {
    suite.app.post('/upload', actionFixtures.uploadAvatar);
  });



  it('sends a multi-part file upload request', function(done) {

    // Builds an HTTP request
    var httpRequest = Uploader({
      baseurl: 'http://localhost:3000'
    }, toValidateTheHTTPResponse(done));

    // Attaches a multi-part form upload to the HTTP request.,
    var form = httpRequest.form();
    var pathToSmallFile = suite.srcFiles[0].path;
    form.append('avatar', fsx.createReadStream(pathToSmallFile));

  });



  it('should have uploaded a file to `suite.outputDir`', function(done) {

    // Check that a file landed
    adapter.ls(suite.outputDir.path, function(err, filesUploaded) {
      if (err) return done(err);
      assert(filesUploaded.length === 1);

      // Check that its contents are correct
      var uploadedFileContents = '';
      adapter.read(filesUploaded[0])
      .on('data', function(buffer){
        uploadedFileContents += buffer.toString();
      })
      .on('error', function(err){ return done(err); })
      .on('end', function(){
        var srcFileContents = fsx.readFileSync(suite.srcFiles[0].path);
        assert(uploadedFileContents === srcFileContents.toString());
        done();
      });
    });

  });


});
