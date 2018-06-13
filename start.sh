#!/bin/bash

export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=admin
export MYSQL_DB=finalproject

sudo docker kill $(sudo docker ps -q)
sudo docker rm $(sudo docker ps -a -q)
sudo docker rmi $(sudo docker images -q)
sudo docker volume prune
sudo docker network prune;

#nodemon npm start
sudo docker-compose up --build
