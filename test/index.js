'use strict'

const proxyquire = require('proxyquire'),
      appuriHighwatermark = require('../index')

require('chai').should()

describe('highwatermark', () => {
  describe('get', () => {
    it('should return options.override if it is set', function*() {
      const highwatermark = yield appuriHighwatermark.get('', '', { override: 'override', default: 'default' })
      highwatermark.should.equal('override')
    })

    it('should return the options.default if there is no high watermark in s3', function*() {
      let called = 0
      const mockedAppuriHighwatermark = proxyquire('../index', { 'aws-sdk': { S3: class {
        getObject(params) {

          called++
          params.should.deep.equal({ Bucket: 'bucket', Key: 'key' })
          return { promise: () => Promise.reject({ statusCode: 404 }) }
        }}}})

      const highwatermark = yield mockedAppuriHighwatermark.get('bucket', 'key', { default: 'default' })
      highwatermark.should.equal('default')
      called.should.equal(1)
    })

    it('should return the value from s3', function*() {
      let called = 0
      const mockedAppuriHighwatermark = proxyquire('../index', { 'aws-sdk': { S3: class {
        getObject(params) {

          called++
          params.should.deep.equal({ Bucket: 'bucket', Key: 'key' })
          return { promise: () => Promise.resolve({ Body: new Buffer('"s3_highwatermark"') }) }
        }}}})

      const highwatermark = yield mockedAppuriHighwatermark.get('bucket', 'key')
      highwatermark.should.equal('s3_highwatermark')
      called.should.equal(1)
    })

    it('should throw if options.isValid is set and the highwatermark is invalid', function*() {
      try {
        yield appuriHighwatermark.get('bucket', 'key', { override: 'foo', isValid: () => false })
        false.should.equal(true, 'Should have thrown an exception')
      } catch(e) {
        e.message.should.equal('Invalid high water mark')
      }
    })

    it('should map the highwatermark if options.map is set', function*() {

      const highwatermark = yield appuriHighwatermark.get('bucket', 'key', {
        override: '123',
        isValid: (string) => !Number.isNaN(string),
        map: Number
      })
      highwatermark.should.equal(123)
    })
  })

  describe('put', () => {

    it('should send the highwatermark back to s3', function*() {

      let called = 0
      const mockedAppuriHighwatermark = proxyquire('../index', { 'aws-sdk': { S3: class {
        putObject(params) {

          called++
          params.should.deep.equal({ Bucket: 'bucket', Key: 'key', Body: '"new_highwatermark"' })
          return { promise: () => Promise.resolve() }
        }}}})

      yield mockedAppuriHighwatermark.put('bucket', 'key', 'new_highwatermark')
      called.should.equal(1)
    })

    it('should not throw if there is an s3 error', function*() {

      let called = 0
      const mockedAppuriHighwatermark = proxyquire('../index', { 'aws-sdk': { S3: class {
        putObject(params) {

          called++
          params.should.deep.equal({ Bucket: 'bucket', Key: 'key', Body: '"new_highwatermark"' })
          return { promise: () => Promise.reject({ statusCode: 400 }) }
        }}}})

      yield mockedAppuriHighwatermark.put('bucket', 'key', 'new_highwatermark')
      called.should.equal(1)
    })
  })
})
