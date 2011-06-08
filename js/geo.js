/*jslint white: true, devel: true, onevar: false, undef: true, nomen: true,
  regexp: true, plusplus: false, bitwise: true, newcap: true, maxerr: 50,
  indent: 4 */
/*global jQuery: false, window: false, Mustache: false, location: false, setTimeout: false */

(function ($) {

    var log = function () {
        var args = Array.prototype.slice.call(arguments);
        $('<li></li>').text(args.join('')).appendTo('#log');
        if (window.console) {
            //console.log(Array.prototype.slice.call(arguments));
            console.log(args);
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
            '<span class="title">{{toponymName}}, fcode: {{fcode}}</span>' +
            '</a></li>',
        info: '<section id="info-{{geonameId}}" class="page">' +
            '<header><h1>{{toponymName}}</h1></header>' +
            '<div class="content">' +
            '<p><strong>geonameId</strong>: {{geonameId}}</p>' +
            '<p><strong>fclName</strong>: {{fclName}}</p>' +
            '<p><strong>latitude</strong>: {{lat}}</p>' +
            '<p><strong>longitude</strong>: {{lng}}</p>' +
            '<p><strong>population</strong>: {{population}}</p>' +
            '</div>' +
            '</section>'
    };

    var loading;

    var showLoading = function () {
        loading.fadeIn('fast');
    };

    var hideLoading = function () {
        loading.fadeOut('fast');
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
                    showPage('#info-' + geonameId);
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
        $.getJSON(getUrl, function (data) {
            var page = $(Mustache.to_html(templates.info, data));
            $('#pages').append(page);
            callback();
        });
    };

    var showPage = function (href) {

        $('.current').hide().removeClass('current');

        var page = $('#pages > ' + href);
        log('page.length:', page.length);
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

        if (location.hash) {
            showPage(location.hash);
        } else {
            // Show root geoname (Earth).
            location.hash = rootHash;
        }

    };
    // Expose the namespace.
    window.geo = geo;
}(jQuery));
