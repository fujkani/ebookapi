require('dotenv').config()

const { spawn } = require('child_process');

module.exports =  {


    encryptAsync: async function(inputFile, outFile, contentid) {return await module.exports.encrypt(inputFile, outFile, contentid);},

    encrypt: function(inputFile, outFile, contentid){
        return new Promise((resolve, reject) => {

        var result = 'abcd'
        
        try {
            const lcpencrypt = spawn(process.env.LCPENCRYPT_LOCATION, ['-input', inputFile, '-contentid', contentid, '-output', outFile]);
            
            const ret = lcpencrypt.stdout.on('data', (data) => {
                
                const stdOutput = `${data}`
                jsonPart = stdOutput.substring(
                    stdOutput.lastIndexOf("{"), 
                    stdOutput.lastIndexOf("}") + 1
                );
                result= jsonPart
            });
            
            lcpencrypt.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
                 reject({
                    status: 500,
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: {data}
                  })
                  resolve()
            });
            
            lcpencrypt.on('exit', function (code, signal) {
                console.log('child process exited with ' +
                    `code ${code} and signal ${signal}`);  //you want code 0 and signla null basically
                    return resolve(result)
            });

        }
        catch (error) {
            console.log('helperES: ' + error)
        }

    });

    }
};
