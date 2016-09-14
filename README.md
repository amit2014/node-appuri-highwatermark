# node-appuri-highwatermark

This module uses s3 to store the high water mark for an Appuri event loader.

## API

### `put(bucket, key, highwatermark)`

Puts the stringified highwatermark object in S3 at bucket/key

### `get(bucket, key, options) -> Promise<object>`

Fetch the S3 object at bucket/key then parse it as JSON, returning the object

Options:

- `default`: When the key doesn't exist, this default is returned.
- `override`: Do not fetch the key from S3 but return this instead
- `map`: transform function to convert the object after it is parsed
- `isValid`: A function to validate the watermark. Rejects the promise with an error if this returns false

### `delete(bucket, key)`

Deletes the watermark at bucket/key