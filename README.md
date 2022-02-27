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
echo "MONGO_CONNECTION_STRING=mongodb+srv://admin:qkhHV6JRB6mq36Q5@cluster0.jwfdj.mongodb.net/safeShare?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=1b4ff1e4bb31ac96876426e9c480e12af6898698973f20f376a8d757d99af0e9b6e91295c3ab3cfc37d568b47880d3859de3cb3bcf055c06b54b3271cf6412a7
REFRESH_TOKEN_SECRET=69a81da76ef12b00d3fc735cbb66818819f28dcb88c2dcd7d54478f20817e7ac1218f096dbfe7cdea45d815d4c4d1be3a5c91f347c1a71b7f181b43878dbdf18" > .env

```


## Available Scripts

`npm start`

To start production server

`npm run dev`

To start development Server

`npm run format`

Run formatter on files


