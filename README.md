# eBook REST API with Node Express, Okta Authentication, ErdLab DRM

This API handles secure requests for Book Publishers and eStore alike. It uses open source DRM technology from ErdLab, https://www.edrlab.org/


For Book Publishers:

* CRUD ops for own .epub publication
* Sales/Rent information

For eStore:

* CRUD ops for Book licenses

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

