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
let users = {}; // Change en objet pour stocker les infos complètes

// Mapping emoji
const emojiMapping = {
  'sunny': '☀️',
  'cloud': '☁️', 
  'question': '❓'
};

console.log('🚀 Serveur Socket.IO démarré...');

io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté - ID:', socket.id);

  // Envoyer la liste des utilisateurs à la connexion
  socket.emit('allUsers', Object.values(users).map(u => u.displayName));

  // Gérer l'arrivée d'un nouvel utilisateur avec emoji
  socket.on('newUser', (emojiKey) => {
    console.log('🆕 Tentative de connexion avec emoji:', emojiKey);
    
    const emoji = emojiMapping[emojiKey] || '❓';
    const randomNum = Math.floor(Math.random() * 1000);
    
    const user = {
      id: socket.id,
      emote: emoji,
      emojiKey: emojiKey,
      assignedPseudo: null,
      assignedBy: null,
      displayName: `${emoji} ${randomNum}`, // Nom affiché temporaire
      notes: []
    };
    
    // Stocker l'utilisateur
    socket.user = user;
    users[socket.id] = user;
    
    console.log('✅ Utilisateur ajouté:', user.displayName, 'Total:', Object.keys(users).length);
    console.log('📋 Liste actuelle:', Object.values(users).map(u => u.displayName));
    
    // Confirmer la connexion à l'utilisateur
    socket.emit('resUser', true);
    
    // Notifier tous les clients du nouvel utilisateur
    io.emit('newUser', {
      pseudo: user.displayName,
      message: user.displayName + ' a rejoint le chat',
      status: 1
    });
    
    // Mettre à jour la liste pour tout le monde
    io.emit('allUsers', Object.values(users).map(u => u.displayName));
  });

  // Gérer les messages
  socket.on('message', (message) => {
    const user = socket.user;
    console.log('💬 Message de', user?.displayName || 'Anonyme', ':', message);

    if (!message) { message = 'Kenavo!'; }

    if (user) {
      io.emit('message', {
        pseudo: user.displayName,
        message: message,
        status: 0,
        senderId: user.id,
        senderEmote: user.emote
      });
    } else {
      console.log('⚠️ Tentative d\'envoi de message sans utilisateur');
    }
  });

  // Gérer la déconnexion volontaire
  socket.on('logout', (message) => {
    const user = socket.user;
    console.log('👋 Déconnexion volontaire de', user?.displayName);

    if (user && users[socket.id]) {
      delete users[socket.id];

      const logoutMessage = message || user.displayName + ' a quitté le chat';

      io.emit('logout', {
        pseudo: user.displayName,
        message: logoutMessage,
        status: 2
      });

      io.emit('allUsers', Object.values(users).map(u => u.displayName));
      console.log('📋 Liste après départ:', Object.values(users).map(u => u.displayName));
    }
  });

  // Gérer la déconnexion forcée (fermeture navigateur)
  socket.on('disconnect', () => {
    const user = socket.user;
    console.log('❌ Déconnexion forcée - ID:', socket.id);

    if (user && users[socket.id]) {
      delete users[socket.id];
      console.log('🧹 Nettoyage:', user.displayName, 'retiré de la liste');

      io.emit('logout', {
        pseudo: user.displayName,
        message: user.displayName + ' a quitté le chat',
        status: 2
      });

      io.emit('allUsers', Object.values(users).map(u => u.displayName));
      console.log('📋 Liste après nettoyage:', Object.values(users).map(u => u.displayName));
    }
  });

  // Permettre à un utilisateur d'assigner un pseudo à un autre
  socket.on('assignPseudo', (data) => {
    const { targetUserId, newPseudo } = data;
    const assignerUser = socket.user;
    const targetUser = users[targetUserId];
    
    if (assignerUser && targetUser && newPseudo?.trim()) {
      targetUser.assignedPseudo = newPseudo.trim();
      targetUser.assignedBy = assignerUser.id;
      targetUser.displayName = `${targetUser.emote} ${newPseudo.trim()}`;
      
      console.log(`📝 ${assignerUser.displayName} a assigné le pseudo "${newPseudo}" à ${targetUser.emote}`);
      
      // Notifier tous les clients du changement
      io.emit('pseudoAssigned', {
        targetUserId,
        newPseudo: newPseudo.trim(),
        assignedBy: assignerUser.displayName,
        newDisplayName: targetUser.displayName
      });
      
      // Mettre à jour la liste des utilisateurs
      io.emit('allUsers', Object.values(users).map(u => u.displayName));
    }
  });
});

server.listen(port, () => {
  console.log('🎯 Serveur écoute sur le port:', port);
  console.log('🌐 Application Angular sur: http://localhost:4200');
  console.log('✨ Socket.IO activée');
});
