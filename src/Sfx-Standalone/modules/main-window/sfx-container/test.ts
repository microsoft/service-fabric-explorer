const { contextBridge, ipcRenderer } = require('electron')

// contextBridge.exposeInMainWorld('remoteWindow', {
//     addWindow: (id) => ipcRenderer.send('add-window', id),
//     activeWindow: (id) => ipcRenderer.send('active-window', id),
//     removeWindow: (id) => ipcRenderer.send('remove-window', id)
// })

contextBridge.exposeInMainWorld('httpModule', {
    sendHttpRequest: async (data) => {   
        const res = await ipcRenderer.invoke('http-request', data)
        console.log(res);
        return res;
    },
    test: (data) => ipcRenderer.invoke('test', data)

})
