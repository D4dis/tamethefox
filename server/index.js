const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

const port = process.env.PORT || 3000;

// Stockage des utilisateurs connectés
let users = new Map(); // Map pour une meilleure performance
let tamedNames = new Map(); // Stockage des noms apprivoisés par utilisateur

// Génération d'un ID unique pour chaque utilisateur
let userCounter = 1;

io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion - Socket ID:', socket.id);

  // Enregistrement d'un nouvel utilisateur avec emoji
  socket.on('newUser', (emojiWithNumber) => {
    console.log('👤 Nouvel utilisateur avec:', emojiWithNumber);

    // Extraire l'emoji du format "☀️ 123"
    const emoji = emojiWithNumber.split(' ')[0];
    const userNumber = userCounter++;

    const newUser = {
      id: socket.id,
      socketId: socket.id,
      number: userNumber,
      emoji: emoji,
      pseudo: `${emoji} ${userNumber}`, // Format: "☀️ 42"
      profile: {
        qualities: [],
        feelings: [],
        searches: [],
        shouldKnow: []
      },
      isOnline: true,
      lastActivity: Date.now()
    };

    users.set(socket.id, newUser);
    tamedNames.set(socket.id, new Map()); // Initialiser les noms apprivoisés pour cet utilisateur

    // Envoyer confirmation de connexion à l'utilisateur
    socket.emit('connected', {
      id: socket.id,
      pseudo: newUser.pseudo,
      emoji: newUser.emoji,
      number: newUser.number
    });

    // Envoyer la liste mise à jour à tous les utilisateurs
    broadcastUserList();

    console.log(`✅ Utilisateur ${newUser.pseudo} enregistré`);
  });

  // Envoi de message privé
  socket.on('message', (data) => {
    const sender = users.get(socket.id);
    if (!sender) {
      console.log('⌛ Expéditeur non trouvé');
      return;
    }

    // Si data est une string, c'est un message pour le chat général (qu'on ignore)
    // Si data est un objet avec recipientId, c'est un message privé
    if (typeof data === 'object' && data.recipientId && data.message) {
      const recipient = users.get(data.recipientId);
      if (!recipient) {
        socket.emit('error', { message: 'Destinataire non trouvé' });
        return;
      }

      const messageObj = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: socket.id,
        senderEmote: sender.emoji,
        senderDisplayName: sender.pseudo,
        recipientId: data.recipientId,
        message: data.message,
        timestamp: new Date(),
        type: 0 // Message normal
      };

      // Envoyer au destinataire
      io.to(data.recipientId).emit('private-message', messageObj);

      // Envoyer une copie à l'expéditeur pour confirmation
      socket.emit('private-message', messageObj);

      // Mettre à jour l'activité
      sender.lastActivity = Date.now();

      console.log(`💬 Message privé de ${sender.pseudo} à ${recipient.pseudo}`);
    }
  });

  // Apprivoiser un utilisateur (lui donner un nom)
  socket.on('tame-user', ({ userId, newName }) => {
    const tamer = users.get(socket.id);
    const targetUser = users.get(userId);

    if (!tamer || !targetUser) {
      socket.emit('error', { message: 'Utilisateur non trouvé' });
      return;
    }

    // Stocker le nom apprivoisé pour cet utilisateur
    const userTamedNames = tamedNames.get(socket.id);
    if (userTamedNames) {
      userTamedNames.set(userId, newName);

      // Envoyer la mise à jour à l'utilisateur
      socket.emit('user-tamed', {
        userId: userId,
        tamedName: newName
      });

      console.log(`🦊 ${tamer.pseudo} a apprivoisé ${targetUser.pseudo} comme "${newName}"`);
    }
  });

  // Ajouter une note au profil d'un utilisateur
  socket.on('add-profile-note', ({ userId, note, type }) => {
    const targetUser = users.get(userId);
    const author = users.get(socket.id);

    if (!targetUser || !author) {
      socket.emit('error', { message: 'Utilisateur non trouvé' });
      return;
    }

    // Ajouter la note au profil si elle n'existe pas déjà
    if (targetUser.profile[type] && !targetUser.profile[type].includes(note)) {
      targetUser.profile[type].push(note);

      // Notifier tous les utilisateurs de la mise à jour du profil
      io.emit('profile-updated', {
        userId: userId,
        profile: targetUser.profile
      });

      console.log(`📝 ${author.pseudo} a ajouté "${note}" au profil de ${targetUser.pseudo}`);
    }
  });

  // Voir son propre profil (IMPORTANT: envoyer le profil AVANT de le réinitialiser)
  socket.on('view-my-profile', () => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Utilisateur non trouvé' });
      return;
    }

    // IMPORTANT: Envoyer le profil AVANT la réinitialisation
    socket.emit('my-profile', {
      profile: {
        qualities: [...user.profile.qualities],  // Copie du profil actuel
        feelings: [...user.profile.feelings],
        searches: [...user.profile.searches],
        shouldKnow: [...user.profile.shouldKnow]
      },
      pseudo: user.pseudo,
      emoji: user.emoji
    });

    // Attendre un peu pour que le client ait le temps de recevoir et afficher le profil
    setTimeout(() => {
      // Réinitialiser le profil
      user.profile = {
        qualities: [],
        feelings: [],
        searches: [],
        shouldKnow: []
      };
      user.number = userCounter++;
      user.pseudo = `${user.emoji} ${user.number}`;

      // Réinitialiser les noms apprivoisés
      tamedNames.set(socket.id, new Map());

      // Notifier l'utilisateur de la réinitialisation
      socket.emit('profile-viewed', {
        message: 'Votre profil a été réinitialisé'
      });

      // Mettre à jour la liste pour tous
      broadcastUserList();

      console.log(`👁️ ${user.pseudo} a vu son profil et l'a réinitialisé`);
    }, 100); // Petit délai pour s'assurer que le profil est bien reçu
  });

  // Changer d'humeur (emoji)
  socket.on('change-mood', (newEmoji) => {
    const user = users.get(socket.id);
    if (!user) return;

    const oldEmoji = user.emoji;
    user.emoji = newEmoji;
    user.pseudo = `${newEmoji} ${user.number}`;

    // Notifier tous les utilisateurs
    broadcastUserList();

    console.log(`😊 ${user.number} a changé d'humeur: ${oldEmoji} → ${newEmoji}`);
  });

  // Obtenir la liste des utilisateurs
  socket.on('get-users', () => {
    sendUserListToSocket(socket);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`👋 ${user.pseudo} s'est déconnecté`);

      // Retirer l'utilisateur
      users.delete(socket.id);
      tamedNames.delete(socket.id);

      // Notifier tous les autres utilisateurs
      broadcastUserList();
    }
  });

  // Envoyer la liste initiale à la connexion
  sendUserListToSocket(socket);
});

// Fonction pour broadcaster la liste des utilisateurs
function broadcastUserList() {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    pseudo: user.pseudo,
    emoji: user.emoji,
    profile: user.profile,
    isOnline: user.isOnline
  }));

  io.emit('user-list', userList);
}

// Fonction pour envoyer la liste à un socket spécifique
function sendUserListToSocket(socket) {
  const userList = Array.from(users.values())
    .filter(user => user.id !== socket.id) // Ne pas inclure l'utilisateur lui-même
    .map(user => ({
      id: user.id,
      pseudo: user.pseudo,
      emoji: user.emoji,
      profile: user.profile,
      isOnline: user.isOnline
    }));

  socket.emit('user-list', userList);
}

// Nettoyer les utilisateurs inactifs toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  users.forEach((user, socketId) => {
    if (now - user.lastActivity > timeout) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      users.delete(socketId);
      tamedNames.delete(socketId);
      console.log(`⏰ Utilisateur ${user.pseudo} déconnecté pour inactivité`);
    }
  });

  if (users.size > 0) {
    broadcastUserList();
  }
}, 60000); // Vérifier chaque minute

server.listen(port, () => {
  console.log(`🚀 Serveur Tame the Fox démarré sur http://localhost:${port}`);
  console.log('📡 Socket.IO en écoute...');
});
