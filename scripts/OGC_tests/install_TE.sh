#!/bin/bash

echo "Installing TE Source"
mkdir repo
cd repo
git clone https://github.com/opengeospatial/teamengine.git

echo "Building TE source"
cd teamengine
git checkout 4.2

mvn install

cd teamengine-console/target
cd ../../../../
