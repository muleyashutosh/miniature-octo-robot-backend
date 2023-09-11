#!/bin/bash

curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "teacher1@gmail.com",
    "password": "Teacher@123",
    "firstName": "Teacher1",
    "lastName": "Peralta",
    "role": "Teacher"
}'


curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "teacher2@gmail.com",
    "password": "Teacher@123",
    "firstName": "Teacher2",
    "lastName": "Peralta",
    "role": "Teacher"
}'


curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "teacher3@gmail.com",
    "password": "Teacher@123",
    "firstName": "Teacher3",
    "lastName": "Peralta",
    "role": "Teacher"
}'


curl --location --request POST 'localhost:3000/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "student1@gmail.com",
    "password": "Student@123",
    "firstName": "Student1",
    "lastName": "Peralta",
    "role": "Student"
}'


