'use strict'

var through = require('through2')

module.exports = prundupify

function prundupify(br, opts) {
  br.on('reset', prundupify.bind(this, br, opts))

  var map = new Map()

  // deps-sort buffers all rows before pushing them, so we don't need to do it.
  br.pipeline.get('sort').unshift(through.obj(function(row, enc, cb) {
    Object.keys(row.deps).forEach(function(id) {
      var file = row.deps[id]
      if (!map.has(file)) map.set(file, new Map())
      map.get(file).set(row, id)
    }.bind(this))

    this.push(row)
    cb()
  }))

  br.pipeline.get('dedupe').unshift(through.obj(function(row, enc, cb) {
    if (!row.dedupe || !row.sameDeps)
      return cb(null, row)

    if (map.has(row.file)) {
      map.get(row.file).forEach(function(id, or) {
        or.deps[id] = row.dedupe
        if (or.indexDeps)
          or.indexDeps[id] = row.dedupeIndex
      }.bind(this))
    }

    cb()
  }))

}
