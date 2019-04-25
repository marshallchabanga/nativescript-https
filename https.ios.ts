//

import * as application from 'tns-core-modules/application'
import {HttpRequestOptions, Headers, HttpResponse} from 'tns-core-modules/http'
import {isDefined, isNullOrUndefined, isObject} from 'tns-core-modules/utils/types'
import * as Https from './https.common'
import {HttpsRequestObject, HttpsResponse} from "./https.common";


interface Ipolicies {
    def: AFSecurityPolicy
    secured: boolean
    secure?: AFSecurityPolicy
}

let policies: Ipolicies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};
policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;

export function enableSSLPinning(options: Https.HttpsSSLPinningOptions) {
    // console.log('options', options)
    if (!policies.secure) {
        policies.secure = AFSecurityPolicy.policyWithPinningMode(AFSSLPinningMode.PublicKey);
        let allowInvalidCertificates = (isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
        policies.secure.allowInvalidCertificates = allowInvalidCertificates;
        let validatesDomainName = (isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
        policies.secure.validatesDomainName = validatesDomainName;
        let data = NSData.dataWithContentsOfFile(options.certificate);

        policies.secure.pinnedCertificates = NSSet.setWithObject(data)
    }
    policies.secured = true;
    console.log('nativescript-https > Enabled SSL pinning')
}

export function disableSSLPinning() {
    policies.secured = false;
    console.log('nativescript-https > Disabled SSL pinning')
}

export function request(options: Https.HttpsRequestOptions): Promise<Https.HttpsResponse> {
    console.log("nativescript-https: (request) Request: ", options);
    return new Promise(function (resolve, reject) {
        try {

            let url;
            const params = <HttpsRequestObject>options.params;
            if (params) {

                url = NSURLComponents.componentsWithString(options.url);

                console.log(url);
                let queryItems = NSMutableArray.new();

                for (const paramsKey in params) {
                    const value = params[paramsKey];
                    const queryItem = NSURLQueryItem.queryItemWithNameValue(paramsKey, String(value));
                    queryItems.addObject(queryItem);
                }
                url.queryItems = NSArray.arrayWithArray(queryItems);
                url = url.URL;

            } else {
                url = NSURL.URLWithString(options.url);
            }

            let request = NSMutableURLRequest.requestWithURL(url);

            request.HTTPMethod = options.method;

            const headers = options.headers;
            if (headers) {
                Object.keys(headers).forEach(function (key) {
                    request.setValueForHTTPHeaderField(headers[key] as any, key);
                });
            }

            if (options.body) {
                const body = options && options.body ? options.body : null;
                let jsonString = NSString.stringWithString(JSON.stringify(body));
                request.HTTPBody = jsonString.dataUsingEncoding(NSUTF8StringEncoding);
            }

            let manager = AFHTTPSessionManager.manager();

            manager.requestSerializer.allowsCellularAccess = true;
            manager.securityPolicy = (policies.secured == true) ? policies.secure : policies.def;
            manager.requestSerializer.timeoutInterval = 60;
            console.log(`IOS_Timeout_Connect 60000`);
            console.log("nativescript-https: (request) AF Send: ", request);

            manager.session.dataTaskWithRequestCompletionHandler(request, function (data: NSData, response: NSHTTPURLResponse, error: NSError) {
                if (error) {
                    console.log("nativescript-https: (request) AF Send Error", error);
                    reject(new Error(error.localizedDescription));
                } else {

                    let content = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding).toString();

                    console.log("nativescript-https: (request) AF Send Response", content);

                    console.log("data", data.length);
                    console.log("data", data.description);

                    try {
                        content = JSON.parse(content);
                    } catch (e) {
                        console.log("nativescript-https: Response JSON Parse Error", e, e.stack, content);
                    }

                    resolve(<HttpsResponse>{
                        content: content,
                        statusCode: response.statusCode
                    });
                }
            }).resume();
        } catch (error) {
            console.log("nativescript-https: (request) AF Error", error, error.stack);
            reject(error)
        }
    });
}

export * from './https.common'












