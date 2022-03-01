# miniature-octo-robot-backend

## First setup instructions

  1. Make sure to have LTS version of node and npm installed [nodejs](http://nodejs.org)

    node --version
    > v16.13.2

    npm --version
    > 8.1.2

  2. Clone repository to local

    git clone git@github.com:muleyashutosh/miniature-octo-robot-backend.git

  3. Change directory to project directory

    cd miniature-octo-robot-backend

  4. Install package dependencies.

    npm i

  5. Make sure you have a `.env` file and add environment variables with the following command.
  
```
echo "MONGO_CONNECTION_STRING=***REMOVED***
ACCESS_TOKEN_SECRET=***REMOVED***
REFRESH_TOKEN_SECRET=***REMOVED***" > .env

```


## Available Scripts

`npm start`

To start production server

`npm run dev`

To start development Server

`npm run format`

Run formatter on files

