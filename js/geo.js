/*jslint white: true, devel: true, onevar: false, undef: true, nomen: true,
  regexp: true, plusplus: false, bitwise: true, newcap: true, maxerr: 50,
  indent: 4 */
/*global jQuery: false, window: false, Mustache: false, location: false, setTimeout: false, google: false*/


(function ($) {

    var log = function () {
        if (window.console) {
            console.log(Array.prototype.slice.call(arguments));
        }
    };

    var config = {
        rootId: '6295630',
        rootTitle: 'Earth',

        // fcodes that should have a flag in the listing
        flagCodes: {
            'PCLI': true,
            'PCLD': true,
            'TERR': true,
            'PCLIX': true,
            'PCLS': true,
            'PCLF': true
        }
    };

    var templates = {
        getUrl: 'http://api.geonames.org/getJSON?geonameId={{geonameId}}&username=kpuputti',
        childrenUrl: 'http://api.geonames.org/childrenJSON?geonameId={{geonameId}}&username=kpuputti',
        searchUrl: 'http://api.geonames.org/searchJSON?q={{query}}&maxRows=500&username=kpuputti',
        listing: '<section id="listing-{{geonameId}}" class="page">' +
            '<header><h1>' +
            '<a href="#info-{{geonameId}}">{{toponymName}}</a>' +
            '<a class="search-link" href="#search"></a>' +
            '</h1></header>' +
            '<div class="content">' +
            '<ul class="listview"></ul>' +
            '</div>' +
            '</section>',
        listingEntry: '<li><a href="#listing-{{geonameId}}" class="geoname">' +
            '{{#flagImage}}' +
            '<img class="flag" src="img/flags/{{flagImage}}" />' +
            '{{/flagImage}}' +
            '<span class="title">{{toponymName}}</span>' +
            '</a></li>',
        info: '<section id="info-{{geonameId}}" class="page">' +
            '<header><h1>' +
            '{{toponymName}}' +
            '<a class="search-link" href="#search"></a>' +
            '</h1></header>' +
            '<div class="content">' +
            '<p><strong>geonameId</strong>: {{geonameId}}</p>' +
            '<p><strong>fclName</strong>: {{fclName}}</p>' +
            '<p><strong>fcode</strong>: {{fcode}}</p>' +
            '<p><strong>latitude</strong>: {{lat}}</p>' +
            '<p><strong>longitude</strong>: {{lng}}</p>' +
            '<p><strong>population</strong>: {{population}}</p>' +
            '<p><a class="show-map" href="#map">show on map</a></p>' +
            '</div>' +
            '</section>',
        mapInfoWindow: '<div class="info-window">' +
            '<h3>{{toponymName}}</h3>' +
            '</div>',
        searchResult: '<li><a class="geoname" href="#info-{{geonameId}}">{{toponymName}}</a></li>'
    };

    var loading;

    var showLoading = function () {
        loading.fadeIn('fast');
    };

    var hideLoading = function () {
        loading.fadeOut('fast');
    };

    var map;
    var mapInitialized = false;
    var infoWindow;

    var initMap = function () {
        log('init map');
        var mapElem = $('#map > div');
        map = new google.maps.Map(mapElem.get(0), {
            zoom: 6,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        mapElem.height($(window).height());
        map.setCenter(new google.maps.LatLng(60.154723, 24.8866736));
        mapInitialized = true;
    };

    var showMap = function (geoname) {
        if (!mapInitialized) {
            initMap();
        }
        log('show map', geoname.toponymName);
        if (infoWindow) {
            infoWindow.close();
        }
        var latlng = new google.maps.LatLng(geoname.lat, geoname.lng);
        map.panTo(latlng);
        infoWindow = new google.maps.InfoWindow({
            content: Mustache.to_html(templates.mapInfoWindow, geoname),
            position: latlng
        });
        infoWindow.open(map);
    };

    var addListingPage = function (pageId, callback) {
        var geonameId = pageId.split('-')[1];
        var getUrl = Mustache.to_html(templates.getUrl, {
            geonameId: geonameId
        });
        var childrenUrl = Mustache.to_html(templates.childrenUrl, {
            geonameId: geonameId
        });
        log('adding listing page:', pageId, geonameId);
        $.getJSON(getUrl, function (geoname) {
            var page = $(Mustache.to_html(templates.listing, geoname));

            $.getJSON(childrenUrl, function (children) {
                var geonameList = page.find('.content > .listview');
                if (children.totalResultsCount) {
                    var geonames = children.geonames;
                    var len = geonames.length;
                    var geoname;
                    var fcode;
                    for (var i = 0; i < len; ++i) {
                        geoname = geonames[i];
                        geoname.flagImage = (config.flagCodes[geoname.fcode]) && geoname.countryCode ?
                            geoname.countryCode.toLowerCase() + '.png' : false;
                        geonameList.append(Mustache.to_html(templates.listingEntry, geonames[i]));
                    }
                } else {
                    $('<li></li>').text('no places found').appendTo(geonameList);
                }
                $('#pages').append(page);
                callback();
            });
        });
    };

    var addInfoPage = function (pageId, callback) {
        var geonameId = pageId.split('-')[1];
        var getUrl = Mustache.to_html(templates.getUrl, {
            geonameId: geonameId
        });
        log('adding info page:', pageId);
        $.getJSON(getUrl, function (geoname) {
            var page = $(Mustache.to_html(templates.info, geoname));
            page.find('.show-map').click(function (e) {
                showMap(geoname);
            });
            $('#pages').append(page);
            callback(geoname);
        });
    };

    var showPage = function (href) {
        log('showing page:', href);
        $('.current').hide().removeClass('current');

        var page = $('#pages > ' + href);
        if (page.length === 1) {
            log('page already fetched, showing');
            page.addClass('current').show();
            hideLoading();
            return;
        }

        showLoading();
        var type = href.replace(/^#/, '').split('-')[0];

        if (type === 'listing') {
            addListingPage(href, function () {
                hideLoading();
                $('#pages > ' + href).addClass('current').show();
            });
        } else if (type === 'info') {
            addInfoPage(href, function (geoname) {
                log('showing info page:', geoname);
                hideLoading();
                $('#pages > ' + href).addClass('current').show();
            });
        } else {
            log('unknown page type:', type, 'href');
            hideLoading();
        }

    };

    var search = function (query) {
        log('searching for:', query);
        showLoading();
        var results = $('#results');
        results.empty().hide();
        var url = Mustache.to_html(templates.searchUrl, {
            query: query
        });
        $.getJSON(url, function (data) {
            var count = data.totalResultsCount;
            log('found', count, 'results');
            if (count) {
                var geonames = data.geonames;
                var len = geonames.length;
                for (var i = 0; i < len; ++i) {
                    results.append(Mustache.to_html(templates.searchResult, geonames[i]));
                }
            } else {
                $('<li></li>').text('no results found').appendTo(results);
            }
            hideLoading();
            results.fadeIn();
        });
    };

    var geo = {};

    geo.init = function () {
        log('geo.init');

        loading = $('#loading');

        $('#pages').bind('touchstart', function (e) {
            var target = $(e.target);
            if (target.is('a.geoname')) {
                target.addClass('hover');
            }
        }).bind('touchmove', function (e) {
            $(e.target).removeClass('hover');
        }).bind('touchend', function (e) {
            $(e.target).removeClass('hover');
        });

        var rootHash = '#listing-' + config.rootId;
        window.addEventListener('hashchange', function () {
            log('hash change to:', location.hash);
            if (location.hash) {
                showPage(location.hash);
            } else {
                showPage(rootHash);
            }
        }, false);

        var hash = location.hash;
        log('hash:', hash);
        if (hash === '#search' || /^#(info|listing)-\d+$/.test(hash)) {
            // Show the corrensponding page based on initial hash.
            showPage(hash);
        } else {
            // Show root geoname (Earth).
            log('root hash:', rootHash);
            location.hash = rootHash;
            showPage(rootHash);
        }

        var queryInput = $('#search input[type=search]');
        $('#search > form').submit(function (e) {
            e.preventDefault();
            search(queryInput.val());
        });

        // Generic error catcher.
        window.onerror = function () {
            var args = Array.prototype.slice.call(arguments);
            alert('Application error: ' + args.join('\n'));
        };
    };
    // Expose the namespace.
    window.geo = geo;
}(jQuery));
