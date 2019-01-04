/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle');
var Uploader = require('./helpers/uploader');
var _ = require('@sailshq/lodash');
var util = require('util');
var path = require('path');
var assert = require('assert');
var toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse');
var fsx = require('fs-extra');



describe('this adapter\'s impact on `req.body` ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);


  // Object of params accessible in req.body in the upload action
  var bodyParamsThatWereAccessible = {};


  it('binds a file uploader action', function() {
    suite.app.post('/upload', function(req, res) {
      bodyParamsThatWereAccessible = _.cloneDeep(req.body);

      req.file('avatar')
        .upload({
          adapter: adapter,
          dirname: req.__FILE_PARSER_TESTS__DIRNAME__AVATAR,
          saveAs: req.__FILE_PARSER_TESTS__FILENAME__AVATAR
        }, function(err, files) {
          if (err) res.status(500).send(err);
          res.sendStatus(200);
        });
    });
  });



  it('sends a multi-part file upload request', function(done) {

    // Create a readable binary stream to upload
    var smallFile = suite.srcFiles[0];
    var pathToSmallFile = smallFile.path;
    var fileStreamToUpload = fsx.createReadStream(pathToSmallFile);

    // Builds an HTTP request
    var httpRequest = Uploader({
      baseurl: 'http://localhost:3000'
    }, toValidateTheHTTPResponse(done));

    // Attaches a multi-part form upload to the HTTP request.,
    var form = httpRequest.form();
    form.append('foo', 'hello');
    form.append('bar', 'there');
    form.append('avatar', fileStreamToUpload);

  });

  it('should have been able to access the body parameters passed in the upload request', function() {
    assert(bodyParamsThatWereAccessible);
    assert(bodyParamsThatWereAccessible.foo);
    assert(bodyParamsThatWereAccessible.bar);
  });


  it('should have uploaded a file to expected location using provided `dirname` and `saveAs` options', function(done) {

    // Check that a file landed
    adapter.ls(suite.outputDir.path, function(err, filesThatLanded) {
      if (err) return done(err);
      assert(filesThatLanded.length === 1, 'one file should exist at ' + suite.outputDir.path + ' -- but instead there are '+filesThatLanded.length);

      // Check that its contents are correct
      var uploadedFileContents = '';
      adapter.read(filesThatLanded[0])
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
