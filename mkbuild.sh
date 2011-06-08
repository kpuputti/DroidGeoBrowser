#!/bin/bash

version=$(grep 'version="' config.xml | grep -v '<?xml' | cut -f2 -d '"')
buildfile="droid-geo-browser-${version}.zip"
zip -r build/${buildfile} config.xml index.html css/ js/ img/ lib/

echo "Created build version ${version} to file build/${buildfile}"

exit 1
