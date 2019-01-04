describe('under a bit of load, this adapter', function() {

  before(function () {
    // Set up a route which listens to uploads
    app.post('/upload_tons', function (req, res, next) {
      assert(_.isFunction(req.file));
      req.file('avatar').upload(adapter.receive(), function (err, files) {
        if (err) throw err;
        res.statusCode = 200;
        return res.end();
      });
    });
  });

  it('should work properly with 30 simultaneous requests', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(30), uploadFile, done);
  });

  it('should work properly with 100 simultaneous requests', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(100), uploadFile, done);
  });

  it('should work properly with 200 simultaneous requests', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(200), uploadFile, done);
  });

});




/**
 * A function which builds an HTTP request with attached multipart
 * form upload(s), checking that everything worked.
 */
function uploadFile(i, cb) {
  var httpRequest = request.post(baseurl+'/upload_tons', onResponse);
  var form = httpRequest.form();
  form.append('foo', 'hello');
  form.append('bar', 'there');
  form.append('avatar', fsx.createReadStream( fixtures.files[0].path ));

  // Then check that it worked.
  function onResponse (err, response, body) {
    if (err) return cb(err);
    else if (response.statusCode > 300) return cb(body || response.statusCode);
    else cb();
  }
}
