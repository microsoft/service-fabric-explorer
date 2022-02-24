import { ICluster } from "sfx.cluster-list";

class Subject {
  obs = [];
  lastValue;

  subscribe(cb) {
    this.obs.push(cb)
  };

  emit(value) {
    this.lastValue = value;
    this.obs.forEach(ob => ob(value));
  }
}

window.onload = async () => {
  console.log(sfxModuleManager);
  const promptContext = await sfxModuleManager.getComponentAsync("prompt.prompt-context");
  console.log(promptContext);

  const radioButtons = (id) => {
    const authType = document.getElementsByName(id)
    const subject = new Subject();

    authType.forEach((element: HTMLInputElement) => {
      subject.emit(element.checked)
      element.onclick = (ev) => subject.emit(ev.target['value'])
    })

    return subject;
  }


  const certSection = document.getElementById('cert-info')

  const authSubject = radioButtons('auth');

  authSubject.subscribe((data) => {
    console.log(data)
    if (data === "certificate") {
      certSection.classList.remove('hidden')
    } else {
      certSection.classList.add('hidden')
    }
  })


  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    let data: any = {};

    for (let pair of formData.entries()) {
      data[pair[0]] = pair[1];
    }

    const url = new URL(data.endpoint || "http://localhost:19080");

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("The protocol of the cluster url is not supported. Only HTTP and HTTPS are supported.");
    }
    data.endpoint = url.protocol + "//" + url.host

    if (data.displayName.length === 0) {
      data.displayName = url.host;
    }

    const returnData: Partial<ICluster> = {
      displayName: data.displayName,
      endpoint: data.endpoint,
      authentication: {
        type: data.auth
      }
    }
    
    if(data.auth === "certificate") {
      returnData.authentication.certInfo = {
        storeLocation: data.storeLocation,
        storeName: data.storeName,
        findType: data.findType,
        findValue: data.findValue,
        serverCommonNames: data.serverCommonNames
      }
    }

    console.log(returnData);

    promptContext.finish(returnData);
    window.close();

  }

  document.getElementById("cluster-form").onsubmit = handleSubmit;

}
