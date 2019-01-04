/**
 * Module dependencies
 */

var fsx = require('fs-extra');
var _ = require('@sailshq/lodash');
var tmp = require('temporary');
var crypto = require('crypto');
var path = require('path');
var Express = require('express');
var http = require('http');


var Skipper = require('skipper');


/**
 * [exports description]
 * @return {
 *   setup     {Function}
 *   teardown  {Function}
 *   outputDir {String}
 *   srcFiles  {Array}
 * }
 */
module.exports = function() {

  // Create an array of file fixtures.
  var fileFixtures = [];

  // Create a tmp directory for our uploads to live in.
  var outputDir = new tmp.Dir();


  // Expose some things
  var public = {

    srcFiles: fileFixtures,

    outputDir: outputDir,

    setup: function(done) {

      // Write nonsense bytes to our file fixtures.
      for (var bytes = 10; bytes < 10000000; bytes *= 10) {
        var f = new tmp.File();
        var EOF = '\x04';
        f.writeFileSync(crypto.pseudoRandomBytes(bytes) + EOF);
        f.size = bytes;
        fileFixtures.push(f);
      }

      // Bootstrap a little express app that uses file-parser
      // to upload files to our outputDir
      public.app = Express();

      // Use file-parser middleware
      public.app.use(Skipper());

      // Provide a default outputPath for testing purposes
      // (gets used by the test receiver to write the test file to disk in each suite)
      public.app.use(function(req, res, next) {
        req.__FILE_PARSER_TESTS__DIRNAME__AVATAR = outputDir.path;
        req.__FILE_PARSER_TESTS__FILENAME__AVATAR = 'avatar.jpg';
        req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR = path.join(outputDir.path, 'avatar.jpg');
        next();
      });


      // Lift Express server on 3000
      public.server = http.createServer(public.app)
      .listen(3000)
      .on('listening', done);
    },

    teardown: function() {

      // Clean up fixtures.
      _.each(fileFixtures, function(f) {
        f.unlinkSync();
      });

      // Clean up directory w/ test output.
      try {
        fsx.removeSync(outputDir.path);
      } catch (e) {
        // Ignore ENOENT (file/directory not found) errors
        // If the directory is missing for some reason, it's probably because the tests were stopped.
        if (e.code !== 'ENOENT') throw e;
      }

      // Lower Express server
      public.server.close();
    }
  };

  return public;
};
