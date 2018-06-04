var pull = require('pull-stream')
var createGitHash = require('pull-hash/ext/git')
var multicb = require('multicb')

module.exports = function (db) {
  return {
    refs: pull.empty,
    hasObject: function (hash, cb) { cb(null, false) },
    getObject: function (hash, cb) { cb(null, null) },
    update: function (refs, objects) {
      pull(
        refs,
        pull.drain(function (update) {
          console.error('Updating ' + update.name + ' to ' + update.new)
        })
      )
      objects(null, function next(end, object) {
        if (end === true) return
        if (end) throw end
        var pending = 2
        var buf, hash
        pull(
          object.read,
          createGitHash(object, done),
          pull.collect(function (err, bufs) {
            if (err) return done(err)
            buf = Buffer.concat(bufs, object.length)
            done()
          })
        )
        function done (err, theHash) {
          if (theHash) hash = theHash
          if (--pending) return
          console.error('Got object', hash, object, buf.length)
        }
      })
    }
  }
}

