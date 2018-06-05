var test = require('tape')
var suite = require('abstract-pull-git-repo/tests')
var Repo = require('..')
var tmp = require('os').tmpdir
var path = require('path')
var hyperdb = require('hyperdb')

function makeRepo (key, cb) {
  if (!cb && typeof key === 'function') {
    cb = key
    key = null
  }

  var dir = path.join(tmp(), 'tmp-' + String(Math.random()).slice(2))
  var db = hyperdb(dir, key)
  db.ready(function () {
    var repo = Repo(db)
    cb(null, repo, db)
  })
}

// repo tests
//test('repo', function (t) {
//  makeRepo(function (_, repo) {
//    suite.repo(t.test, repo)
//  })
//})

// repos tests
test('repos', function (t) {
  var repo2
  var db2
  function get (key, cb) {
    if (repo2) return process.nextTick(cb, null, repo2, db2)
    makeRepo(key, function (_, repo, db) {
      repo2 = repo
      db2 = db
      cb(null, repo, db)
    })
  }

  makeRepo(function (_, repo, db) {
    get(db.key, function (_, repo2, db2) {
      var r1 = db.replicate({live:true})
      var r2 = db2.replicate({live:true})
      r1.pipe(r2).pipe(r1)

      suite.repos(t.test, repo, function (cb) {
        get(db.key, cb)
      })
    })
  })
})
