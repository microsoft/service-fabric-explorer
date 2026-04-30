
const axios = require('axios');
const { promises: fs } = require("fs");
const fsBase = require("fs");

const https = require("https");
const tls = require("tls");
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
let recordRequest = process.argv.includes("r");
let replayRequest = process.argv.includes("p");
let serveSFXV1Files = process.argv.includes("-s");
let stripEventSToreRequests = !process.argv.includes("-e");

console.log("record requests : " + recordRequest);
console.log("replay requests : " + replayRequest);
console.log("record playbackLocation: " + config.recordFileBase)
//if PFX location provided for cluster
httpsAgent = null;
if(config.TargetCluster.PFXLocation){
    httpsAgent = new https.Agent({
        rejectUnauthorized: true,
        ca: [...tls.rootCertificates, fsBase.readFileSync(config.TargetCluster.CALocation)],
        pfx: fsBase.readFileSync(config.TargetCluster.PFXLocation),
        passphrase: config.TargetCluster.PFXPassPhrase,
        servername: ''
      })
}

const fileExists = async path => !!(await fs.stat(path).catch(e => false));

// Find a recording file, handling case differences and %2F decoding by Azure's reverse proxy
const findRecordingFile = async (targetPath) => {
    const dir = path.dirname(targetPath);
    const baseName = path.basename(targetPath).toLowerCase();
    // Normalize: decode %XX then replace / with - so both sides use the same separator
    const normalize = (s) => decodeURIComponent(s).toLowerCase().split('/').join('-');
    const normalized = normalize(baseName);
    try {
        const files = await fs.readdir(dir);
        const match = files.find(f => normalize(f) === normalized);
        return match ? path.join(dir, match) : null;
    } catch(e) {
        return null;
    }
}

const reformatUrl = (req) => {
    const copy = JSON.parse(JSON.stringify(req.query)); //make a deep copy to remove _cacheToken since it isnt necessary
    delete copy._cacheToken;
    const params =  Object.keys(copy).sort().map(key => `${key}=${copy[key]}` ).join("&")
    // Use the raw URL path (before Express decodes %2F etc.) so filenames match recordings on case-sensitive filesystems
    const rawPath = req.originalUrl.split('?')[0];
    return config.recordFileBase +  `${req.method.toLowerCase()}${rawPath}${params}.json`.split('/').join('-').replace(/:/g, "-");
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
    const resolved = await findRecordingFile(url);
    try {
        return JSON.parse(await fs.readFile(resolved || url));
    } catch(e) {
       throw new Error(`failed to load ${url}`)
    }
}

const checkFile = async (req) => {
    return (await findRecordingFile(reformatUrl(req))) !== null;
}

const proxyRequest = async (req) => {
    const url = req.url;
    const headers = req.headers;
    const data = req.body;
    const method = req.method.toLowerCase();
    let conf = {
        method,
        url: `${config.TargetCluster.Url}${url}`, // CodeQL [SM04580] this line leaves potential for SSFR, however, since this is a local dev tool, it is not a concern
        data, 
        headers
    }

    if(httpsAgent){
        conf.httpsAgent = httpsAgent;
    }

    try {
        res = await axios(conf) // CodeQL [SM04580] same as above, this is a local dev tool, and is not a concern
        return res;
    }
    //handle axios throwing an error(like 400 level issues) which should just be passed through
    catch(e){
        console.log(e)
        return e.response;
    }
}

const app = express()
const port = process.env.PORT || 2500;

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
        delete req.query['eventsTypesFilter'];
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
