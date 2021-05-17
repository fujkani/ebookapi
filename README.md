# eBook REST API with Node Express, Okta Authentication, ErdLab DRM

This Sample API handles secure requests for Book Publishers and eStore alike. It uses open source DRM technology from ErdLab, https://www.edrlab.org/

It's using Okta authentication the secure the endpoints and as such requires an account with Okta from a dev authentication server I have put together under: https://dev-998545.okta.com/

For Book Publishers:

* CRUD ops for own .epub publication
* Sales/Rent information

For eStore:

* CRUD ops for Book licenses

## Patterns and Best Practices covered

1. Securing your API using Okta middleware for Node Express
2. Enabling File Upload in your API
3. Automating DRM activities with backend ErdLab servers
4. CRUD operations with Elasticsearch
5. Using sentry.io for logging
6. Handling ePub formats
7. and others


## Assumes

- Familiarity with setting up Okta and understanding authentication mechanisms such as jwt tokens
- Familiarity with Node Express
- Familiarity with ErdLab DRM licensing technology
- Good understanding of Elasticsearch CRUD operations and node Client


## Author

Jon Ujkani

## Getting Started

### Install Dependencies

After cloning the repository, simply run `npm install` to install the dependencies.

### Environment Variables


Env variables are handled through the settings in `.env` file. One exception to that is the ESPWD which needs to be manually set on the server machine for security reasons

To chose which .env file to use export env NODE_ENV with one of following values 'DEV', 'PROD'


### Run the Server

To run the server, run `npm start` from the terminal.

### Run the Client

To make secure API requests, you'll need to authenticate the user with Okta to get a jwt token (make sure scope includes scope=openid profile email bookclubscope)

