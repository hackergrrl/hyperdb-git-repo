# hyperdb-git-repo

> p2p git repo primitive for building p2p open source communities & escaping the
> corporate web

Implements [abstract-pull-git-repo][1].

## Usage

```js
#!/usr/bin/env node

var toPull = require('stream-to-pull-stream')
var pull = require('pull-stream')
var hyperdb = require('hyperdb')
var Repo = require('hyperdb-git-repo')
var gitRemoteHelper = require('pull-git-remote-helper')

var name = process.argv[3].replace('foo://', '')

var db = hyperdb('../' + name)

db.ready(function () {
  pull(
    toPull(process.stdin),
    gitRemoteHelper(Repo(db)),
    toPull(process.stdout)
  )
})
```

## API

Implements the [abstract-pull-git-repo API][1].

## License

non-commercial

[1]: https://github.com/clehner/abstract-pull-git-repo
