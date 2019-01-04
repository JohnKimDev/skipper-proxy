describe.skip('when using the "maxBytes" option', function() {

  before(function () {
    // Set up a route which listens to uploads
    app.post('/uploadmax', function (req, res, next) {
      assert(_.isFunction(req.file));

      // Disable underlying socket timeout
      // THIS IS IMPORTANT
      // see https://github.com/joyent/node/issues/4704#issuecomment-42763313
      res.setTimeout(0);

      req.file('avatar').upload({
        adapter: adapter,
        maxBytes: 6000000 // 6 MB
      }, function (err, files) {
        if (err) {
          return setTimeout(function() {
            return res.status(500).send(err.code);
          }, 100);
        }
        return res.send();
      });
    });
  });

  describe('Uploading a single file', function() {

    it('should allow uploads <= the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      toUploadAFile(1)(function(err) {
        return done(err);
      });
    });

    it('should not allow uploads > the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      toUploadAFile(11)(function(err) {
        if (err) {
          if (err === 'E_EXCEEDS_UPLOAD_LIMIT') { return done(); }
          return done(err);
        }
        return done(new Error('Should have thrown an error!'));
      });
    });

  });

  // describe('Uploading multiple files in a single upstream', function() {

  //   it('should allow uploads <= the maxBytes value', function(done) {
  //     this.slow(900000);// (15 minutes)
  //     var httpRequest = request.post({
  //       url: baseurl+'/uploadmax'
  //     }, onResponse);
  //     var form = httpRequest.form();
  //     form.append('foo', 'hello');
  //     form.append('bar', 'there');
  //     var nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     // Then check that it worked.
  //     function onResponse (err, response, body) {
  //       if (err) return done(err);
  //       else if (response.statusCode > 300) return done(body || response.statusCode);
  //       else done();
  //     }

  //   });

  //   it('should not allow uploads > the maxBytes value', function(done) {
  //     this.slow(900000);// (15 minutes)

  //     var httpRequest = request.post({
  //       url: baseurl+'/uploadmax'
  //     }, function (err, response, body) {
  //       // Then check that it worked:
  //       if (body == 'E_EXCEEDS_UPLOAD_LIMIT' && response.statusCode == 500) {return done();}
  //       if (err) { return done(err); }
  //       return done(new Error("Should have responded with the expected error!  Instead got status code "+response.statusCode+" and body: "+require('util').inspect(body,{depth:null})));
  //     });//_∏_

  //     // Include attachments
  //     var form = httpRequest.form();
  //     form.append('foo', 'hello');
  //     form.append('bar', 'there');
  //     var nonsenseFileToUpload;
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
  //     nonsenseFileToUpload = GENERATE_NONSENSE_FILE(1000000);
  //     form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));

  //   });

  // });




});


/**
 * [toUploadAFile description]
 * @param  {Number} MB
 * @return {Function}
 */
function toUploadAFile (MB) {

  /**
   * A function which builds an HTTP request with attached multipart
   * form upload(s), checking that everything worked.
   */
  return function uploadFile(cb) {
    var httpRequest = request.post({
      url: baseurl+'/uploadmax'
    }, onResponse);
    var form = httpRequest.form();
    form.append('foo', 'hello');
    form.append('bar', 'there');
    var nonsenseFileToUpload = GENERATE_NONSENSE_FILE(MB*1000000);
    form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));

    // Then check that it worked.
    function onResponse (err, response, body) {
      console.log('GOT RESPONSE:',err,response.statusCode,body);
      if (err) { return cb(err); }
      else if (response.statusCode > 300) { return cb(new Error('Non 2xx response: '+(body || response.statusCode))); }
      else { return cb(); }
    }
  };
}

