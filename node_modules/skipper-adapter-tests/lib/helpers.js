/**
 * Module dependencies
 */

var fsx = require('fs-extra');
var assert = require('assert');
var _ = require('@sailshq/lodash');
var skipper = require('skipper');
var connect = require('connect');
var routify = require('routification');
var Temporary = require('temporary');
var crypto = require('crypto');
var request = require('request');






module.exports = Helpers();


function Helpers () {

  var fileFixtures;
  var outputDir;

  var server;
  var app;
  var PORT = 1343;

  function GENERATE_NONSENSE_FILE (numBytes) {
    var EOF = new Buffer([0x04]);
    var f = new Temporary.File();
    f.writeFileSync(Buffer.concat([crypto.pseudoRandomBytes(numBytes),EOF], numBytes + 1));
    f.size = numBytes + 1;
    fileFixtures.push(f);
    return f;
  }
  global['GENERATE_NONSENSE_FILE'] = GENERATE_NONSENSE_FILE;

  return {

    /**
     * [setup description]
     * @return {[type]} [description]
     */
    setup: function (done) {

      // Build HTTP server and listen on a port.
      app = connect();
      app = routify(app);

      // Give ourselves a dumbed-down impl. of res.json()
      // and res.send() to make things easier in the tests.
      // (these will not work all the time)
      // Also add req.is() for use in Skipper core (bypasses Express 4 compat. check)
      app.use(function (req, res, next) {

        req.is = function(/*mimeTypeExpr*/) {
          console.warn('Note: req.is() doesn\'t actually work in our routification shim.  (It always returns false.)');
          return false;
        };
        res.send = function (body) {
          if (body !== undefined) {
            res.write(body);
          }
          res.end();
        };
        res.json = function (body){
          body = JSON.stringify(body);
          return res.send(body);
        };
        next();
      });

      app.use(skipper());

      server = app.listen(PORT, done);

      // Expose globals for tests to use
      // (because we're too hog wild for that require shit + c'mon these are tests...)
      global['_'] = _;
      global['assert'] = assert;
      global['request'] = request;
      global['fsx'] = fsx;

      global['server'] = server;
      global['app'] = app;

      global['baseurl'] = 'http://localhost:'+PORT;
      global['domain'] = 'localhost';
      global['port'] = PORT;


      // Create an array of file fixtures.
      fileFixtures = [];

      // Create a tmp directory for our uploads to live in.
      outputDir = new Temporary.Dir();

      // Write nonsense bytes to our file fixtures.
      for (var bytes=10; bytes <= 100000; bytes*=10) {
        GENERATE_NONSENSE_FILE(bytes);
      }
      // Make another set for good measure.
      for (bytes=10; bytes <= 100000; bytes*=10) {
        GENERATE_NONSENSE_FILE(bytes);
      }


      global['fixtures'] = {
        files: fileFixtures,
        dir: outputDir
      };
    },

    /**
     * [teardown description]
     * @return {[type]} [description]
     */
    teardown: function (done) {

      // Clean up fixtures.
      _.each(fileFixtures, function (f) {
        f.unlinkSync();
      });

      // Clean up directory w/ test output.
      fsx.removeSync(outputDir.path);

      // Teardown the HTTP server.
      server.close(done);
    }
  };
}




