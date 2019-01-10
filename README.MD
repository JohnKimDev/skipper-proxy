# [<img title="skipper-ftp - FTP filesystem adapter for Skipper" src="http://i.imgur.com/P6gptnI.png" width="200px" alt="skipper emblem - face of a ship's captain"/>](https://github.com/JohnKimDev/skipper-proxy) Skipper Proxy Adapter
[![npm](https://img.shields.io/npm/v/skipper-proxy.svg)](https://www.npmjs.com/package/skipper-proxy)
[![npm](https://img.shields.io/npm/l/express.svg)]()

Proxy upload stream to another server using [skipper](https://github.com/balderdashy/skipper) and [got](https://github.com/sindresorhus/got)

If you want to proxy upload stream to other server on fly using Skipper, this is the Skipper adapter for you. 

Things you can do with `Skipper-Proxy` adater

* Proxy upload stream without writing a file to a server.  
[Browser]--(File Upload)-->[Server 1]--(Proxy File Upload)-->[Server 2]
* Change the request method (PUT, POST, PATCH, HEAD) & form field name when proxy to the remote server.
* Add additional headers to the upload streams 

From the proxy server, you can treat the upload stream as if the upload is directly from a browser.

## Installation

```
$ npm install skipper-proxy --save
```

Also make sure you have skipper [installed as your body parser](http://beta.sailsjs.org/#/documentation/concepts/Middleware?q=adding-or-overriding-http-middleware).

> Skipper is installed by default in [Sails](https://github.com/balderdashy/sails) v0.10 and above.


## Usage

```javascript
req.file('file') // <-- the fieldname from a browser upload
.upload({
  adapter: require('skipper-proxy'),
  url: 'https://example.com',   // REQUIRED: Proxy server URL
  method: 'put',                // OPTIONAL: Default = 'put'
  maxBytes: 1000 * 1000 * 5,    // OPTIONAL: Maximum bytes to upload
  fieldName: 'file',            // OPTIONAL: Form data field name for the proxy server. Default = 'file'
  retries: 2,                   // OPTIONAL: Number of request retries on failure. Defeault = 2
  headers: { <key> : <value> }  // OPTIONAL: Request headers to the proxy server
}, function whenDone(err, uploadedFiles) {
  if (err) {
     return res.negotiate(err); 
  }
  else {
    return res.ok({
      files: uploadedFiles
    });
  }
});
```

| Option        | Type       | Details |
|-----------    |:----------:|---------|
| `url`         | ((string)) | A `REQUIRED` parameter of the host or domain/IP.|
| `method`      | ((string)) | An optional parameter for request method. Default value : `'put'`|
| `maxBytes`    | ((number)) | An optional parameter for maximum bytes to upload.|
| `fieldName`   | ((string)) | An optional parameter for proxy form data field name. Default value :`'file'`|
| `retries`     | ((number)) | An optional parameter for number of request retries on failure. Default value : `2`|
| `headers`     | ((object)) | An optional parameter for header objects|


## License

MIT License (MIT)
