//Module handles all communications with Elasticsearch backend
require('dotenv').config()

var fs = require('fs')
const EPub = require("epub2/node");

const log4js = require("log4js");
log4js.configure({
  appenders: { cheese: { type: "file", filename: "helperEPUB.log" } },
  categories: { default: { appenders: ["cheese"], level: "info" } }
});

module.exports =  {

    readEPUBAsync: async function(inputFile, coverPageFile, pubInfoJSON) {return await module.exports.readEPUB(inputFile, coverPageFile, pubInfoJSON);},

    readEPUB: async function(inputFile, coverPageFile, pubInfoJSON){
        return new Promise( async (resolve, reject) => {

            try{
                var coverPageFileWrite = coverPageFile
                console.log(coverPageFile)
                const logger = log4js.getLogger("cheese");

                //test opening ePub and listing some of the metadata
                let inFile = inputFile
                let imagewebroot = '/images/'
                let chapterwebroot = '/chapter/'
                
                await EPub.createAsync(inFile, imagewebroot, chapterwebroot)
                .then(function (epub)
                {
                    //console.log(epub.manifest.cover);

                    logger.info(epub)
                    
                    if (epub.metadata.description) {console.log('CHANGING ABOUT');pubInfoJSON['mainEntity']['about'] = epub.metadata.description}
                    if (epub.metadata.publisher) {console.log('CHANGING PUBLISHER'); pubInfoJSON['mainEntity']['publisher'] = epub.metadata.publisher}
                    if (epub.metadata.date) {console.log('CHANGING DatePublished'); pubInfoJSON['mainEntity']['datePublished'] = epub.metadata.date}
                    if (epub.metadata.language) {console.log('CHANGING inLanguage'); pubInfoJSON['mainEntity']['inLanguage'] = epub.metadata.language}
                    if (epub.metadata.title) {console.log('CHANGING NAME'); pubInfoJSON['mainEntity']['name'] = epub.metadata.title}

                    pubInfoJSON['ePUBMETA'] = epub.metadata
                    pubInfoJSON['ePUBTOC'] = epub.toc
                    if (epub.metadata.cover)
                    {

                        epub.getImage(epub.metadata.cover, function(error, img, mimeType){
                            console.log('GOT IMAGE')

                            let fileExt  = '.jpeg'
                            if (!epub.manifest[epub.metadata.cover]['media-type'] == 'image/jpeg')
                            {
                                let fileExt  = '.png'
                            }
                            coverPageFileWrite = coverPageFile + fileExt
                            console.log(coverPageFileWrite)

                            fs.writeFile(coverPageFileWrite, img, function(err) {
                                // If an error occurred, show it and return
                                if(err) {console.error(err); reject()};
                                console.log('WRITING COVER PAGE')
                                resolve (pubInfoJSON)
                                // Successfully wrote binary contents to the file!
                            });
                            

                        })
                        
                        
                    }
                    else {resolve (pubInfoJSON)}                    

                })
                .catch(function (err)
                {
                    console.log("ERROR\n-----");
                    reject()
                });
  
            }
            catch (error) {
                console.log('helperEPUB: ' + error)
                reject()
            }
        });
    },


    
};
