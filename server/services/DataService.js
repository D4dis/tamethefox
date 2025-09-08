const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Message = require('../models/Message');

class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.messagesFile = path.join(this.dataDir, 'messages.json');
    
    this.users = new Map();
    this.messages = [];
    this.connectedUsers = new Map(); // socketId -> userId
    
    this.init();
  }

  async init() {
    try {
      // Créer le dossier data s'il n'existe pas
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Charger les données existantes
      await this.loadUsers();
      await this.loadMessages();
      
      console.log('📊 DataService initialisé');
      console.log(`👥 ${this.users.size} utilisateurs chargés`);
      console.log(`💬 ${this.messages.length} messages chargés`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du DataService:', error);
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf8');
      const usersArray = JSON.parse(data);
      
      this.users.clear();
      usersArray.forEach(userData => {
        const user = User.fromJSON(userData);
        this.users.set(user.id, user);
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      }
    }
  }

  async saveUsers() {
    try {
      const usersArray = Array.from(this.users.values()).map(user => user.toJSON());
      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des utilisateurs:', error);
    }
  }

  async loadMessages() {
    try {
      const data = await fs.readFile(this.messagesFile, 'utf8');
      const messagesArray = JSON.parse(data);
      
      this.messages = messagesArray.map(msgData => Message.fromJSON(msgData));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Erreur lors du chargement des messages:', error);
      }
    }
  }

  async saveMessages() {
    try {
      const messagesArray = this.messages.map(msg => msg.toJSON());
      await fs.writeFile(this.messagesFile, JSON.stringify(messagesArray, null, 2));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des messages:', error);
    }
  }

  // Gestion des utilisateurs
  createUser(emote) {
    const user = new User(emote);
    this.users.set(user.id, user);
    this.saveUsers();
    return user;
  }

  getUserById(userId) {
    return this.users.get(userId);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values())
      .map(userId => this.users.get(userId))
      .filter(Boolean);
  }

  connectUser(socketId, userId) {
    this.connectedUsers.set(socketId, userId);
    const user = this.users.get(userId);
    if (user) {
      user.socketId = socketId;
      user.updateActivity();
    }
  }

  disconnectUser(socketId) {
    const userId = this.connectedUsers.get(socketId);
    if (userId) {
      this.connectedUsers.delete(socketId);
      const user = this.users.get(userId);
      if (user) {
        user.socketId = null;
      }
      return userId;
    }
    return null;
  }

  assignPseudo(userId, pseudo, assignedBy) {
    const user = this.users.get(userId);
    if (user) {
      user.assignPseudo(pseudo, assignedBy);
      this.saveUsers();
      return user;
    }
    return null;
  }

  addUserNote(userId, noteContent, authorId) {
    const user = this.users.get(userId);
    if (user) {
      const note = user.addNote(noteContent, authorId);
      this.saveUsers();
      return note;
    }
    return null;
  }

  // Gestion des messages
  addMessage(message) {
    this.messages.push(message);
    
    // Garder seulement les 1000 derniers messages
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    
    this.saveMessages();
    return message;
  }

  getMessagesForUser(userId) {
    return this.messages.filter(msg => msg.canBeSeenBy(userId));
  }

  getAllPublicMessages() {
    return this.messages.filter(msg => !msg.isPrivate);
  }
}

module.exports = DataService;