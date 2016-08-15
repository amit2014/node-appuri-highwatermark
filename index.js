'use strict'

const AWS = require('aws-sdk'),
      s3 = new AWS.S3()

module.exports.put = (bucket, key, highwatermark) => s3
  .putObject({ Bucket: bucket, Key: key, Body: JSON.stringify(highwatermark) })
  .promise()
  .catch(() => console.error('WARNING: Failed to update high water mark for %j', highwatermark))

module.exports.get = (bucket, key, options) => {
  options = options || {}

  let promise
  if(options.override) {
    promise = Promise.resolve(options.override)
  } else {
    promise = s3
      .getObject({ Bucket: bucket, Key: key })
      .promise()
      .then(s3Object => JSON.parse(s3Object.Body.toString()))
      .catch(err => {
        if(err.statusCode === 404 && options.default) { return options.default }
        throw err
      })
  }

  return promise.then(highwatermark => {
    if(options.map) { highwatermark = options.map(highwatermark) }
    if(options.isValid && !options.isValid(highwatermark)) { throw new Error('Invalid high water mark') }

    return highwatermark
  })
}
