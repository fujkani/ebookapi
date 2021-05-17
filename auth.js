const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({ issuer: process.env.ISSUER })

// Define which Okta user group can access this end point
const oktaGroup = "BookClubGroup"

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    if (!authorization) throw new Error('You must send an Authorization header')

    const [authType, token] = authorization.trim().split(' ')
    if (authType !== 'Bearer') throw new Error('Expected a Bearer token')

    const { claims } = await oktaJwtVerifier.verifyAccessToken(token)

    console.log(claims)
    
    if (!claims.scp.includes(process.env.SCOPE)) {
      throw new Error('Could not verify the proper scope')
    }

    if (!claims.BookClubReaderId){
      throw new Error('BookClubReaderId missing')
    }
    module.exports.BookClubReaderId = claims.BookClubReaderId
    module.exports.email = claims.sub

    next()
  } catch (error) {
    next(error.message)
  }
}

