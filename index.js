#!/usr/bin/env node

'use strict;'
var debug = false;

var fs = require('fs');
var request = require('request');
var xmlparse = require('xml-parser');
var inspect = require('util').inspect;

var opt = require('node-getopt').create([
    ['h', 'help', 'Print this help'],
    ['d', 'debug', 'Debug mode. Print more messages'],
    ['n', 'dry-run', 'Simulated - Does not actually send purge command'],
    ['w', 'wait=ARG', 'Add a delay between requests in ms'],
]).bindHelp();

var args = opt.parse(process.argv.slice(2));

if (args["options"]["debug"])
    debug = true;

if (args["options"]["wait"] == undefined)
	args["options"]["wait"] = 0;

if (debug)
	console.log(args);

//Do the purge
function DoPurge(origin, urls) {
    console.log('Remaining:', urls.length);
    if (urls.length == 0) {
        console.log('Completed Purge', origin);
        return;
    }

    if (args["options"]["dry-run"]) {
        var url = urls.pop();
        setTimeout(function() {
            console.log('Purge Completed URL:', url, 'PURGED');
            DoPurge(origin, urls);
        }, args["options"]["wait"]);
        return;
    }

    var url = urls.pop();
    request({
        uri : url,
        method: "PURGE",
        timeout: 10000
    }, function(err, res, body) {
        if (err) {
            console.log('Purge Failed URL:', url, 'Error:', err);
        } else {
            console.log('Purge Completed URL:', url, 'PURGED:', res.statusCode);
        }
        if (args["options"]["wait"] > 0) {
            setTimeout(function() { DoPurge(origin, urls); }, args["options"]["wait"]);
        } else {
            DoPurge(origin, urls);
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

for(var i=0;i<args['argv'].length;i++) {
    var url = args['argv'][i];
    console.log("Trying:", url);

    //Covers both http and https
    if (url.startsWith('http')) {
        console.log('Fetching:', url);
        request(url, function (error, res, body) {
            if (error) {
                console.log('Failed to get:', url);
            } else {
                var urls = ParseSiteMap(url, body);
                DoPurge(url, urls);
            }
        });
    } else {
        console.log('Reading:', url);
        try {
            var body = fs.readFileSync(url, 'utf8');
            ParseSiteMap(url, body);
        } catch(err) {
            console.log('Cannot open file:', url, ' Error:', err);
        }
    }
}


