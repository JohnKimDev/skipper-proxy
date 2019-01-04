var _ = require('@sailshq/lodash');
var path = require('path');

describe('after uploading a file using this adapter, Skipper', function() {

  before(bindTestRoute);

  describe('each file metadata object', function () {

    var metadataAboutUploadedFiles = [];
    var expectedFileSizes = {};

    before(function (done){

      expectedFileSizes = _.reduce( fixtures.files, function(memo, file) {
        memo[path.basename(file.path)] = file.size;
        return memo;
      }, {});

      // Do 2 requests at once to up the stakes a bit
      require('async').series([
        function (cb) {
          uploadFiles({
            foo: 'hello',
            bar: 'there',
            avatar: fsx.createReadStream( fixtures.files[0].path ),
            logo: fsx.createReadStream( fixtures.files[1].path )
          },function (err, _metadata) {
            if (err) return cb(err);
            assert(_.isArray(_metadata), 'metadata should be an array, instead it is:'+require('util').inspect(_metadata, false, null));
            metadataAboutUploadedFiles = metadataAboutUploadedFiles.concat(_metadata);
            cb();
          });
        },
        function (cb) {
          uploadFiles({
            foo: 'hello again',
            bar: 'there again',
            avatar: fsx.createReadStream( fixtures.files[2].path ),
            logo: fsx.createReadStream( fixtures.files[3].path ),
            userFile: [
              fsx.createReadStream( fixtures.files[4].path ),
              fsx.createReadStream( fixtures.files[5].path ),
              fsx.createReadStream( fixtures.files[6].path ),
              fsx.createReadStream( fixtures.files[7].path )
            ]
          },function (err, _metadata) {
            if (err) return cb(err);
            assert(_.isArray(_metadata), 'metadata should be an array, instead it is:'+require('util').inspect(_metadata, false, null));
            metadataAboutUploadedFiles = metadataAboutUploadedFiles.concat(_metadata);
            cb();
          });
        }], done);
    });

    it('should be an object', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        assert(_.isObject(obj), 'metadata should be an object, instead it is:'+require('util').inspect(obj, false, null)+'\nHere is the entire array:\n'+require('util').inspect(metadataAboutUploadedFiles, false, null));
      });
    });

    describe('field', function (){
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.field, 'string');
        });
      });
    });

    it('should have the original filename of the uploaded file', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        if (obj.field === 'avatar') {
          var nameOfUploadedFiles = [require('path').basename(fixtures.files[0].path), require('path').basename(fixtures.files[2].path)];
          assert(_.contains(nameOfUploadedFiles, obj.filename));
        }
      });
    });

    describe('file descriptor (`fd`)', function () {
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.fd, 'string', 'Metadata obj:'+require('util').inspect(obj, false, null));
        });
      });
      it('should be within the specified `dirname` if one was provided', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'avatar') {
            var expectedDirname = path.resolve('/','tmp','avatar-uploads');
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should have basename === `saveAs` if a string was passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'logo') {
            assert.equal(require('path').basename(obj.fd), 'the_logo.jpg');
          }
        });
      });
      it('should be within the specified `dirname` even if a string was passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'logo') {
            var expectedDirname = path.resolve('/','tmp');
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should have expected basename when a function is passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'userFile') {
            assert.equal(require('path').basename(obj.fd), 'user-file__'+obj.filename);
          }
        });
      });
      it('should be within the specified `dirname` even if a function is passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'userFile') {
            var expectedDirname = path.resolve('/','tmp','user-files');
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should default to a UUID as its basename if `saveAs` was not specified', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'avatar') {

            // Expect a UUID with an optional file extension suffix (i.e. `.jpeg`)
            // '110ec58a-a0f2-4ac4-8393-c866d813b8d1.jpeg'
            var UUID_REGEXP = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+(\.[a-zA-Z0-9]*)?$/;
            assert(require('path').basename(obj.fd).match(UUID_REGEXP), require('util').format('Expected fd (%s) to be a UUID', obj.fd));
          }
        });
      });
    });

    it('should contain the file size', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        assert.equal(obj.size, expectedFileSizes[obj.filename]);
      });
    });

    describe('type', function (){
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.type, 'string');
        });
      });
      it('should otherwise default to "application/octet-stream"', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(obj.type, 'application/octet-stream');
        });
      });
    });
  });

});




/**
 * A function which builds an HTTP request with attached multipart
 * form upload(s), checking that everything worked.
 */
function uploadFiles(fields, cb) {
  // console.log('---- BEGIN NEW REQUEST ----');
  var httpRequest = request.post(baseurl+'/upload_metadata_test', onResponse);
  var form = _.reduce(fields, function (form,value,fieldName){
    if (_.isArray(value)) {
      _.each(value, function (_item) {
        form.append(fieldName, _item);
      });
    }
    else form.append(fieldName, value);

    return form;
  }, httpRequest.form());

  // Then check that it worked.
  function onResponse (err, response, body) {
    if (err) return cb(err);
    else if (response.statusCode >= 300) return cb(body || response.statusCode);
    else {
      if (_.isString(body)) {
        try { body = JSON.parse(body); } catch (e){}
      }
      // console.log('\n--------******---------', body);

      cb(err, body);
    }
  }
}



function bindTestRoute() {
  // Set up a route which listens to uploads
  app.post('/upload_metadata_test', function (req, res, next) {
    assert(_.isFunction(req.file));

    require('async').auto({
      // defaults (uuid for the fd)
      avatar: function (cb) {
        req.file('avatar').upload({
          adapter: adapter,
          dirname: '/tmp/avatar-uploads'

          // NOT THIS:
          // (only the local disk adapter should do this-- i.e. for an S3
          // upload, how is the cwd relevant?)
          // require('path').join(process.cwd(), '.tmp/avatar-uploads')
        }, cb);
      },
      // hard-coded string for `saveAs` (one-off fd, always the same)
      logo: function (cb) {
        req.file('logo').upload({
          adapter: adapter,
          dirname: '/tmp',
          saveAs: 'the_logo.jpg'
        }, cb);
      },
      // function for `saveAs` (for customizing the fd)
      userFile: function (cb) {
        req.file('userFile').upload({
          adapter: adapter,
          dirname: '/tmp/user-files',
          saveAs: function (newFile, cb) {
            cb(null, 'user-file__'+newFile.filename);
          }
        }, cb);
      }
    }, function (err, async_data) {
      if (err) return next(err);

      // Merge all uploaded file metadata together into one array
      // for use in the tests below
      var _files = _.reduce(async_data, function (m,v,k){
        m = m.concat(v);
        return m;
      }, []);

      res.statusCode = 200;
      return res.json(_files);
    });

  });
}

