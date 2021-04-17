#!/bin/sh
# Script to install server dependencies on CentOS
sudo yum -y install openssl

mkdir "$HOME"/easy-rsa
curl -L https://github.com/OpenVPN/easy-rsa/releases/download/v3.0.8/EasyRSA-3.0.8.tgz | tar -xz -C "$HOME"/easy-rsa --strip-components=1

curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum -y install nodejs && npm install pm2@latest -g
