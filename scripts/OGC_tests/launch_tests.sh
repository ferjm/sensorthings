#!/bin/bash

echo "Launching SensorThings Test Suite tests"

# Path to te-install, TE_BASE and forms are needed
# Using relative path
/home/travis/build/mozilla-sensorweb/sensorthings/te-install/bin/unix/test.sh -source=sta10/1.0/ctl/sta10-suite.ctl -form=/home/travis/build/mozilla-sensorweb/sensorthings/test/forms/sta10.xml
