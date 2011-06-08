/*jslint white: true, devel: true, onevar: false, undef: true, nomen: true,
  regexp: true, plusplus: false, bitwise: true, newcap: true, maxerr: 50,
  indent: 4 */
/*global jQuery: false, window: false, Mustache: false */

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
        rootId: '6295630'
    };

    var templates = {
        childrenUrl: 'http://api.geonames.org/childrenJSON?geonameId={{geonameId}}&username=kpuputti',
        section: '<section id="page-{{geonameId}}" class="page">' +
            '<header><h1>{{title}}</h1></header>' +
            '<div class="content">' +
            '<ul class="listview"></ul>' +
            '</div>' +
            '</section>',
        geoname: '<li><a href="page-{{geonameId}}" class="geoname">{{toponymName}}</a></li>'
    };

    var indexList;

    var addPage = function (pageId, title, callback) {
        var geonameId = pageId.split('-')[1];
        var url = Mustache.to_html(templates.childrenUrl, {
            geonameId: geonameId
        });
        log('adding page:', pageId, geonameId, url);
        $.getJSON(url, function (data) {
            $('#pages').append(Mustache.to_html(templates.section, {
                geonameId: geonameId,
                title: title
            }));
            callback();
        });
    };

    var showPage = function (href, title) {
        log('showing page:', href, title);
        $('section.page').hide();
        var page = $('#pages > #' + href);
        if (page.length) {
            log('page already fetched, showing');
            page.show();
        } else {
            addPage(href, title, function () {
                log('showing:', title, href);
                $('#pages > #' + href).fadeIn();
            });
        }
    };

    var updateIndex = function () {
        log('updateIndex');
        var url = Mustache.to_html(templates.childrenUrl, {
            geonameId: config.rootId
        });
        $.getJSON(url, function (data) {
            if (data.totalResultsCount) {
                log('fetched ' + data.totalResultsCount + ' geonames');
                var geonames = data.geonames;
                var len = geonames.length;
                indexList.hide();
                for (var i = 0; i < len; ++i) {
                    indexList.append(Mustache.to_html(templates.geoname, geonames[i]));
                }
                indexList.fadeIn();
            } else {
                log('Did not find any places.');
            }

        });
    };

    var geo = {};

    geo.init = function () {
        log('geo.init');
        indexList = $('#page-index ul');
        updateIndex();

        $('#pages').click(function (e) {
            var target = $(e.target);
            if (target.is('a.geoname')) {
                e.preventDefault();
                showPage(target.attr('href'), target.text());
            }
        });

    };
    // Expose the namespace.
    window.geo = geo;
}(jQuery));
