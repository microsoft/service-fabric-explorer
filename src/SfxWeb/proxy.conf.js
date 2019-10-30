const PROXY_CONFIG = {
    "/**": {
        target: "http://localhost:3000",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug",
        "pathRewrite": {
            "^/api": ""
        }
    }
}

module.exports = PROXY_CONFIG;