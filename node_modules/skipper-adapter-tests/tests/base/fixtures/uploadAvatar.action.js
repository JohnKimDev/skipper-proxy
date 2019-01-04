
/**
 * Sails/Express action to handle multipart file uploads
 * sent in the `avatar` field.
 *
 * @param  {Request} req
 * @param  {Response} res
 *
 *
 * NOTE:
 * Alternatively, you can use the more succinct `upload`
 * syntax, which you is chainable on `req.file(...)`.
 *
 * See the `uploadAvatar.usingUploadMethod.action.js` fixture.
 */

module.exports = function (req, res) {

  var receiver__ = adapter.receive();

  // Build a transform stream that sets the fd for every upload
  req.file('avatar').pipe((function (){
    var __t__ = new require('stream').Transform({objectMode: true});
    __t__._transform = function (__file, enc, next) {
      __file.fd = require('path').join(req.__FILE_PARSER_TESTS__DIRNAME__AVATAR, req.__FILE_PARSER_TESTS__FILENAME__AVATAR);
      __t__.push(__file);
      next();
    };
    return __t__;
  })()).pipe( receiver__ );

  receiver__.on('finish', function allFilesUploaded (files) {
    res.sendStatus(200);
  });
  receiver__.on('error', function unableToUpload (err) {
    res.status(500).send(err);
  });

};

