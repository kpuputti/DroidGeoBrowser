#!/bin/bash

version=$(grep 'version="' config.xml | grep -v '<?xml' | cut -f2 -d '"')

zip -r build/droid-geo-browser-${version}.zip config.xml index.html css/ js/ img/

exit 1
