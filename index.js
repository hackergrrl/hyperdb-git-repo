var createGitHash = require('pull-hash/ext/git')

module.exports = function (db) {
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
        pull(
          object.read,
          pull.collect(function (err, bufs) {
            if (err) throw err
            var buf = Buffer.concat(bufs, object.length)
            createGitHash(object, function (err, hash) {
              console.error('Got object', hash, object, buf)
              // TODO: deduce its hash
              objects(null, next)
            })
          })
        )
      })
    }
  }
}

