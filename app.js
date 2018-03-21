var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var app = express();

//code required to connect express + socket.io (they must listen on the same port)
var server = require('http').Server(app);
var client = require('socket.io')(server);
server.listen(process.env.PORT || 5000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

function User(nickname, room) {
    this.nickname = nickname;
    this.room = room;
}

function Room(name, password='') {
    this.name = name;

    if(password != '')
        this.password = password;
}

//create empty 3 rooms on the start
var usernames = [];
var rooms = [];

var room1 = new Room('public (lobby)');
var room2 = new Room('public2');
var room3 = new Room('public3');

rooms.push(room1);
rooms.push(room2);
rooms.push(room3);


//SocketIO Code 
client.sockets.on('connection', function (socket) {

    socket.on('adduser', function(username){
        //check if name already exist- if yes, add (number) to it. For example if user "dino" already exist, new user
        //who also typed "dino" will now be dino(1)
        var indexOf = usernames.findIndex(i => i.nickname == username);

        if (indexOf >= 0) {
            socket.username = username + "1";
            socket.room = rooms[0].name;
            socket.join(rooms[0].name);
            socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        }
        else {
            // store the username in the socket session for this client
            socket.username = username;
            // store the room name in the socket session for this client
            socket.room = rooms[0].name;
            // add the client's username to the global list
            socket.join(rooms[0].name);
            // echo to client they've connected
            socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        }    
        var user = new User(socket.username, socket.room);
        usernames.push(user);

        socket.emit("addeduser", socket.username);
        socket.emit("updateonline", usernames, socket.room);
        socket.broadcast.to(socket.room).emit("updateonline", usernames, socket.room);

        // echo to room 1 that a person has connected to their room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, rooms[0].name);
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('addChannel', function (name, password) {
        //if channelName already exists, emit error 
        var indexOf = rooms.findIndex(i => i.name == name);
        if (indexOf >= 0) {
            socket.emit("alreadyExistChannel", name);
        }
        else {
            var addRoom;

            if(password && password != '') {
                addRoom = new Room(name, password);
                rooms.push(addRoom);
                socket.broadcast.emit('pushRoom', addRoom.name, true);
            } else {
                addRoom = new Room(name);
                rooms.push(addRoom);
                socket.broadcast.emit('pushRoom', addRoom.name, false);
            }
            //socket.emit('updaterooms', rooms, socket.room);

            //add user to room
            var indexOf = usernames.findIndex(i => i.nickname == socket.username);
            usernames.splice(indexOf, 1);

            socket.broadcast.to(socket.room).emit("updateonline", usernames, socket.room);
            // leave the current room (stored in session)
            socket.leave(socket.room);
            // join new room, received as function parameter
            socket.join(addRoom.name);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ addRoom.name);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
            // update socket session room title
            socket.room = addRoom.name;
            socket.broadcast.to(addRoom.name).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
            socket.emit('updaterooms', rooms, addRoom.name);

            //add user to new active list
            var user = new User(socket.username, addRoom.name);
            usernames.push(user);

            socket.emit("updateonline", usernames, addRoom.name);
            socket.broadcast.to(addRoom.name).emit("updateonline", usernames, socket.room);
        }
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        client.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('updatename', function(username) {
        let oldName = socket.username;
        //socket.username = username;

        //check if user with the same nickname already exist or not
        var indexOf = usernames.findIndex(i => i.nickname == username);
        if (indexOf >= 0) {
            socket.emit('alreadyExistName', username, oldName);
        }
        else {
            var indexOf = usernames.findIndex(i => i.nickname == socket.username);
            usernames[indexOf].nickname = username;
            socket.username = username;

            socket.emit('updatedname', oldName, socket.username, usernames, socket.room);
            socket.broadcast.to(socket.room).emit('updatednameinfo', oldName, username, usernames, socket.room);
        }
    });

    socket.on('confirmPasswordRequest', function (room, receivedPassword) {
        var findRoom = rooms.findIndex(i => i.name == room);

        if (rooms[findRoom].password == receivedPassword) {
            var indexOf = usernames.findIndex(i => i.nickname == socket.username);
            usernames.splice(indexOf, 1);

            //socket.emit("updateonline", usernames, socket.room);
            socket.broadcast.to(socket.room).emit("updateonline", usernames, socket.room);

            // leave the current room (stored in session)
            socket.leave(socket.room);
            // join new room, received as function parameter
            socket.join(room);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ room);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
            // update socket session room title
            socket.room = room;
            socket.broadcast.to(room).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
            socket.emit('updaterooms', rooms, room);

            //add user to new active list
            var user = new User(socket.username, room);
            usernames.push(user);

            socket.emit("updateonline", usernames, room);
            socket.broadcast.to(room).emit("updateonline", usernames, socket.room);
        }
        else {
            socket.emit("wrongPasswordInfo", room);
        }
    });

    socket.on('switchRoom', function(newroom){
        //if room has password emit request
        var findRoom = rooms.findIndex(i => i.name == newroom);
        if (rooms[findRoom].password && rooms[findRoom].password != '' && rooms[findRoom].password != undefined) {
            socket.emit('roomPasswordRequest', newroom);
        } else {
            //if room doesn't have password, switch rooms normally
            //delete user from active list
            var indexOf = usernames.findIndex(i => i.nickname == socket.username);
            usernames.splice(indexOf, 1);

            //socket.emit("updateonline", usernames, socket.room);
            socket.broadcast.to(socket.room).emit("updateonline", usernames, socket.room);

            var oldRoom = socket.room;
            // leave the current room (stored in session)
            socket.leave(socket.room);
            // join new room, received as function parameter
            socket.join(newroom);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
            // update socket session room title
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');

            //add user to new active list
            var user = new User(socket.username, newroom);
            usernames.push(user);

            socket.emit("updateonline", usernames, newroom);
            socket.broadcast.to(newroom).emit("updateonline", usernames, socket.room);

            //check if room which disconnected user was using is empty- if yes, delete it
            //if room is not public, public2 or public3 we are deleting it (we want to keep these 3 channels always open)
            if (oldRoom != "public (lobby)" && oldRoom != "public2" && oldRoom != "public3") {
                var indexOf = usernames.findIndex(i => i.room == oldRoom);
                if (indexOf < 0) {
                    var indexOfRoom = rooms.findIndex(i => i.name == oldRoom);
                    if (indexOfRoom >= 0) {                    
                        rooms.splice(indexOfRoom, 1);
                        socket.broadcast.emit('spliceRoom', oldRoom);
                    }
                }
            }
            socket.emit('updaterooms', rooms, newroom);
            //socket.broadcast.emit('updaterooms', rooms, newroom);
            
        }
    });

    // when the user disconnects
    socket.on('disconnect', function(){
        var indexOf = usernames.findIndex(i => i.nickname == socket.username);
        usernames.splice(indexOf, 1);
        socket.emit("updateonline", usernames, socket.room);
        socket.broadcast.to(socket.room).emit("updateonline", usernames, socket.room);

        // update list of users in chat, client-side
        client.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        var oldRoom = socket.room;
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);

        //check if room which disconnected user was using is empty- if yes, delete it
        if (oldRoom != "public (lobby)" && oldRoom != "public2" && oldRoom != "public3") {
            var indexOf = usernames.findIndex(i => i.room == oldRoom);
            if (indexOf < 0) {
                var indexOfRoom = rooms.findIndex(i => i.name == oldRoom);
                if (indexOfRoom >= 0) {                    
                    rooms.splice(indexOfRoom, 1);
                }
            }
        }
        socket.broadcast.emit('spliceRoom', oldRoom);
    });
});

