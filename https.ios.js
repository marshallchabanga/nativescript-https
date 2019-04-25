"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("tns-core-modules/utils/types");
var policies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};
policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;
function enableSSLPinning(options) {
    if (!policies.secure) {
        policies.secure = AFSecurityPolicy.policyWithPinningMode(1);
        var allowInvalidCertificates = (types_1.isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
        policies.secure.allowInvalidCertificates = allowInvalidCertificates;
        var validatesDomainName = (types_1.isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
        policies.secure.validatesDomainName = validatesDomainName;
        var data = NSData.dataWithContentsOfFile(options.certificate);
        policies.secure.pinnedCertificates = NSSet.setWithObject(data);
    }
    policies.secured = true;
    console.log('nativescript-https > Enabled SSL pinning');
}
exports.enableSSLPinning = enableSSLPinning;
function disableSSLPinning() {
    policies.secured = false;
    console.log('nativescript-https > Disabled SSL pinning');
}
exports.disableSSLPinning = disableSSLPinning;
function request(options) {
    console.log("nativescript-https: (request) Request: ", options);
    return new Promise(function (resolve, reject) {
        try {
            var url = void 0;
            var params = options.params;
            if (params) {
                url = NSURLComponents.componentsWithString(options.url);
                console.log(url);
                var queryItems = NSMutableArray.new();
                for (var paramsKey in params) {
                    var value = params[paramsKey];
                    var queryItem = NSURLQueryItem.queryItemWithNameValue(paramsKey, String(value));
                    queryItems.addObject(queryItem);
                }
                url.queryItems = NSArray.arrayWithArray(queryItems);
                url = url.URL;
            }
            else {
                url = NSURL.URLWithString(options.url);
            }
            var request_1 = NSMutableURLRequest.requestWithURL(url);
            request_1.HTTPMethod = options.method;
            var headers_1 = options.headers;
            if (headers_1) {
                Object.keys(headers_1).forEach(function (key) {
                    request_1.setValueForHTTPHeaderField(headers_1[key], key);
                });
            }
            if (options.body) {
                var body = options && options.body ? options.body : null;
                var jsonString = NSString.stringWithString(JSON.stringify(body));
                request_1.HTTPBody = jsonString.dataUsingEncoding(NSUTF8StringEncoding);
            }
            var manager = AFHTTPSessionManager.manager();
            manager.requestSerializer.allowsCellularAccess = true;
            manager.securityPolicy = (policies.secured == true) ? policies.secure : policies.def;
            manager.requestSerializer.timeoutInterval = 60;
            console.log("IOS_Timeout_Connect 60000");
            console.log("nativescript-https: (request) AF Send: ", request_1);
            manager.session.dataTaskWithRequestCompletionHandler(request_1, function (data, response, error) {
                if (error) {
                    console.log("nativescript-https: (request) AF Send Error", error);
                    reject(new Error(error.localizedDescription));
                }
                else {
                    var content = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding).toString();
                    console.log("nativescript-https: (request) AF Send Response", content);
                    console.log("data", data.length);
                    console.log("data", data.description);
                    try {
                        content = JSON.parse(content);
                    }
                    catch (e) {
                        console.log("nativescript-https: Response JSON Parse Error", e, e.stack, content);
                    }
                    resolve({
                        content: content,
                        statusCode: response.statusCode
                    });
                }
            }).resume();
        }
        catch (error) {
            console.log("nativescript-https: (request) AF Error", error, error.stack);
            reject(error);
        }
    });
}
exports.request = request;
//# sourceMappingURL=https.ios.js.map