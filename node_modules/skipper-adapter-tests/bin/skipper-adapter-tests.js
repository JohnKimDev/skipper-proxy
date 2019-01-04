#!/usr/bin/env node

require('../')({
  mocha: require('minimist')(process.argv.slice(2)),
  module: require(process.cwd())
});
