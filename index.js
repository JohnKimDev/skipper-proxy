/**
 * Module dependencies
 */
const Writable = require('stream').Writable;
const _ = require('lodash');
const mime = require('mime');

/**
 * skipper-proxy
 *
 * @param  {Object} globalOpts
 * @return {Object}
 */
module.exports = function SkipperProxyStream(options) {
  
  options = _.defaults(options, {
    url: '',            // REQUIRED. No Default
    method: 'put',
    fieldName: 'file',
    retries: 2,
    headers: {},
  });

  const adapter = {

    ls: function(dirname, cb) {
        return cb(null, []);
    },

    read: function(fd, cb) {
        return null;
    },

    rm: function(fd, cb) {
        return cb();
    },

    receive: function (opts) {
        const receiver__ = Writable({objectMode: true});
  
        receiver__._files = [];
  
        // This `_write` method is invoked each time a new file is received
        // from the Readable stream (Upstream) which is pumping filestreams
        // into this receiver.  (filename === `__newFile.filename`).
  
        receiver__._write = function onFile(__newFile, encoding, done) {
          // file name before passing to transform
          options.filename = __newFile.fd;
  
          // extra meta data
          __newFile.extra = {};
  
          // Create a new write stream to parse File stream  to FTP
          const stream = require('./proxy-stream')(options);
  
          stream.on('error', function (err) {
            console.error(err);
            __newFile.extra.error = err; //in case it was finished with error
          });
  
          stream.on('E_EXCEEDS_UPLOAD_LIMIT', function (err) {
            done(err);
          });
  
          stream.on('finish', function () {
            __newFile.byteCount = stream.bodyLength;    // this is for skipper meta data of the file
            receiver__.emit('writefile', __newFile);    // Indicate that a file was persisted.
            done();
          });
  
          __newFile.pipe(stream);
        };
        return receiver__;
      },
  };

  return adapter;
};