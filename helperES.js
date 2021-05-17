//Module handles all communications with Elasticsearch backend
require('dotenv').config()
//require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

require('array.prototype.flatmap').shim()
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  auth: {username: 'elastic', password: process.env.ESPWD},
  cloud: {id: 'i-o-optimized-deployment:ZXUtY2VudHJhbC0xLmF3cy5jbG91ZC5lcy5pbyQwZTc2NjJlY2IzMzQ0MTllYWQ4MDQyM2E0NzgyMDZlOSQ3MTA3OThiMzU5Nzg0OGVjYjZiNTFkMjU2MmMwMmI0Zg=='}
})

const publicationIndexName  = process.env.ES_PUBLICATION_INDEX_NAME
const licenseIndexName = process.env.ES_LICENCE_INDEX_NAME


module.exports =  {

    //Insert a publication in elastic

    addPublicationAsync: async function(publicationJSON) {return await module.exports.addPublication(publicationJSON);},

    addPublication: function(publicationJSON){
        return new Promise((resolve, reject) => {
            try{

                //force an index create if not there already
                client.indices.create({
                    index: publicationIndexName
                }, function(error, response, status) {
                    if (error) {
                        console.log('Index already exists');
                    } else {
                        console.log("created a new index", response);
                    }
                });

                //index the document
                res = client.index({
                    index: publicationIndexName,
                    id: publicationJSON['content-id'],
                    type: 'publication',
                    body: publicationJSON
                }, function(err, resp, status) {
                    console.log(resp);
                    resolve(resp)
                });

                //resolve(res)
            }
            catch (error) {
                console.log('helperES: ' + error)
                reject()
            }
        });

    },



    getPublicationByContentIdAsync: async function(contentid) {

        try{

            var query = {bool: { must: [] }}
            query.bool.must.push({ match: { 'content-id': contentid } })
            console.log(query)
            const sort = [{'mainEntity.datePublished': {order : 'desc'}}]
            //const _source = {"excludes": ["desc", "descHTML"]}
            const _source = ["mesmainEntitysage"]
          
            const { body } = await client.search({ index: publicationIndexName, body: { size: 1, sort, query  } })
          
            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            console.log(res)

            return res
        }
        catch (error) {
            console.log('helperES: ' + error)
        }

    },


    addPublicationLicenseAsync: async function(publicationLicenseJSON) {return await module.exports.addPublicationLicense(publicationLicenseJSON);},

    addPublicationLicense: function(publicationLicenseJSON){
        return new Promise((resolve, reject) => {
            try{

                //force an index create if not there already
                client.indices.create({
                    index: licenseIndexName
                }, function(error, response, status) {
                    if (error) {
                        console.log('Index already exists');
                    } else {
                        console.log("created a new index", response);
                    }
                });

                //index the document
                res = client.index({
                    index: licenseIndexName,
                    id: publicationLicenseJSON['license_data']['id'],
                    type: 'license',
                    body: publicationLicenseJSON
                }, function(err, resp, status) {
                    //TODO: check err before replying
                    //TODO: exit gracefully in case of errors: return a {status: 500, error: err} back to client
                    console.log(resp);
                    resolve(resp)
                });

                //resolve(res)
            }
            catch (error) {
                console.log('helperES: ' + error)
                reject()
            }
        });

    },


};