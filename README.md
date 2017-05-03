
# nginx-cache-purge

* Gets a list of urls from one or more sitemaps.
* Send a PURGE request to list url's found

# Install / Running

## From npm

npm install -g nginx-cache-purge

## Run from git clone

git clone https://guthub.com/mistralol/nginx-cache-purge
cd nginx-cache-purge && npm install
node index.js http://www.example.com/sitemap.xml

## Server configuration

In order for this to work properly nginx must have the proxy_cache_purge configured correctly. If it does not then this program will not be able to purge the cache. Typical system like debian / ubuntu have this by default when using the nginx-extras package. It has not currently been tested with any other type of server.

# Additional ideas / roadmap / todo list

* Needs support for more input formats
  1. stdin
  2. json format
  3. other xml formats
  4. Read a flat text format
* Needs limited pipelined request support aka run multiple concurrent requests
* Optional send a GET (multiple?) to each url to get nginx to cache it again
* Stats etc...
* Better error reporting

For bugs / ideas please use the issue list on github

# Credits

Original Author: James Stevenson
E-Mail: james@stev.org
BLOG: https://www.stev.org


