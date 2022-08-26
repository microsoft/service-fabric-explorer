
const axios = require('axios');
const { promises: fs } = require("fs");
const fsBase = require("fs");

const https = require("https");
const express = require('express');
const path = require('path');

let config;
try {
    config = require("./localsettings.json");
    console.log("config loaded from localSettings")
} catch {
    config = require("./appsettings.json");
    console.log("config loaded from defaultSettings")
}

//get flags
let recordRequest = process.argv.includes("-r");
let replayRequest = process.argv.includes("-p");
let serveSFXV1Files = process.argv.includes("-s");
let stripEventSToreRequests = !process.argv.includes("-e");

console.log("record requests : " + recordRequest);
console.log("replay requests : " + replayRequest);
console.log("record playbackLocation: " + config.recordFileBase)
//if PFX location provided for cluster
httpsAgent = null;
if(config.TargetCluster.PFXLocation){
    httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        pfx: fsBase.readFileSync(config.TargetCluster.PFXLocation),
        passphrase: config.TargetCluster.PFXPassPhrase
      })
}

const fileExists = async path => !!(await fs.stat(path).catch(e => false));

const reformatUrl = (req) => {
    const copy = JSON.parse(JSON.stringify(req.query)); //make a deep copy to remove _cacheToken since it isnt necessary
    delete copy._cacheToken;
    const params =  Object.keys(copy).sort().map(key => `${key}=${copy[key]}` ).join("&")
    return config.recordFileBase +  `${req.method.toLowerCase()}${req.path}${params}.json`.split('/').join('-').replace(/:/g, "-");
}

const writeRequest = async (req, resp) => {
    //need to delete these properties to remove circular dependency 
    delete resp.request;
    delete resp.config;
    const replacedFile = reformatUrl(req);
    //confirm base folder exists
    if (!(await fileExists(config.recordFileBase))){
        await fs.mkdir(config.recordFileBase);
    }
    await fs.writeFile(replacedFile, JSON.stringify(resp, null, 4));
}

const loadRequest = async (req) => {
    const url = reformatUrl(req);
    try {
        return JSON.parse(await fs.readFile(url));
    } catch(e) {
       throw new Error(`failed to load ${url}`)
    }
}

const checkFile = async (req) => {
    return await fileExists(reformatUrl(req))
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
const port = process.env.PORT || 2500;

//need to be set to accept certs from secure clusters when certs cant be trusted
//this is mainly for SFRP clusters to test against.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// const basePath = __dirname  +  serveSFXV1Files ? '../Sfx' : ''
app.use(express.static(__dirname + '/wwwroot/'))
app.use(express.json())
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + 'wwwroot/index.html'));
});
app.all('/*', async (req, res) => {
    let resp = null;

    if(stripEventSToreRequests) {
        delete req.query['starttimeutc'];
        delete req.query['endtimeutc'];
        delete req.query['eventTypesFilter'];
    }


    if(req.url.includes("robot")) {
        res.status(200).end();
        return;
    }
    
    if(replayRequest && await checkFile(req)){
        resp =  await loadRequest(req);
        process.stdout.write("Playback: ");
    }else{
        resp = await proxyRequest(req);
    }

    console.log(`${req.url} ${req.method}`);

    if(!resp) {
        console.log("failed to forward the request")
        res.status(200).end();
      return;
    }

    res.status(resp.status);
    res.header(resp.headers);
    res.send(resp.data);

    if(recordRequest){
        await writeRequest(req, resp);
    }

})

console.log(`Target cluster url : ${config.TargetCluster.Url}`);

if(httpsAgent){
    console.log(`Certificate was Provided \n\t location: ${config.TargetCluster.PFXLocation}`);
}
app.listen(port, () => console.log(`proxy listening on port ${port}`))