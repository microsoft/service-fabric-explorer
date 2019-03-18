
const config = require("./appsettings.json");
const axios = require('axios');

console.log(config.TargetCluster.Url);

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
    res.status(resp.status);
    res.header(resp.headers);

    res.send(resp.data);
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))