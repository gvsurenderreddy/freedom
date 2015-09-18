/* globals jasmine,beforeEach,expect,it */
/* jslint node:true */

var testUtil = require('../../util');

module.exports = function (provider, setup) {
  'use strict';
  var xhr, dispatch;
  beforeEach(function () {
    setup();
    dispatch = testUtil.createTestPort('msgs');
    xhr = new provider.provider({ provider: { onClose: function(i, f) {}} },
                                dispatch.onMessage.bind(dispatch));
  });

  it("calling open with async=false returns an error", function(done) {
    xhr.open("GET", "https://api.github.com/", false).then(function(ret) {
      //console.log(ret);
    }, function(err) {
      expect(err.errcode).toEqual("InvalidAccessError");
      done();
    });
  });

  it("calling open with async=undefined is all good", function(done) {
    xhr.open("GET", "https://api.github.com/").then(function(ret) {
      expect(ret).not.toBeDefined();
      done();
    }, function(err) {
      //console.log(err);
    });
  });

  it("getReadyState properly returns state", function(done) {
    xhr.getReadyState().then(function(readyState) {
      expect([0, 1]).toContain(readyState);  // xhr2 allows unsent or open
      xhr.open("GET", "https://api.github.com/", true);
      return xhr.getReadyState();
    }).then(function(readyState) {
      expect(readyState).toEqual(1);
      xhr.send(null);
      return xhr.getReadyState();
    }).then(function(readyState) {
      // Can be 1 (opened), 2 (headers_received), 3 (loading), or 4 (done)
      expect(readyState).toBeGreaterThan(0);
      done();
    });
  });

  // Note, test needs to GET a domain with CORS enabled or test will fail
  it("can GET github.com", function(done) {
    var response;
    dispatch.gotMessageAsync("onload", [], function(e) {
      // @todo not implemented in node polyfill yet
      if (typeof window !== 'undefined') {
        expect(e.lengthComputable).toEqual(jasmine.any(Boolean));
      }
      expect(e.loaded).toEqual(jasmine.any(Number));
      expect(e.total).toEqual(jasmine.any(Number));
      xhr.getReadyState().then(function(readyState) {
        expect(readyState).toEqual(4); // Done
        return xhr.getStatus();
      }).then(function(status) {
        expect(status).toEqual(200);
        return xhr.getStatusText();
      }).then(function(statusText) {
        expect(statusText).toEqual("OK");
        return xhr.getResponseText();
      }).then(function(respText) {
        response = respText;
        expect(respText).toEqual(jasmine.any(String));
        expect(respText.length).toBeGreaterThan(1);
        return xhr.getResponse();
      }).then(function(resp) {
        expect(resp.string).toEqual(response);
        return xhr.getResponseURL();
      }).then(function(url) {
        // @todo not implemented in node polyfill yet
        if (typeof window !== 'undefined') {
          expect(url).toEqual("https://api.github.com/");
        }
        done();
      });
    });
    xhr.open("GET", "https://api.github.com/", true);
    xhr.send(null);
  });

  // Skip this test unless we are in a chrome app/extension.
  // TODO: Enable for Firefox (should "just work") and node (requires patching
  // the xhr2 module to enable restricted headers.)
  if (chrome && chrome.webViewRequest) {
    // Try a domain-fronted GET request to a test server run by Tor.
    it("domain fronting", function(done) {
      var response;
      dispatch.gotMessageAsync("onload", [], function(e) {
        // @todo not implemented in node polyfill yet
        if (typeof window !== 'undefined') {
          expect(e.lengthComputable).toEqual(jasmine.any(Boolean));
        }
        expect(e.loaded).toEqual(jasmine.any(Number));
        expect(e.total).toEqual(jasmine.any(Number));
        xhr.getReadyState().then(function(readyState) {
          expect(readyState).toEqual(4); // Done
          return xhr.getStatus();
        }).then(function(status) {
          expect(status).toEqual(200);
          return xhr.getStatusText();
        }).then(function(statusText) {
          expect(statusText).toEqual("OK");
          return xhr.getResponseText();
        }).then(function(respText) {
          response = respText;
          expect(respText).toMatch(/I.m just a happy little web server.\n/);
          expect(respText.length).toBeGreaterThan(1);
          return xhr.getResponse();
        }).then(function(resp) {
          expect(resp.string).toEqual(response);
          return xhr.getResponseURL();
        }).then(function(url) {
          // @todo not implemented in node polyfill yet
          if (typeof window !== 'undefined') {
            expect(url).toEqual("https://ajax.aspnetcdn.com/");
          }
          done();
        });
      });
      // This is a domain-fronting test server operated by Tor: see
      // https://trac.torproject.org/projects/tor/wiki/doc/meek#MicrosoftAzure
      xhr.open("GET", "https://ajax.aspnetcdn.com/", true);
      xhr.setRequestHeader("Host", "az786092.vo.msecnd.net");
      xhr.send(null);
    });
  }

  // @todo not implemented in node polyfill yet
  if (typeof window !== 'undefined') {
    it("triggers upload events", function(done) {
      dispatch.gotMessageAsync("onuploadloadstart", [], function(e) {
        expect(e.lengthComputable).toEqual(jasmine.any(Boolean));
        expect(e.loaded).toEqual(jasmine.any(Number));
        expect(e.total).toEqual(jasmine.any(Number));
        done();
      });
      xhr.open("POST", "http://pastebin.com/api/api_post.php", true);
      xhr.send({ string: "POST" });
    });
  }

};
