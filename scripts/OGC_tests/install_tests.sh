#!/bin/bash

export COMMON_PATH=/home/travis/build/mozilla-sensorweb/sensorthings

echo "Installing TE Source"
git clone https://github.com/opengeospatial/teamengine.git repo/teamengine

echo "Building TE source"
cd $COMMON_PATH/repo/teamengine

# Lets try with master
# git checkout 4.2

mvn install

cd ../../

echo "Preparing TE_BASE"
mkdir TE_BASE

export TE_BASE=/home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE
export PATH=$TE_BASE:$PATH

cd TE_BASE

# Path to repo
cp $COMMON_PATH/repo/teamengine/teamengine-console/target/teamengine-console-4.10-SNAPSHOT-base.zip .
unzip teamengine-console-4.10-SNAPSHOT-base.zip
cd ..

echo "Preparing te-install"
mkdir te-install
cd te-install

# Path to repo
cp $COMMON_PATH/repo/teamengine/teamengine-console/target/teamengine-console-4.10-SNAPSHOT-bin.zip .
unzip teamengine-console-4.10-SNAPSHOT-bin.zip

cd ..

echo "Downloading ets-sta10 repo"

git clone https://github.com/opengeospatial/ets-sta10.git
cd ets-sta10

mvn clean install 

cd target

cp ets-sta10-0.8-SNAPSHOT-ctl.zip $COMMON_PATH/TE_BASE/scripts
cp ets-sta10-0.8-SNAPSHOT-deps.zip $COMMON_PATH/TE_BASE/resources/lib

cd $COMMON_PATH/TE_BASE/scripts
unzip ets-sta10-0.8-SNAPSHOT-ctl.zip

cd $COMMON_PATH/TE_BASE/resources/lib
unzip ets-sta10-0.8-SNAPSHOT-deps.zip

cd ../../../
