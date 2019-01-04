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
    maxBytes: -1,       // -1 = unlimited
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
        const receiver__ = Writable({ objectMode: true });

        const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
            
        if (!options.url || !urlPattern.test(options.url)) {
            receiver__.emit('error', new Error('Invalid URL'));
            return;
        }

        // This `_write` method is invoked each time a new file is received
        // from the Readable stream (Upstream) which is pumping filestreams
        // into this receiver.  (filename === `__newFile.filename`).
        receiver__._write = function onFile(__newFile, encoding, done) {
            const headers = {};

            _.defaults(headers, options.headers);

            // Create a new write stream to parse File stream  to FTP
            const stream = require('./proxy-stream')(options);

            stream.on('error', function(err) {
                receiver__.emit('error', err);
                done();
            });

            stream.on('E_EXCEEDS_UPLOAD_LIMIT', function (err) {
                receiver__.emit('error', err);
                done();
            });

            stream.on('finish', function() {
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