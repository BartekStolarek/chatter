# chatter

### Description
A real-time chat application using Node.js server with Express and WebSocket technology. Chatter has a 'Create room' functionality, where users can create their own rooms (public or private with password), list of active users (in the same room) and ability to change name.

### How it works
Chatter application is based on Node.js server with Express framework. When it's turned on, Express is rendering a main chat page (using JADE), where users can communicate with each other. There are few public rooms (called #lobby) and users can create their own rooms- public (without password) od private (with password). There are also implemented list of active users in the current room and ability to change your own name. Connection between users is based on WebSocket and Socket.io framework, which provide real-time data exchange without necessity to reload the page. 

### Technologies used in the project
- Node.js server
- Express.js framework with JADE
- Skeleton CSS library/framework
- WebSocket with Socket.io framework

### How to set up the project
1. Download the project from GitHub
2. ``` npm install ```
3. ``` npm start ```
4. App will start by default on the port 8585
To test the chatter you can open ``` localhost:8585 ``` in the two browser tabs and try to "chat" with yourself.
