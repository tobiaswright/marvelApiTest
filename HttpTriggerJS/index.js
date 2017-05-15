"use strict";

const request = require('request');
const crypto = require('crypto');

const publicKey = process.env["PUB_KEY"];
const privateKey = process.env["PRI_KEY"];

const url = "https://gateway.marvel.com/v1/public/";

let createHash = (ts) => {
    return crypto.createHash('md5').update(ts + privateKey + publicKey).digest('hex');
}

let marvelCallOpts = (opts) => {
    const ts = + new Date();
    const hash = createHash(ts);

    let callOpts = {
        qs: {
            ts: ts,
            apikey: publicKey,
            hash: hash
        },
        url: url + opts.call
    };

    if (opts.val) {
        callOpts.qs[opts.param] = opts.val
    }

    return callOpts;
}

let getID = () => {
    let opts = marvelCallOpts({call: "characters", val: "Hulk", param:"name"});

    let promise = new Promise((resolve, reject) => {
        request(opts, function (err, res, body) {
            let data = JSON.parse(body)
            resolve(data.data.results[0].id)
        });
    });
    
    return promise
};

let getEvents = (id) => {
    let call = "characters/" + id + "/events";
    let opts = marvelCallOpts({call: call});

    let promise = new Promise((resolve, reject) => {
        request(opts, function (err, res, body) {
            let data = JSON.parse(body);
            resolve(data.data.results)
        });
    });
    
    return promise
};

let returnEvents = (data, context) => {
    let events = [];
    
    data.forEach(function (value) {
        events.push(value.title)
    });

    let promise = new Promise((resolve, reject) => {
        resolve(events)
    });

    return promise
}

module.exports = function (context, req) {
    getID()
    .then(getEvents)
    .then(returnEvents)
    .then(events => {
        context.res = {
        // status: 200, /*s Defaults to 200 */
            body: events
        };

        context.done();
    })
}; 