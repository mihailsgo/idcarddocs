/*! This is eparaksts-hwcrypto.js 2.0.0 generated on 2016-12-14 */
/* DO NOT EDIT (use src/eparaksts-hwcrypto.js) */
var eparakstshwcrypto = function eparakstshwcrypto() {
    "use strict";
    var consoleDebug = false;
    var _debug = function(x) {
        if (consoleDebug) console.log(x);
    };
    _debug("eparaksts-hwcrypto.js activated");
    window.addEventListener = window.addEventListener || window.attachEvent;
    function hasPluginFor(mime) {
        return navigator.mimeTypes && mime in navigator.mimeTypes;
    }
    function hasExtensionFor(cls) {
        return typeof window[cls] === "function";
    }
    function _hex2array(str) {
        if (typeof str == "string") {
            var len = Math.floor(str.length / 2);
            var ret = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                ret[i] = parseInt(str.substr(i * 2, 2), 16);
            }
            return ret;
        }
    }
    function _array2hex(args) {
        var ret = "";
        for (var i = 0; i < args.length; i++) ret += (args[i] < 16 ? "0" : "") + args[i].toString(16);
        return ret.toLowerCase();
    }
    function _mimeid(mime) {
        return "hwc" + mime.replace("/", "").replace("-", "");
    }
    function loadPluginFor(mime) {
        var element = _mimeid(mime);
        if (document.getElementById(element)) {
            _debug("Plugin element already loaded");
            return document.getElementById(element);
        }
        _debug("Loading plugin for " + mime + " into " + element);
        var objectTag = '<object id="' + element + '" type="' + mime + '" style="width: 1px; height: 1px; position: absolute; visibility: hidden;"></object>';
        var div = document.createElement("div");
        div.setAttribute("id", "pluginLocation" + element);
        document.body.appendChild(div);
        document.getElementById("pluginLocation" + element).innerHTML = objectTag;
        return document.getElementById(element);
    }
    var eparaksts_mime = "application/x-eparaksts";
    var eparaksts_chrome = "eParakstsTokenSigning";
    var USER_CANCEL = "user_cancel";
    var NO_CERTIFICATES = "no_certificates";
    var INVALID_ARGUMENT = "invalid_argument";
    var TECHNICAL_ERROR = "technical_error";
    var NO_IMPLEMENTATION = "no_implementation";
    var NOT_ALLOWED = "not_allowed";
    function probe() {
        var msg = "probe() detected ";
        if (hasExtensionFor(eparaksts_chrome)) {
            _debug(msg + eparaksts_chrome);
        }
        if (hasPluginFor(eparaksts_mime)) {
            _debug(msg + eparaksts_mime);
        }
    }
    window.addEventListener("load", function(event) {
        probe();
    });
    function DigiDocPlugin() {
        this._name = "NPAPI/BHO for application/x-eparaksts";
        var p = loadPluginFor(eparaksts_mime);
        var certificate_ids = {};
        function code2str(err) {
            _debug("Error: " + err + " with: " + p.errorMessage);
            switch (parseInt(err)) {
              case 1:
                return USER_CANCEL;

              case 2:
                return NO_CERTIFICATES;

              case 17:
                return INVALID_ARGUMENT;

              case 19:
                return NOT_ALLOWED;

              default:
                _debug("Unknown error: " + err + " with: " + p.errorMessage);
                return TECHNICAL_ERROR;
            }
        }
        function code2err(err) {
            return new Error(code2str(err));
        }
        this.check = function() {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    resolve(typeof p.version !== "undefined");
                }, 0);
            });
        };
        this.getVersion = function() {
            return new Promise(function(resolve, reject) {
                var v = p.version;
                resolve(v);
            });
        };
        this.getCertificate = function(options) {
            var operation = options.operation || "sign";
            var language = options.lang || "en";
            p.pluginLanguage = language;
            return new Promise(function(resolve, reject) {
                try {
                    var v;
                    if (typeof p.getCertificateWithOperation !== "undefined") {
                        v = p.getCertificateWithOperation(operation);
                    } else {
                        v = p.getCertificate();
                    }
                    if (parseInt(p.errorCode) !== 0) {
                        reject(code2err(p.errorCode));
                    } else {
                        certificate_ids[v.cert] = v.id;
                        resolve({
                            hex: v.cert
                        });
                    }
                } catch (ex) {
                    _debug(ex);
                    reject(code2err(p.errorCode));
                }
            });
        };
        this.sign = function(cert, hash, options) {
            return new Promise(function(resolve, reject) {
                var cid = certificate_ids[cert.hex];
                if (cid) {
                    try {
                        var language = options.lang || "en";
                        var operation = options.operation || "sign";
                        var v;
                        if (typeof p.signWithOperation !== "undefined") {
                            v = p.signWithOperation(cid, hash.hex, language, operation);
                        } else {
                            v = p.sign(cid, hash.hex, language);
                        }
                        resolve({
                            hex: v
                        });
                    } catch (ex) {
                        _debug(JSON.stringify(ex));
                        reject(code2err(p.errorCode));
                    }
                } else {
                    _debug("invalid certificate: " + cert);
                    reject(new Error(INVALID_ARGUMENT));
                }
            });
        };
    }
    function DigiDocExtension() {
        this._name = "Chrome native messaging extension";
        var p = null;
        this.check = function() {
            return new Promise(function(resolve, reject) {
                if (!hasExtensionFor(eparaksts_chrome)) {
                    return resolve(false);
                }
                p = new window[eparaksts_chrome]();
                if (p) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        };
        this.getVersion = function() {
            return p.getVersion();
        };
        this.getCertificate = function(options) {
            return p.getCertificate(options);
        };
        this.sign = function(cert, hash, options) {
            return p.sign(cert, hash, options);
        };
    }
    function NoBackend() {
        this._name = "No implementation";
        this.check = function() {
            return new Promise(function(resolve, reject) {
                resolve(true);
            });
        };
        this.getVersion = function() {
            return Promise.reject(new Error(NO_IMPLEMENTATION));
        };
        this.getCertificate = function() {
            return Promise.reject(new Error(NO_IMPLEMENTATION));
        };
        this.sign = function() {
            return Promise.reject(new Error(NO_IMPLEMENTATION));
        };
    }
    var _backend = null;
    var fields = {};
    function _testAndUse(Backend) {
        return new Promise(function(resolve, reject) {
            var b = new Backend();
            b.check().then(function(isLoaded) {
                if (isLoaded) {
                    _debug("Using backend: " + b._name);
                    _backend = b;
                    resolve(true);
                } else {
                    _debug(b._name + " check() failed");
                    resolve(false);
                }
            });
        });
    }
    function _autodetect(force) {
        return new Promise(function(resolve, reject) {
            _debug("Autodetecting best backend");
            if (typeof force === "undefined") {
                force = false;
            }
            if (_backend !== null && !force) {
                return resolve(true);
            }
            function tryDigiDocPlugin() {
                _testAndUse(DigiDocPlugin).then(function(result) {
                    if (result) {
                        resolve(true);
                    } else {
                        resolve(_testAndUse(NoBackend));
                    }
                });
            }
            if (navigator.userAgent.indexOf("MSIE") != -1 || navigator.userAgent.indexOf("Trident") != -1) {
                _debug("Assuming IE BHO, testing");
                return tryDigiDocPlugin();
            }
            if (navigator.userAgent.indexOf("Chrome") != -1 && hasExtensionFor(eparaksts_chrome)) {
                _testAndUse(DigiDocExtension).then(function(result) {
                    if (result) {
                        resolve(true);
                    } else {
                        tryDigiDocPlugin();
                    }
                });
                return;
            }
            if (hasPluginFor(eparaksts_mime)) {
                return tryDigiDocPlugin();
            }
            resolve(_testAndUse(NoBackend));
        });
    }
    fields.use = function(backend) {
        return new Promise(function(resolve, reject) {
            if (typeof backend === "undefined" || backend === "auto") {
                _autodetect().then(function(result) {
                    resolve(result);
                });
            } else {
                if (backend === "chrome") {
                    resolve(_testAndUse(DigiDocExtension));
                } else if (backend === "npapi") {
                    resolve(_testAndUse(DigiDocPlugin));
                } else {
                    resolve(false);
                }
            }
        });
    };
    fields.getBackendInfo = function() {
        return new Promise(function(resolve, reject) {
            _autodetect().then(function(result) {
                _backend.getVersion().then(function(version) {
                    resolve({
                        type: _backend._name,
                        version: version
                    });
                }, function(error) {
                    if (navigator.userAgent.indexOf("Chrome") != -1 && hasExtensionFor(eparaksts_chrome)) {
                        resolve({
                            type: "FAILING_CHROME"
                        });
                    } else if (hasPluginFor(eparaksts_mime)) {
                        resolve({
                            type: "FAILING_NPAPI"
                        });
                    } else {
                        resolve({
                            type: "NO_IMPLEMENTATION"
                        });
                    }
                });
            });
        });
    };
    fields.getBackendType = function() {
        return new Promise(function(resolve, reject) {
            _autodetect().then(function(result) {
                _backend.getVersion().then(function(version) {
                    resolve(_backend._name);
                }, function(error) {
                    if (navigator.userAgent.indexOf("Chrome") != -1 && hasExtensionFor(eparaksts_chrome)) {
                        resolve("FAILING_CHROME");
                    } else if (hasPluginFor(eparaksts_mime)) {
                        resolve("FAILING_NPAPI");
                    } else {
                        resolve("NO_IMPLEMENTATION");
                    }
                });
            });
        });
    };
    fields.setConsoleDebug = function(x) {
        consoleDebug = x;
    };
    fields.debug = function() {
        return new Promise(function(resolve, reject) {
            var hwversion = "eparakstshwcrypto 2.0.0";
            _autodetect().then(function(result) {
                _backend.getVersion().then(function(version) {
                    resolve(hwversion + " with " + _backend._name + " " + version);
                }, function(error) {
                    resolve(hwversion + " with failing backend " + _backend._name);
                });
            });
        });
    };
    fields.getCertificate = function(options) {
        if (typeof options !== "object") {
            _debug("getCertificate options parameter must be an object");
            return Promise.reject(new Error(INVALID_ARGUMENT));
        }
        if (options && !options.operation) {
            options.operation = "sign";
        }
        if (options && !options.lang) {
            options.lang = "en";
        }
        return _autodetect().then(function(result) {
            if (location.protocol !== "https:" && location.protocol !== "file:") {
                return Promise.reject(new Error(NOT_ALLOWED));
            }
            return _backend.getCertificate(options).then(function(certificate) {
                if (certificate.hex && !certificate.encoded) certificate.encoded = _hex2array(certificate.hex);
                return certificate;
            });
        });
    };
    fields.sign = function(cert, hash, options) {
        if (arguments.length < 2) return Promise.reject(new Error(INVALID_ARGUMENT));
        if (options && !options.operation) {
            options.operation = "sign";
        }
        if (options && !options.lang) {
            options.lang = "en";
        }
        if (!hash.type || !hash.value && !hash.hex) return Promise.reject(new Error(INVALID_ARGUMENT));
        if (hash.hex && !hash.value) {
            _debug("DEPRECATED: hash.hex as argument to sign() is deprecated, use hash.value instead");
            hash.value = _hex2array(hash.hex);
        }
        if (hash.value && !hash.hex) hash.hex = _array2hex(hash.value);
        return _autodetect().then(function(result) {
            if (location.protocol !== "https:" && location.protocol !== "file:") {
                return Promise.reject(new Error(NOT_ALLOWED));
            }
            return _backend.sign(cert, hash, options).then(function(signature) {
                if (signature.hex && !signature.value) signature.value = _hex2array(signature.hex);
                return signature;
            });
        });
    };
    fields.NO_IMPLEMENTATION = NO_IMPLEMENTATION;
    fields.USER_CANCEL = USER_CANCEL;
    fields.NOT_ALLOWED = NOT_ALLOWED;
    fields.NO_CERTIFICATES = NO_CERTIFICATES;
    fields.TECHNICAL_ERROR = TECHNICAL_ERROR;
    fields.INVALID_ARGUMENT = INVALID_ARGUMENT;
    return fields;
}();// FIXME: origin unknown
if (!window.atob) {
  var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var table = tableStr.split("");

  window.atob = function (base64) {
    if (/(=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
    base64 = base64.replace(/=/g, "");
    var n = base64.length & 3;
    if (n === 1) throw new Error("String contains an invalid character");
    for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
      var a = tableStr.indexOf(base64[j++] || "A"), b = tableStr.indexOf(base64[j++] || "A");
      var c = tableStr.indexOf(base64[j++] || "A"), d = tableStr.indexOf(base64[j++] || "A");
      if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
      bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
      bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
      bin[bin.length] = ((c << 6) | d) & 255;
    };
    return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
  };

  window.btoa = function (bin) {
    for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
      var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
      if ((a | b | c) > 255) throw new Error("String contains an invalid character");
      base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
                              (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
                              (isNaN(b + c) ? "=" : table[c & 63]);
    }
    return base64.join("");
  };

}

function hexToBase64(str) {
  return btoa(String.fromCharCode.apply(null,
    str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
  );
}

function hexToPem(s) {
   var b = hexToBase64(s);
   var pem = b.match(/.{1,64}/g).join("\n");
   return "-----BEGIN CERTIFICATE-----\n" + pem + "\n-----END CERTIFICATE-----"; 
}
