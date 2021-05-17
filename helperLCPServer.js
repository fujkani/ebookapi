//Module handles REST calls to LCP Server
require('dotenv').config()
//require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

//import axios from "axios";
const axios = require('axios'); 

const crypto = require('crypto');

require('array.prototype.flatmap').shim()
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  auth: {username: 'elastic', password: process.env.ESPWD},
  cloud: {id: 'i-o-optimized-deployment:ZXUtY2VudHJhbC0xLmF3cy5jbG91ZC5lcy5pbyQwZTc2NjJlY2IzMzQ0MTllYWQ4MDQyM2E0NzgyMDZlOSQ3MTA3OThiMzU5Nzg0OGVjYjZiNTFkMjU2MmMwMmI0Zg=='}
})

module.exports =  {

    //Insert a publication LCP Server
    //TODO: need to return values and handle errors

    storePublicationAsync: async function(LCPEncryptJSON) {return await module.exports.storePublication(LCPEncryptJSON);},

    storePublication: function(LCPEncryptJSON){
        return new Promise((resolve, reject) => {
          try {
            const res = axios.put( process.env.LCP_SERVER_URL + '/contents/' + LCPEncryptJSON['content-id'], LCPEncryptJSON, {  //secure-test
              headers: {
                'Content-Type': 'application/json'
              },
              auth: {
                username: process.env.LCP_SERVER_USERNAME,
                password: process.env.LCP_SERVER_PASSWORD
              }
            })
            .then(res => {
                console.log(res)
                resolve(res)
            })
            .catch(err => {
                console.log(err)
                reject(err)
            });

          }
          
          catch (error) {
              console.log('helperES: ' + error)
          }    
        });

    },

    generatePublicationLicenseAsync: async function(contentId, licenseJSON) {return await module.exports.generatePublicationLicense(contentId, licenseJSON);},

    generatePublicationLicense: function(contentId, licenseJSON){
      return new Promise((resolve, reject) => {
        try {

          let hash = crypto.createHash("sha256")
          .update(licenseJSON['encryption']['user_key']['hex_value'])
          .digest("hex");

          console.log('HASH: ' + hash)

          licenseJSON['encryption']['user_key']['hex_value'] = hash
          const res = axios.post( process.env.LCP_SERVER_URL + '/contents/' + contentId + '/license', licenseJSON, { 
            headers: {
              'Content-Type': 'application/json'
            },
            auth: {
              username: process.env.LCP_SERVER_USERNAME,
              password: process.env.LCP_SERVER_PASSWORD
            }
          })
          .then(res => {
              resolve(res)
          })
          .catch(err => {
              console.log(err)
              reject(err)
          });

        }
        
        catch (error) {
            console.log('helperES: ' + error)
        }    
      });

  },


};