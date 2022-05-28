#!/bin/bash

curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "jakeperalta492@gmail.com",
    "password": "Jake@123",
    "firstName": "Jake",
    "lastName": "Peralta"
}'

curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "saksham@gmail.com",
    "password": "Saksham@123",
    "firstName": "Saksham",
    "lastName": "Yadav"
}'

curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "monica@gmail.com",
    "password": "Monica@123",
    "firstName": "Monica",
    "lastName": "Paliwal"
}'
