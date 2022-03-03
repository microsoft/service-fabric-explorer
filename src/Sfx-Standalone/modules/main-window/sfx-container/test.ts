const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('httpModule', {
    sendHttpRequest: async (data) => {   
        const res = await ipcRenderer.invoke('http-request', data)
        console.log(res);
        return res;
    },
})
