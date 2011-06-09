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
        rootTitle: 'Earth'
    };

    var templates = {
        getUrl: 'http://api.geonames.org/getJSON?formatted=true&geonameId={{geonameId}}&username=kpuputti',
        childrenUrl: 'http://api.geonames.org/childrenJSON?geonameId={{geonameId}}&username=kpuputti',
        listing: '<section id="listing-{{geonameId}}" class="page">' +
            '<header><h1><a href="#info-{{geonameId}}">{{toponymName}}</a></h1></header>' +
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
            '<header><h1>{{toponymName}}</h1></header>' +
            '<div class="content">' +
            '<p><strong>geonameId</strong>: {{geonameId}}</p>' +
            '<p><strong>fclName</strong>: {{fclName}}</p>' +
            '<p><strong>latitude</strong>: {{lat}}</p>' +
            '<p><strong>longitude</strong>: {{lng}}</p>' +
            '<p><strong>population</strong>: {{population}}</p>' +
            '<p><a class="show-map" href="#map">show on map</a></p>' +
            '</div>' +
            '</section>',
        mapInfoWindow: '<div class="info-window">' +
            '<h3>{{toponymName}}</h3>' +
            '</div>'
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
        var mapElem = $('#map');
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
        log('show map', geoname);
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
                    for (var i = 0; i < len; ++i) {
                        geoname = geonames[i];
                        geoname.flagImage = geoname.fcode === 'PCLI' && geoname.countryCode ?
                            geoname.countryCode.toLowerCase() + '.png' : false;
                        geonameList.append(Mustache.to_html(templates.listingEntry, geonames[i]));
                    }
                } else {
                    var hash = '#info-' + geonameId;
                    location.hash = hash;
                    showPage(hash);
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
            callback();
        });
    };

    var showPage = function (href) {

        $('.current').hide().removeClass('current');

        var page = $('#pages > ' + href);
        if (page.length === 1) {
            log('page already fetched, showing');
            page.addClass('current').fadeIn();
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
            addInfoPage(href, function () {
                hideLoading();
                $('#pages > ' + href).addClass('current').show();
            });
        }

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

        if (location.hash && location.hash !== '#map') {
            showPage(location.hash);
        } else {
            // Show root geoname (Earth).
            location.hash = rootHash;
        }

        // Generic error catcher.
        window.onerror = function () {
            var args = Array.prototype.slice.call(arguments);
            alert('Application error: ' + args.join('\n'));
        };
    };
    // Expose the namespace.
    window.geo = geo;
}(jQuery));
