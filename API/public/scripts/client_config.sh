#!/bin/bash

function get_aws_public_hostname() {
    curl --silent http://169.254.169.254/latest/meta-data/public-hostname
}

export PATH=/usr/local/bin:$PATH
export PKI=/etc/openvpn/pki
export HOSTNAME=$( get_aws_public_hostname )

server=13.56.255.246
# org is the common name for the organization's CA
org="$1"

[ X"$org" == X ] && {
    echo "Usage: $0 <organizationname>"
    echo "The org name is required"
    exit 1
}

# install (or check for) openvpn and easyrsa
yum --quiet update -y
yum --quiet install epel-release -y
yum --quiet install openvpn -y
yum --quiet install easy-rsa -y
yum --quiet install wget -y
yum --quiet install telnet -y
target=/usr/local/bin/easyrsa
[ -f $target ] || ln -s /usr/share/easy-rsa/3.0.8/easyrsa $target

# create the pki config for the client
( cd /etc/openvpn || exit 1 ; easyrsa init-pki )

# create the CA on the server - API call
#   THIS API CALL SHOULD HAVE CREATED a server cert and created the server.conf
#   for this "org"
# fix server id for testing; need to set dynamically in the future
curl -X POST -H "Content-Type: application/json" \
      -d "{\"cn\": \"${org}\", \"id\":\"000\"}" \
      http://${server}/server-config

# get the server config files necessary for client creation from the server
# ca.crt
curl --silent http://${server}/ca/${org} > $PKI/ca.crt
# ta.key
curl --silent http://${server}/ta/${org} > $PKI/ta.key

# create the CSR on the client
( cd /etc/openvpn ; easyrsa --batch gen-req vclient nopass )
# private is in $PKI/private/vclient.key
# csr is in $PKI/reqs/vclient.req

# send the CSR to the server API
curl --header 'Content-Type: text/plain' \
     --data-binary @${PKI}/reqs/vclient.req \
     http://${server}/cert/${org}/client/${HOSTNAME}

# retrieve the Cert from the server API
mkdir -p $PKI/issued
URL=http://${server}/cert/${org}/client/${HOSTNAME}
( cd $PKI/issued ; curl --silent $URL > vclient.cert )

# create the client openvpn config file
cat > /etc/openvpn/client.conf <<END
# OpenVPN client configuration file
client
tls-client
verb 11
proto tcp-client
dev tap
remote $server 443
resolv-retry infinite
nobind
persist-key
persist-tun
ca $PKI/ca.crt
cert $PKI/issued/vclient.crt
key $PKI/private/vclient.key
tls-auth $PKI/ta.key 1
cipher AES-256-CBC
END

# DO not start in the install script - because we do not
# need to install every time we start the server
# start the openvpn daemon
# openvpn --config /etc/openvpn/client.conf
