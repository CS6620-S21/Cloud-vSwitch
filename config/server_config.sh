#!/bin/bash
# Script to create OpenVPN server configuration
# Make sure openvpn is installed before running this script
# Usage: ./server_config.sh [common name] [server id]

# Check arguments
if [ $# -ne 2 ]; then
  echo "Usage: ./server_config.sh [common name] [server id]"
  exit 1
fi

CN=$1
SERVER_ID=$2
API_URL=http://localhost:8000

# Check if openvpn and easy-rsa is in PATH
if ! command -v openvpn; then
  echo "openvpn not found"
  exit 1
fi
export PATH=/etc/openvpn/easy-rsa/easyrsa3:$PATH

# Generate CA or get if exists
API_URL_CA=$API_URL/ca/$CN
if [ $(curl --write-out "%{http_code}" --silent -o /dev/null "$API_URL_CA") = 404 ]; then
  curl -X POST "$API_URL_CA"
fi
curl -o /tmp/ca.crt "$API_URL_CA"
sudo mv /tmp/ca.crt /etc/openvpn/server/
sudo chown root:root /etc/openvpn/server/ca.crt

# Generate server certificate and key
rm -rf /tmp/pki
EASYRSA_PKI=/tmp/pki easyrsa init-pki
EASYRSA_PKI=/tmp/pki easyrsa --batch gen-req server nopass
sudo cp /tmp/pki/private/server.key /etc/openvpn/server/

# Sign server certificate
API_URL_CERT=$API_URL/cert/$CN/server/$SERVER_ID
if [ $(curl --write-out "%{http_code}" --silent -o /dev/null "$API_URL_CERT") = 200 ]; then
  echo "Server id already in use"
  exit 1
fi
curl -X POST -H "Content-Type: text/plain" --data-binary "@/tmp/pki/reqs/server.req" "$API_URL_CERT" && curl -o /tmp/server.crt "$API_URL_CERT"
sudo mv /tmp/server.crt /etc/openvpn/server/
sudo chown root:root /etc/openvpn/server/server.crt

# Clean up
rm -rf /tmp/pki /tmp/*.crt

# Generate HMAC key
sudo openvpn --genkey --secret /etc/openvpn/server/ta.key

# OpenVPN server configuration file
sudo bash -c 'cat > /etc/openvpn/server.conf << EOL
# OpenVPN server configuration file
port 443
proto tcp
dev tap
server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt
keepalive 10 120
persist-key
persist-tun
verb 3
dh none
ca /etc/openvpn/server/ca.crt
cert /etc/openvpn/server/server.crt
key /etc/openvpn/server/server.key
tls-auth /etc/openvpn/server/ta.key 0
EOL'

# Start OpenVPN server in debug mode
sudo openvpn /etc/openvpn/server.conf

# Config and run OpenVPN as system service
# sudo systemctl -f enable openvpn@server.service
# sudo systemctl start openvpn@server.service
