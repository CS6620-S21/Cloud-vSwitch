#!/bin/sh
# Script to install server dependencies on CentOS
sudo yum -y install openssl
sudo yum -y install easy-rsa
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum -y install nodejs && npm install pm2@latest -g
