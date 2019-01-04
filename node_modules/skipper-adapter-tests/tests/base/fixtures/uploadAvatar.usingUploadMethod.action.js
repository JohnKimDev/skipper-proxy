
/**
 * Sails/Express action to handle multipart file uploads
 * sent in the `avatar` field.
 *
 * @param  {Request} req
 * @param  {Response} res
 */
module.exports = function (req, res) {

  // var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;
  var MAX_UPLOAD_SIZE_IN_BYTES = 5 * 1000 * 1000;

  req.file('avatar').upload({
    adapter: adapter,
    maxBytes: MAX_UPLOAD_SIZE_IN_BYTES,
    dirname: req.__FILE_PARSER_TESTS__DIRNAME__AVATAR,
    saveAs: req.__FILE_PARSER_TESTS__FILENAME__AVATAR
  }, function (err) {
    if (err) return res.status(500).send(err);
    return res.sendStatus(200);
  });
};
