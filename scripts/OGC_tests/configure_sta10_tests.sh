#!/bin/bash

echo "Downloading ets-sta10 repo"

git clone https://github.com/opengeospatial/ets-sta10.git
cd ets-sta10

mvn clean install 

cd target

cp ets-sta10-0.8-SNAPSHOT-ctl.zip /home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE/scripts
cp ets-sta10-0.8-SNAPSHOT-deps.zip /home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE/resources/lib

cd ../../

cd /home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE/scripts
unzip ets-sta10-0.8-SNAPSHOT-ctl.zip

cd
cd /home/travis/build/mozilla-sensorweb/sensorthings/TE_BASE/resources/lib
unzip ets-sta10-0.8-SNAPSHOT-deps.zip

cd ../../../
