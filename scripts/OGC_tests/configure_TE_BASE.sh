#!/bin/bash

echo "Preparing TE_BASE"
mkdir TE_BASE

export TE_BASE=/home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE
export PATH=$TE_BASE:$PATH

cd TE_BASE

# Path to repo
cp /home/travis/build/mozilla-sensorweb/sensorthings/repo/teamengine/teamengine-console/target/teamengine-console-4.2-base.zip .
unzip teamengine-console-4.2-base.zip
cd ..

echo "Preparing te-install"
mkdir te-install
cd te-install

# Path to repo
cp /home/travis/build/mozilla-sensorweb/sensorthings/repo/teamengine/teamengine-console/target/teamengine-console-4.2-bin.zip .
unzip teamengine-console-4.2-bin.zip

cd ..
