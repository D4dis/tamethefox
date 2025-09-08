const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const port = 3000;
let users = [];

console.log('🚀 Serveur Socket.IO démarré...');

io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté - ID:', socket.id);

  // Envoyer la liste des utilisateurs à la connexion
  socket.emit('allUsers', users);

  // Gérer l'arrivée d'un nouvel utilisateur
  socket.on('newUser', (pseudo) => {
    console.log('🆕 Tentative de connexion avec le pseudo:', pseudo);

    // Vérifier si le pseudo existe déjà
    if (users.includes(pseudo)) {
      pseudo = pseudo + Math.floor(Math.random() * 100) + 1;
      console.log('📝 Pseudo modifié (déjà existant):', pseudo);
    }

    // Stocker le pseudo dans la session du socket
    socket.pseudo = pseudo;
    users.push(pseudo);

    console.log('✅ Utilisateur', pseudo, 'ajouté. Total:', users.length);
    console.log('📋 Liste actuelle:', users);

    // Confirmer la connexion à l'utilisateur
    socket.emit('resUser', true);

    // Notifier tous les clients du nouvel utilisateur
    io.emit('newUser', {
      pseudo: pseudo,
      message: pseudo + ' a rejoint le chat',
      status: 1
    });

    // Mettre à jour la liste pour tout le monde
    io.emit('allUsers', users);
  });

  // Gérer les messages
  socket.on('message', (message) => {
    console.log('💬 Message de', socket.pseudo || 'Anonyme', ':', message);

    if ( !message ) { message = 'Kenavo!'; }

    if (socket.pseudo) {
      io.emit('message', {
        pseudo: socket.pseudo,
        message: message,
        status: 0
      });
    } else {
      console.log('⚠️ Tentative d\'envoi de message sans pseudo');
    }
  });

  // Gérer la déconnexion volontaire
  socket.on('logout', (message) => {
    console.log('👋 Déconnexion volontaire de', socket.pseudo);

    if (socket.pseudo && users.includes(socket.pseudo)) {
      users.splice(users.indexOf(socket.pseudo), 1);

      const logoutMessage = message || socket.pseudo + ' a quitté le chat';

      io.emit('logout', {
        pseudo: socket.pseudo,
        message: logoutMessage,
        status: 2
      });

      io.emit('allUsers', users);
      console.log('📋 Liste après départ:', users);
    }
  });

  // Gérer la déconnexion forcée (fermeture navigateur)
  socket.on('disconnect', () => {
    console.log('❌ Déconnexion forcée - ID:', socket.id);

    if (socket.pseudo && users.includes(socket.pseudo)) {
      users.splice(users.indexOf(socket.pseudo), 1);
      console.log('🧹 Nettoyage:', socket.pseudo, 'retiré de la liste');

      io.emit('logout', {
        pseudo: socket.pseudo,
        message: socket.pseudo + ' a quitté le chat',
        status: 2
      });

      io.emit('allUsers', users);
      console.log('📋 Liste après nettoyage:', users);
    }
  });
});

server.listen(port, () => {
  console.log('🎯 Serveur écoute sur le port:', port);
  console.log('🌐 Application Angular sur: http://localhost:4200');
  console.log('✨ Socket.IO activée');
});