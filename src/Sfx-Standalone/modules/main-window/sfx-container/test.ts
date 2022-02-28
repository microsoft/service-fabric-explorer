const { contextBridge, ipcRenderer } = require('electron')

// contextBridge.exposeInMainWorld('remoteWindow', {
//     addWindow: (id) => ipcRenderer.send('add-window', id),
//     activeWindow: (id) => ipcRenderer.send('active-window', id),
//     removeWindow: (id) => ipcRenderer.send('remove-window', id)
// })

contextBridge.exposeInMainWorld('httpModule', {
    sendHttpRequest: (data) => ipcRenderer.invoke('http-request', data),
    test: (data) => ipcRenderer.invoke('test', data)

})
