const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const DataService = require('./services/DataService');
const User = require('./models/User');
const Message = require('./models/Message');

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
const dataService = new DataService();

console.log('🚀 Serveur Socket.IO démarré...');

io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté - ID:', socket.id);

  // Envoyer la liste des utilisateurs connectés à la connexion
  const connectedUsers = dataService.getConnectedUsers();
  socket.emit('allUsers', connectedUsers.map(user => user.toJSON()));

  // Gérer l'arrivée d'un nouvel utilisateur
  socket.on('newUser', (emote) => {
    console.log('🆕 Tentative de connexion avec l\'emote:', emote);

    try {
      // Créer un nouvel utilisateur
      const user = dataService.createUser(emote);

      // Connecter l'utilisateur
      dataService.connectUser(socket.id, user.id);
      socket.userId = user.id;

      console.log('✅ Utilisateur', user.getDisplayName(), 'créé avec ID:', user.id);

      // Confirmer la connexion à l'utilisateur avec son ID
      socket.emit('resUser', { success: true, userId: user.id });

      // Créer et broadcaster le message de connexion
      const joinMessage = Message.createJoinMessage(user);
      dataService.addMessage(joinMessage);
      io.emit('newUser', joinMessage.toJSON());

      // Mettre à jour la liste des utilisateurs connectés pour tout le monde
      const updatedUsers = dataService.getConnectedUsers();
      io.emit('allUsers', updatedUsers.map(u => u.toJSON()));

      console.log('📋 Utilisateurs connectés:', updatedUsers.length);
    } catch (error) {
      console.error('❌ Erreur lors de la création d\'utilisateur:', error);
      socket.emit('resUser', { success: false });
    }
  });

  // Gérer les messages
  socket.on('message', (messageData) => {
    console.log('💬 Message reçu:', messageData);

    if (!socket.userId) {
      console.log('⚠️ Tentative d\'envoi de message sans utilisateur connecté');
      return;
    }

    const user = dataService.getUserById(socket.userId);
    if (!user) {
      console.log('⚠️ Utilisateur introuvable');
      return;
    }

    try {
      let messageContent, isPrivate = false, targetUserId = null;

      if (typeof messageData === 'string') {
        messageContent = messageData || 'Kenavo!';
      } else {
        messageContent = messageData.message || 'Kenavo!';
        isPrivate = messageData.isPrivate || false;
        targetUserId = messageData.targetUserId || null;
      }

      // Créer le message
      const message = new Message(
        user.id,
        user.emote,
        user.getDisplayName(),
        messageContent,
        0,
        isPrivate,
        targetUserId
      );

      // Sauvegarder le message
      dataService.addMessage(message);

      console.log('💬 Message de', user.getDisplayName(), ':', messageContent, isPrivate ? '(privé)' : '(public)');

      // Envoyer le message
      if (isPrivate && targetUserId) {
        // Message privé : envoyer seulement à l'expéditeur et au destinataire
        const targetUser = dataService.getUserById(targetUserId);
        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit('message', message.toJSON());
        }
        socket.emit('message', message.toJSON()); // Confirmer à l'expéditeur
      } else {
        // Message public : envoyer à tous
        io.emit('message', message.toJSON());
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
    }
  });

  // Gérer l'assignment de pseudo
  socket.on('assignPseudo', ({ userId, pseudo }) => {
    console.log('✏️ Assignment de pseudo:', { userId, pseudo });

    if (!socket.userId) {
      console.log('⚠️ Tentative d\'assignment sans utilisateur connecté');
      return;
    }

    const assignedUser = dataService.assignPseudo(userId, pseudo, socket.userId);
    if (assignedUser) {
      // Notifier tous les clients de la mise à jour
      io.emit('userUpdated', assignedUser.toJSON());
      console.log('✅ Pseudo assigné:', pseudo, 'à', assignedUser.emote);
    }
  });

  // Gérer l'ajout de notes
  socket.on('addUserNote', ({ userId, noteContent }) => {
    console.log('📝 Ajout de note:', { userId, noteContent });

    if (!socket.userId) {
      console.log('⚠️ Tentative d\'ajout de note sans utilisateur connecté');
      return;
    }

    const note = dataService.addUserNote(userId, noteContent, socket.userId);
    if (note) {
      const user = dataService.getUserById(userId);
      // Notifier tous les clients de la mise à jour
      io.emit('userUpdated', user.toJSON());
      console.log('✅ Note ajoutée à', user.getDisplayName());
    }
  });

  // Gérer la déconnexion volontaire
  socket.on('logout', (customMessage) => {
    if (!socket.userId) return;

    const user = dataService.getUserById(socket.userId);
    if (user) {
      console.log('👋 Déconnexion volontaire de', user.getDisplayName());

      // Créer le message de départ
      const leaveMessage = Message.createLeaveMessage(user, customMessage);
      dataService.addMessage(leaveMessage);

      // Déconnecter l'utilisateur
      dataService.disconnectUser(socket.id);

      // Notifier tous les clients
      io.emit('logout', leaveMessage.toJSON());

      // Mettre à jour la liste des utilisateurs connectés
      const connectedUsers = dataService.getConnectedUsers();
      io.emit('allUsers', connectedUsers.map(u => u.toJSON()));

      console.log('📋 Utilisateurs connectés après départ:', connectedUsers.length);
    }
  });

  // Gérer la déconnexion forcée (fermeture navigateur)
  socket.on('disconnect', () => {
    console.log('❌ Déconnexion forcée - ID:', socket.id);

    const userId = dataService.disconnectUser(socket.id);
    if (userId) {
      const user = dataService.getUserById(userId);
      if (user) {
        console.log('🧹 Nettoyage:', user.getDisplayName(), 'déconnecté');

        // Créer le message de départ
        const leaveMessage = Message.createLeaveMessage(user);
        dataService.addMessage(leaveMessage);

        // Notifier tous les clients
        io.emit('logout', leaveMessage.toJSON());

        // Mettre à jour la liste des utilisateurs connectés
        const connectedUsers = dataService.getConnectedUsers();
        io.emit('allUsers', connectedUsers.map(u => u.toJSON()));

        console.log('📋 Utilisateurs connectés après nettoyage:', connectedUsers.length);
      }
    }
  });
});

server.listen(port, () => {
  console.log('🎯 Serveur écoute sur le port:', port);
  console.log('🌐 Application Angular sur: http://localhost:4200');
  console.log('✨ Socket.IO activée');
});
