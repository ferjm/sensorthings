#!/bin/bash

COMMON_PATH=$PWD

echo "Installing TE Source"
git clone https://github.com/opengeospatial/teamengine.git repo/teamengine

echo "Building TE source"
cd $COMMON_PATH/repo/teamengine

# Using master branch

mvn install

cd ../../

echo "Preparing TE_BASE"
mkdir TE_BASE

export TE_BASE=$COMMON_PATH/TE_BASE
export PATH=$TE_BASE:$PATH

cd TE_BASE

# Copying teamengine-console-xxxx-base.zip into TE_BASE
cp $COMMON_PATH/repo/teamengine/teamengine-console/target/teamengine-console-4.10-SNAPSHOT-base.zip .
unzip teamengine-console-4.10-SNAPSHOT-base.zip
cd ..

echo "Preparing te-install"
mkdir te-install
cd te-install

# Copying teamengine-console-xxxx-bin.zip into TE_BASE
cp $COMMON_PATH/repo/teamengine/teamengine-console/target/teamengine-console-4.10-SNAPSHOT-bin.zip .
unzip teamengine-console-4.10-SNAPSHOT-bin.zip

cd ..

echo "Downloading ets-sta10 repo"
# Download tests from repo
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
