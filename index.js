var toPull = require('stream-to-pull-stream')
var pull = require('pull-stream')
var createGitHash = require('pull-hash/ext/git')
var multicb = require('multicb')
var debug = require('debug')('hyperdb-git-repo')

module.exports = function (db) {
  return {
    refs: function () {
      debug('want refs')
      return pull(
        toPull(db.createReadStream('git/refs', {recursive:true})),
        pull.map(function (nodes) {
          var node = nodes[0]
          debug('refs', node.key, node.value.toString())
          return {
            name: node.key.replace('git/', ''),
            hash: node.value.toString()
          }
        }),
        pull.map(function (ref) {
          debug('map', ref)
          return ref
        })
      )
    },
    symrefs: function () {
      return pull.once({ name: 'HEAD', ref: 'refs/heads/master'})
    },
    hasObject: function (hash, cb) {
      debug('has', hash)
      db.get('git/objects/' + hash + '/info', function (err, nodes) {
        cb(err, !!nodes.length)
      })
    },
    getObject: function (hash, cb) {
      debug('get', hash)
      db.get('git/objects/' + hash + '/info', function (err, nodes) {
        if (err) return cb(err)
        if (!nodes.length) return cb({notFound:true})
        var info = JSON.parse(nodes[0].value.toString())
        db.get('git/objects/' + hash + '/data', function (err, nodes) {
          if (err) return cb(err)
          info.read = pull.once(nodes[0].value)
          cb(null, info)
        })
      })
    },
    update: function (refs, objects, cb) {
      var refsDone = false
      var objsDone = false

      pull(
        refs,
        pull.drain(function (update) {
          db.put('git/' + update.name, update.new, function () {
            debug('update ref', update)
          })
        }, function () {
          refsDone = true
          if (refsDone && objsDone) cb()
        })
      )

      objects(null, function next(end, object) {
        if (end === true) {
          objsDone = true
          if (refsDone && objsDone) cb()
          return
        }
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
          // debug('updating object', hash, object, buf.length)
          var info = new Buffer(JSON.stringify({
            type: object.type,
            length: object.length
          }))
          db.put('git/objects/' + hash + '/info', info, function () {
            db.put('git/objects/' + hash + '/data', buf, function () {
              debug('wrote', hash, 'to hyperdb')
              objects(null, next)
            })
          })
        }
      })
    }
  }
}

