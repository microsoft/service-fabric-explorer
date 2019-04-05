
const config = require("./appsettings.json");
const axios = require('axios');
const fs = require("fs");
const https = require("https");

httpsAgent = null;

if(config.TargetCluster.PFXLocation){
    httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        cert: fs.readFileSync(config.TargetCluster.PFXLocation),
      })
      
}

console.log(httpsAgent);

const proxyRequest = async (req) => {
    const url = req.url;
    const headers = req.headers;
    const body = req.body;
    const method = req.method;
    let conf = {
        method,
        url: `${config.TargetCluster.Url}${url}`,
        body, 
        headers: headers
    }

    if(httpsAgent){
        conf.httpsAgent = httpsAgent;
    }

    console.log(conf);
    try {
        res = await axios(conf)
        return res

    } 
    catch(e){
        console.log(e);
    }

}

const express = require('express')
const app = express()
const port = 3000
app.use(express.static('wwwroot'))
app.use(express.json())

app.all('/*', async (req, res) => {
    console.log(req.method)
    // console.log(`${req.url} ${req.method}`);

    const resp = await proxyRequest(req);
    // console.log(resp.config)
    if(resp){
        res.status(resp.status);
        res.header(resp.headers);
    
        res.send(resp.data);
    }

})

console.log(`Target cluster url : ${config.TargetCluster.Url}`);

if(httpsAgent){
    console.log(`Certificate was Provided \n\t location: D:test ${config.TargetCluster.PFXLocation}`);
}
app.listen(port, () => console.log(`proxy listening on port ${port}!`))