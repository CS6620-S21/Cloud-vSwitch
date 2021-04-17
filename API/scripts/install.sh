#!/bin/sh
# Script to install server dependencies on CentOS
sudo yum -y install openssl
sudo yum -y install easy-rsa
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum -y install nodejs && npm install pm2@latest -g
# Copy easy-rsa to home directory
cp -r /usr/share/easy-rsa/3.0.8 "$HOME/easy-rsa"
