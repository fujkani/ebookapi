//Entry point index.js
//Exposes main REST endpoints
//TODO: Would be good to split the endpoints in a separate endpoints.js file and maybe attache swagger-autogen for documentation: https://medium.com/swlh/automatic-api-documentation-in-node-js-using-swagger-dd1ab3c78284


require('dotenv').config()
//require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
const express = require('express')
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const { promisify } = require('util')

const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
var crypto = require('crypto');


const authMiddleware = require('./auth')
const helperLCPencrypt = require('./helperLCPencrypt')
const helperES = require('./helperES')
const helperLCPServer = require('./helperLCPServer')
const helperEPUB = require('./helperEPUB')

const Sentry =  require("@sentry/node");
const Tracing = require("@sentry/tracing");
const SENTRY_DSN = "https://27cf3d8bc3d94b2289c2a4942208f842@o514427.ingest.sentry.io/5669691"


const app = express()

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Adjust this value in production, or using tracesSampler for finer control
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


// enable files upload
app.use(fileUpload({
  createParentPath: true,
  limits: { 
      fileSize: 200 * 1024 * 1024 * 1024 //200MB max file(s) size
  },
  abortOnLimit: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(authMiddleware)


app.get('/hello', (req, res) => {
  res.send('Hello World!')

  console.log(authMiddleware)
});

//#region publisher endpoints

//Uploads and stores a new .epub
app.post('/publisher/contents/uploadepub', async (req, res) => {
  var ret = 'abc'
  const BookClubReaderId = authMiddleware.BookClubReaderId

  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } 
      else {
        //Using name of the input field to retrieve the uploaded file
        let publicationFile = req.files.publication;

        //console.log(req.body.publicationinfo);
        const contentid = uuidv4()
        const fileName = contentid + '.epub';
        const baseUploadFolder = process.env.UPLOAD_FOLDER
        const ePubFolder = baseUploadFolder + 'epub/'

        const inputFile = ePubFolder + fileName

        const outputFile = baseUploadFolder + 'epub/out' + fileName //+ publicationFile.name
        console.log('About to move From: ' + inputFile + ' To: ' + outputFile)

        const coverPageFileName = contentid //Will set extension latter when processing the ePub
        const JPEGFolder = baseUploadFolder + 'jpeg/'
        const coverPageFile = JPEGFolder + coverPageFileName


        let pubInfoJSON = JSON.parse(req.body.publicationinfo);
        pubInfoJSON['content-id'] = contentid
        pubInfoJSON['BookClubReaderId'] = BookClubReaderId

        publicationFile.mv(inputFile, coverPageFile)                                                       //MOVE FILE TO PREFERED LOCATION
        .then(async (respublicationFile) => {
          console.log('File MOVED  Successfully')

          await helperEPUB.readEPUBAsync(inputFile, coverPageFile, pubInfoJSON)                                                       //READ EPUB FILE
          .then(async (reshelperEPUB) => {


            console.log('EPUB read Successfully')
            pubInfoJSON = reshelperEPUB
            console.log(reshelperEPUB)
            console.log('---------------------')
            //pubInfoJSON['ePUBINFO'] =  reshelperEPUB //[{"Type": "car"}]
            //console.log(pubInfoJSON)

            await helperLCPencrypt.encryptAsync(inputFile, outputFile, contentid)                         //ENCRYPT THE EPUB
            .then(async (reshelperLCPencrypt) => {
              console.log('Encrypted Successfully')
              console.log(reshelperLCPencrypt)
              const LCPEncryptJSON = JSON.parse(reshelperLCPencrypt)
  
    
              //store the Publication
              await helperLCPServer.storePublicationAsync(LCPEncryptJSON)                                 //STORE THE PUBLICATION WITH THE LCP SERVER
              .then( async (reshelperLCPServer) => {
                console.log('Store Pub successful')
                await helperES.addPublicationAsync(pubInfoJSON)                                           //STORE ON ELASTIC
                .then( helperES => {
                  console.log('Add Pub to ES successfull')
                  console.log(helperES)
                })
                .catch(err => {
                  console.log('Add Pub to ES failed')
                  console.error(err)
                  //res.status(500).send(err);
                });
              })
              .catch(err => {
                console.log('Store Pub Failed')
                res.status(500).send(err);
              });
    
            })
            .catch(err => {
              console.log('LCPEncrypt failed')
              console.error(err)
              //res.status(500).send(err);
            });
            
    

          })
          .catch(err => {
            console.log('EPUB read failed')
            console.error(err)
            res.send({
              status: 500,
              message: err
            });

          });


        })

        
        console.log('wrapping up again')

        res.send({
        status: true,
        message: {
            'content-id': contentid ,// publicationFile.name,
            publicationURL: process.env.CLIENT_BASE_URL +':' + process.env.SERVER_PORT + '/publisher/contents/?content-id=' + pubInfoJSON['content-id']
        }
      });

      }


  } catch (err) {
      console.log("ERROR999: " + err)
      res.status(500).send(err);
      /*res.send({
        status: 500,
        message: 'Error occured',
        data: err
    });*/
  }
});

app.post('/publisher/contents/test', async (req, res) => {
  var ret = 'abc'
  const BookClubReaderId = authMiddleware.BookClubReaderId

  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {

        //Using name of the input field to retrieve the uploaded file
        let publicationFile = req.files.publication;

        //console.log(req.body.publicationinfo);
        const contentid = uuidv4()
        const fileName = contentid + '.epub';
        const baseUploadFolder = process.env.UPLOAD_FOLDER
        const ePubFolder = baseUploadFolder + 'epub/'

        const inputFile = ePubFolder + fileName

        const coverPageFileName = contentid //Will set extension latter when processing the ePub
        const JPEGFolder = baseUploadFolder + 'jpeg/'
        const coverPageFile = JPEGFolder + coverPageFileName


        await publicationFile.mv(inputFile)
        .then(async (res) => {
          console.log('File MOVED  Successfully')


          await helperEPUB.readEPUBAsync(inputFile, coverPageFile)
          .then(async (res) => {
            console.log('EPUB read Successfully')

            const outputFile = baseUploadFolder + 'epub/out' + fileName //+ publicationFile.name
            console.log('From: ' + inputFile + ' To: ' + outputFile)

          })
          .catch(err => {
            console.log('EPUB read failed')
            console.error(err)
            res.send({
              status: 500,
              message: err
            });

          });

        })



        res.send({
          status: true
        });

      }



  } catch (err) {
      //res.status(500).send(err);
      res.send({
        status: 500,
        message: 'Error occured',
        data: err
    });
  }
});
//#endregion publisher endpoints

//#region eStore endpoints

//TODO: eventually will need to secure this endpoint so only another API can call it. Most likely splitting into a separate API/listener would be a better design
//TODO: validate schema
//TODO: validate requested license rights jive with what's on ES for this publication..
app.post('/estore/contents/generatelicense', async (req, res) => {
  var ret = 'abc'
  console.log(ret)

  const BookClubReaderId = authMiddleware.BookClubReaderId
  const BookClubReaderEmail = authMiddleware.email

  
  try {

    if(!req.body.contentid || !req.body.licenserequestinfo) {
      res.send({
          status: 500,
          message: 'Either content id or licenserequestinfo is missing on request body'
      });
    } 
    else {

      console.log('BookClubReaderId: ' + BookClubReaderId)

      
      let licenseRequestInfoJSON = JSON.parse(req.body.licenserequestinfo)

      let contentid = req.body.contentid


      //assuming input is validated..
      //lookup ES entry for this publication
      //not sure we need to query ES
      /*
      publicationInfoJSON = await helperES.getPublicationByContentIdAsync(contentid)
      .then( res => {
        console.log('Retrieved ES publication')
        console.log(res)
      })
      .catch(err => {
        console.log('Get ES Publication failed')
        console.error(err)
      });
      */

      const secret = licenseRequestInfoJSON['encryption']['user_key']['hex_value'];
      const hash = crypto.createHmac('sha256', secret)
                   .update(licenseRequestInfoJSON['encryption']['user_key']['text_hint'])
                   .digest('hex');
      
      licenseRequestInfoJSON['encryption']['user_key']['hex_value'] = hash
      console.log(licenseRequestInfoJSON['encryption']['user_key']['hex_value']);

      
       await helperLCPServer.generatePublicationLicenseAsync(contentid, licenseRequestInfoJSON)
      .then( async reshelperLCPServer => {
        console.log('LICENSE Retrieval from LCP Server successful')
        console.log(reshelperLCPServer.status)
        console.log(reshelperLCPServer.data)

        let publicationLicenseJSON = {license_data: reshelperLCPServer.data}
        await helperES.addPublicationLicenseAsync(publicationLicenseJSON)
        .then(resHelper =>{
          console.log('Store new license in ES successful')
          res.send({
            status: true,
            message: {
                'content-id': contentid,
                publicationURL: process.env.CLIENT_BASE_URL +':' + process.env.SERVER_PORT + '/estore/pub/?id=' + contentid
            },
            license_data: reshelperLCPServer.data
          });
        })
        .catch(err => {
          console.log('Store new license in ES failed')
          console.error(err)
          res.send({
            status: 500,
            message: 'License generation failed'
          });
        });

      
      })
      .catch(err => {
        console.log('LICENSE Retrieval from LCP Server failed')
        console.error(err)
        res.send({
          status: 500,
          message: 'License generation failed'
        });
      });

    }


  } catch (err) {
      //res.status(500).send(err);
      res.send({
        status: 500,
        message: 'Error occured',
        data: err
    });
  }
});
//#endregion eStore endpoints


app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("Fake Sentry error!");
});

app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all 404 and 500 errors
      if (error.status === 404 || error.status === 500) {
        return true;
      }
      return false;
    },
  })
);

app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

const startServer = async () => {

  const port = process.env.SERVER_PORT || 3000
  await promisify(app.listen).bind(app)(port)
  console.log(`Listening on port ${port}`)
}

startServer()
