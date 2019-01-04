var _ = require('@sailshq/lodash');

describe('aborting a file in progress', function() {
  this.timeout(10000);
  before(function () {
    // Set up a route which listens to uploads
    app.post('/upload_abort', function (req, res, next) {
      assert(_.isFunction(req.file));

      // Disable underlying socket timeout
      // THIS IS IMPORTANT
      // see https://github.com/joyent/node/issues/4704#issuecomment-42763313
      res.setTimeout(0);

      req.file('avatar').upload(adapter.receive({
        maxBytes: 1000 * 1000 * 100 // 100 MB
      }), function (err, files) {
        if (err) {
          return setTimeout(function() {
            res.statusCode = 500;
            res.send(err.message);
            return res.end();
          },100);
        }
        res.statusCode = 200;
        return res.json(files);
      });
    });
  });

  it('should not crash the server', function(done) {
    var http = require('http');

    // Set up the request options
    var options = {
      host: domain,
      port: port,
      path: '/upload_abort',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data;boundary=myawesomemultipartboundary',
        'Content-Length': 1000 * 1000 * 100 // Expect 100 megabytes
      }
    };

    // Make the request
    var req = http.request(options,
      // This callback should never be called, since the request
      // should end in an error after we abort it
      function() {
        return done(new Error("The request should have triggered an error, but it didn\'t!"));
      }
    );

    // Handle the request error
    req.on('error', function(e)  {
      return done();
    });

    // Make a series of req.write calls to start off a nice-looking multipart request,
    // up to where to the file data should go.
    var bodyBeforeFile = [
      '--myawesomemultipartboundary\r\n',
      'Content-Disposition: form-data; name="avatar"; filename="somefiletokeep.txt"\r\n',
      'Content-Type: text/plain\r\n',
      'Content-Transfer-Encoding: binary\r\n',
      '\r\n',
      new Buffer([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
      '\r\n--myawesomemultipartboundary\r\n',
      'Content-Disposition: form-data; name="avatar"; filename="somefiletobeaborted.jpg"\r\n',
      'Content-Type: image/jpeg\r\n',
      'Content-Transfer-Encoding: binary\r\n',
      '\r\n'
    ];
    _.each(bodyBeforeFile, function(chunk) {req.write(chunk);});

    // Now pump out 1mb worth of cash money ($)
    req.write((new Buffer(1000 * 1000)).fill(36));

    // Wait three seconds so that some of it maybe uploads,
    // then abort the request
    setTimeout(function() {
      req.abort();
      req.end();
    }, 3000);


  });

});
