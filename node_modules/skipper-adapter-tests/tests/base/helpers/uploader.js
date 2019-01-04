/**
 * Module dependencies
 */

var Request = require('request');
var _ = require('@sailshq/lodash');



/**
 *
 * @param  {Object} optionalOptions
 * @param  {Function} optionalCallback
 * @return {HTTPRequest}
 */

module.exports = function getUploader ( optionalOptions, optionalCallback ) {

	var opts = optionalOptions || {};
	_.defaults(opts, {
		baseurl: 'http://localhost:3000',
	});
	_.defaults(opts, {
		url: opts.baseurl+'/upload'
	});

  // Marshal opts for HTTP request
  opts = {
    url: opts.url,
    timeout: (15*60*60*1000)
  };

	// Bootstrap an HTTP client
	var httpClient__outs =
	(optionalCallback)
		? Request.post(opts, optionalCallback)
		: Request.post(opts);

	return httpClient__outs;
};
