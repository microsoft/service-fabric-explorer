const { promises: fs } = require("fs");

const fileLocation = "./src/environments/environment.prod.ts";
//csv of key value pairs seperated with :
//example node replaceEnvVars.js telemetryKey:'test',version:1.2
//to add string values use ' quotes not " when passing as args.
let argvs = process.argv.splice(2);

const getVersion = () => {
    if (!process.env.BUILD_BUILDNUMBER || !process.env.BUILD_SOURCEVERSION) {
        return `,version:'unset'`;
    }
    const version = `,version:'${process.env.BUILD_BUILDNUMBER}-${process.env.BUILD_SOURCEVERSION}'`;
    console.log(version)
    return version;
} 

argvs[0] += getVersion();

const f = async () => {
    try {
        let fileInfo = await fs.readFile(fileLocation, 'utf-8');
        let data = fileInfo.split("\n");
        if(argvs.length > 0) {

            argvs[0].split(",").forEach(envReplace => {
                const [key, value] = envReplace.toString().split(":");

                //find row which contains the key
                let row = data.findIndex(row => row.includes(key));
                let split = data[row].split(":");

                //do not include a , if its the last item in the object
                data[row] = `${split[0]}: ${value} ${ data[row + 1].includes('}') ? '' : ','}\r`.replace(/'/g, '"');
            })
    
        }
        console.log(data);

        fs.writeFile(fileLocation, data.join("\n"));

    } catch(e) {
        console.log(e);
    }

}

f();

