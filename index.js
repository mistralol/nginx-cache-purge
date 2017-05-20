#!/usr/bin/env node

'use strict;'

var fs = require('fs');
var request = require('request');
var xmlparse = require('xml-parser');
var inspect = require('util').inspect;

var opt = require('node-getopt').create([
    ['h', 'help', 'Print this help'],
    ['d', 'debug', 'Debug mode. Print more messages'],
    ['e', 'extra=ARG+', 'Load URLs from text file (plain format)'],
    ['g', 'get', 'Do a GET after PURGE'],
    ['p', 'purge', 'PURGE sitemap before GET'],
    ['w', 'wait=ARG', 'Add a delay between requests in ms']
]).bindHelp();

var args = opt.parse(process.argv.slice(2));

function IsDebug() {
    if (args["options"]["debug"] == undefined)
        return false;
    if (args["options"]["debug"])
        return true;
    return false;
}

if (args["options"]["wait"] == undefined)
	args["options"]["wait"] = 0;

if (IsDebug()) {
	console.log(args);
}

//Do the purge
function DoPurge(origin, urls) {
    if (urls.length == 0) {
        console.log('Completed Purge', origin);
        return;
    }

    var url = urls.pop();
    if (url == '') {
        DoPurge(origin, urls);
        return;
    }
    request({
        uri : url,
        method: "PURGE",
        timeout: 10000
    }, function(err, res, body) {
        if (err) {
            console.log('Purge Failed URL:', url, 'Error:', err);
        } else {
            if (IsDebug()) {
                console.log('Purge Completed URL:', url, 'PURGED:', res.statusCode);
            }
        }

        function DoNext() {
            if (args["options"]["wait"] > 0) {
                setTimeout(function() { DoPurge(origin, urls); }, args["options"]["wait"]);
            } else {
                DoPurge(origin, urls);
            }
        }

        if (args["options"]["get"] != undefined) {
            request({
                uri : url,
                method: "GET",
                timeout: 10000
            }, function(err, res, body) {
                if (err) {
                    console.log("GET Failed URL:", url, 'Error:', err);
                }
                DoNext();
            });
        } else {
            DoNext();
        }

    });
}


//Convert xml to list of url's
function ParseSiteMap(origin, data) {
    var obj = xmlparse(data);
    var urls = [];
    var root = obj['root'];
    var urlset = root['children'];
    for(var i=0;i<urlset.length;i++) {
        var info = urlset[i];
        urls.push(info['children'][0]['content']);
    }
    return urls;
}

function DoSiteMap(url) {
    console.log('Fetching:', url);
    request(url, function (error, res, body) {
        if (error) {
            console.log('Failed to get:', url);
        } else {
            var urls = ParseSiteMap(url, body);
            DoPurge(url, urls);
        }
    });
}

if (args["options"]["extra"]) {
    for(var i=0;i<args["options"]["extra"].length;i++) {
        var text = fs.readFileSync(args["options"]["extra"][i]).toString('utf-8');;
        var lines = text.split("\n");
        DoPurge(args["options"]["extra"][i], lines);
    }
}

for(var i=0;i<args['argv'].length;i++) {
    var url = args['argv'][i];
    console.log("Trying:", url);

    //Covers both http and https
    if (url.startsWith('http')) {
        if (args["options"]["purge"] != undefined) {
            if (IsDebug()) {
                console.log("PURGING Sitemap:", url);
            }
            request({
                uri : url,
                method: "PURGE",
                timeout: 10000
            }, function(err, res, body) {
                if (err) {
                    console.log("PURGE Failed For Sitemap:", url, " Error:", err);
                }
                DoSiteMap(url);
            });
        } else {
            DoSiteMap(url);
        }

    } else {
        console.log('Reading:', url);
        try {
            var body = fs.readFileSync(url, 'utf8');
            var urls = ParseSiteMap(url, body);
            DoPurge(url, urls);
        } catch(err) {
            console.log('Cannot open file:', url, ' Error:', err);
        }
    }
}


