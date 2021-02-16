# Cloud vSwitch

## 1. Vision and Goals Of The Project
Cloud vSwitch is a secure and streamlined IT independent VPN as a service in the cloud. Cloud vSwitch provides a VPN connection from each laptop to a central Linux server, and all the VPN connections are connected to a Linux bridge. When the interfaces on each laptop are configured, the laptops can talk to each other. 

High-Level Goals of Cloud vSwitch includes: 
* Allows workers to connect to each other via the cloud in a way that all appear to be on a virtual switch in a local network.
* Provide secure connection, which is TLS for encryption. Access is controlled by a client certificate used on each laptop to initiate the VPN connection to the server. 

## 2. Users/Personas Of The Project
Cloud vSwitch will be used by the end-users of any interested users that want to connect to each other via the cloud in a way that all appear to be on a virtual switch in a local network.

It does not target:
Users that do not have some basic degree of knowledge using cloud
Users that do not need to connect to each other via cloud
## 3. Scope and Features Of The Project
* User register/login/logout/update
* VPN configuration (OpenStack)/connection/disconnection
* TLS/SSL encryption
* Access control (client certificate)
* Linux bridge setup


## 4. Solution Concept
Global Architectural Structure Of the Project:
![wireframe](./vSwitch-general.png)
A Walkthrough Explanation of the Architectural Structure:
* The vSwitch portal provides an interface for users to do user/organization/instance management
* The vSwitch server sets up and configures virtual network, and makes all the VPN connections connected to a Linux bridge
* TLS/SSL encryption along with the access control by using client certificate provides secure connections

Design Implications and Discussion:
* Since this must be a secure connection, we use TLS for encryption. Also, access is controlled by a client certificate used on each laptop to initiate the VPN connection to the server. This means that the VPN server will act as a certificate authority.
* Cloud platforms that were discussed: MOC, OpenStack
* Network security analysis: Zeek

## 5. Acceptance criteria
Minimum acceptance criteria:
A web application that allows users to set up an account to manage the cloud network of their organization.
A MacOS desktop application that allows users to sign in to their organization and connect to a virtual local area network (LAN) on the Mass Open Cloud (MOC) within the organization via OpenVPN service and a virtual switch server in the network. 
End user devices should be able to talk to each other as if they are on the same local network. Also, the VPN connection should be secured with TLS encryption and access is controlled by a client certificate used on each device to initiate the connection to the server.

Stretch goals:
Build cross-platform desktop applications that work on Windows/MacOS/Linux.
Extend deployment from MOC to other cloud computing platforms such AWS.
Add advanced user role/resource/organization management.

## 6. Release Planning
### Release #1 
User creation: 
As a user, I can register an account, so that I can log in in order to use this application.
User login/logout:
As a user, I can log in to the web application, so that I can manage the virtual network on the cloud in my organization. I can also log out after I have finished my work, so that I can prevent my account from potential malicious use.
User organization:
As a user, I can create or join an organization where I would like to work remotely with my coworkers on its virtual network.
User profile
As a user, I can review and update my user profile so that my account information is up to date.

### Release #2 
vSwitch server:
As a user, I can instantiate a vSwitch server on the cloud for my organization, so that I can connect to it and work with my coworkers on the same virtual network. I can also terminate this server, so that I can save cloud resources when I do not need the server anymore. 
Client login/logout:
As a user, I can log in to the desktop application, so that I can connect to the virtual network on the cloud in my organization. I can also log out after I have finished my work, so that I can prevent my account from unauthorized use.
VPN connection: 
As a user, I can make a VPN connection to the virtual network in my organization, so that I can work remotely as if I am on the physical local network in my organization. I can also disconnect after I have finished my work, so that my computer network is reset to its previous state.
Virtual LAN:
As a user, I can work with other connected users as if we are on the same local network, so that our connected devices such as desktops can talk to each other directly.

### Release #3
Testing, bug fixes, documentation and UI improvement. 
Release #4 (Optional)
Feature extension based on the stretch goals.

