//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server,{ 'destroy buffer size': Infinity });

router.use(express.static(path.resolve(__dirname, 'client')));

var games = [];
var sockets = [];

io.on('connection', function (socket) {

    sockets.push(socket);
    
    
    socket.on('sendGameName', function(inputGame){
      inputGame.name = inputGame.name.trim().toLowerCase();
      console.log("Nouvelle partie demandée  : " + inputGame.name + " par mobile ? " + inputGame.mobile);
      
      var response = {};
      if (!inputGame.mobile) {
        for (var i = 0; i< games.length; i++ ) {
          if(games[i].name == inputGame.name){
            response = {
              'state' : 'alert',
              'text' : 'Ce nom de partie est déjà pris'
            };
            break;
          }
        }
        if(!response.state){
          games.push({'name' : inputGame.name, 'socket' : socket});
          response = {
              'state' : 'success',
              'text' : 'Partie ajoutée, rentrez maintenant le même nom sur votre portable'
            };
          socket.emit('gameAddSuccess', inputGame.name);
        }
      }else{
        for (var i = 0; i< games.length; i++ ) {
          if(games[i].name == inputGame.name){
            socket.associateSocketScreen = games[i].socket;
            games[i].socket.associateSocketKeypad = socket;
            
            socket.emit('startGame');
            socket.associateSocketScreen.emit('startGame');
            
            response = {
              'state' : 'success',
              'text' : 'Association faites'
            };
            
            socket.associateSocketScreen.emit('notification', response);
            
            games.splice(i, 1);
            break;
          }
        }
        if(!response.state){
          response = {
              'state' : 'alert',
              'text' : 'Ce nom de partie n\'existe pas'
            };
        }
      }
      socket.emit('notification', response);
    });

    socket.on('disconnect', function () {
      
      for (var i = 0; i< games.length; i++ ) {
        if(games[i].socket == socket){
          games.splice(i, 1);
        }
      }
      
      var response = {};
      response.state = 'error';
      
      if('associateSocketScreen' in socket){
        socket.associateSocketScreen.emit('unlinkScreenKeypad');
        response.text = "Le portable associé s'est déconnecté";
        socket.associateSocketScreen.emit('notification', response);
      }
      
      if('associateSocketKeypad' in socket){
        socket.associateSocketKeypad.emit('unlinkScreenKeypad');
        response.text = "L'écran associé s'est déconnecté";
        socket.associateSocketKeypad.emit('notification', response);
      }
      
      
      sockets.splice(sockets.indexOf(socket), 1);
    });
    
    
    socket.on('devicemotion', function(data){
      socket.associateSocketScreen.emit('devicemotion', data);
    });
    
    socket.on('aClick', function(){
      socket.associateSocketScreen.emit('aClick');
    });
    
    socket.on('bClick', function(){
      socket.associateSocketScreen.emit('bClick');
    });
    
  });


server.listen(process.env.PORT || 3001, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Game server listening at", addr.address + ":" + addr.port);
});
