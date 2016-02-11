#!/usr/bin/env bash

source ~/.nvm/nvm.sh 2>/dev/null
nvm help >/dev/null || (
  git clone https://github.com/creationix/nvm.git ~/.nvm && (cd ~/.nvm && git checkout `git describe --abbrev=0 --tags`) && source ~/.nvm/nvm.sh
)

nvm install 0.10
nvm install 4.2
nvm install 5.5

if [[ $TRAVIS_OS_NAME == "linux" ]]; then export CXX=g++-4.8; fi
$CXX --version

nvm exec 5.5 npm install

nvm run 5.5 test.js
nvm run 4.2 test.js
nvm run 0.10 test.js
nvm run 4.2 test.js
nvm run 5.5 test.js
