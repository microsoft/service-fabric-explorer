
const config = require("./appsettings.json");
const axios = require('axios');
const fs = require("fs");
const https = require("https");
const express = require('express');
const path = require('path');
//get flags
let recordRequest = process.argv.includes("-r");
let replayRequest = process.argv.includes("-p");

//if PFX location provided for cluster
httpsAgent = null;
if(config.TargetCluster.PFXLocation){
    httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        pfx: fs.readFileSync(config.TargetCluster.PFXLocation),
        passphrase: config.TargetCluster.PFXPassPhrase
      })
}

const reformatUrl = (req) => {
    const copy = JSON.parse(JSON.stringify(req.query)); //make a deep copy to remove _cacheToken since it isnt necessary
    delete copy._cacheToken;
    const params =  Object.keys(copy).sort().map(key => `${key}=${copy[key]}` ).join("&")
    return config.recordFileBase +  `${req.method.toLowerCase()}${req.path}${params}.json`.split('/').join('-');
}

const writeRequest = (req, resp) => {
    //need to delete these properties to remove circular dependency 
    delete resp.request;
    delete resp.config;
    const replacedFile = reformatUrl(req);

    //confirm base folder exists
    if (!fs.existsSync(config.recordFileBase)){
        fs.mkdirSync(config.recordFileBase);
    }
    fs.writeFileSync(replacedFile, JSON.stringify(resp, null, 4));
}

const loadRequest = (req) => {
    return JSON.parse(fs.readFileSync(reformatUrl(req)));
}

const checkFile = (req) => {
    return fs.existsSync(reformatUrl(req))
}

const proxyRequest = async (req) => {
    const url = req.url;
    const headers = req.headers;
    const data = req.body;
    const method = req.method.toLowerCase();
    let conf = {
        method,
        url: `${config.TargetCluster.Url}${url}`,
        data, 
        headers
    }

    if(httpsAgent){
        conf.httpsAgent = httpsAgent;
    }

    try {
        res = await axios(conf)
        return res;
    }
    //handle axios throwing an error(like 400 level issues) which should just be passed through
    catch(e){
        return e.response;
    }
}

const app = express()
const port = 3000

//need to be set to accept certs from secure clusters when certs cant be trusted
//this is mainly for SFRP clusters to test against.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.use(express.static(path.join('..', 'Sfx', 'wwwroot')))
app.use(express.json())
app.all('/*', async (req, res) => {
    let resp = null;

    if(replayRequest && checkFile(req)){
        resp = loadRequest(req);
        process.stdout.write("Playback: ");
    }else{
        resp = await proxyRequest(req);
    }

    console.log(`${req.url} ${req.method}`);

    res.status(resp.status);
    res.header(resp.headers);
    res.send(resp.data);

    if(recordRequest){
        writeRequest(req, resp);
    }

})

console.log(`Target cluster url : ${config.TargetCluster.Url}`);

if(httpsAgent){
    console.log(`Certificate was Provided \n\t location: D:test ${config.TargetCluster.PFXLocation}`);
}
app.listen(port, () => console.log(`proxy listening on port ${port}`))