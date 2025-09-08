// const { v4: uuidv4 } = require('uuid');
//
// class Message {
//   constructor(senderId, senderEmote, senderDisplayName, message, status = 0, isPrivate = false, targetUserId = null) {
//     this.id = uuidv4();
//     this.senderId = senderId;
//     this.senderEmote = senderEmote;
//     this.senderDisplayName = senderDisplayName;
//     this.message = message;
//     this.status = status; // 0: normal, 1: join, 2: leave
//     this.isPrivate = isPrivate;
//     this.targetUserId = targetUserId;
//     this.timestamp = new Date();
//     this.readBy = []; // pour les messages privés
//   }
//
//   markAsRead(userId) {
//     if (!this.readBy.includes(userId)) {
//       this.readBy.push(userId);
//     }
//   }
//
//   isReadBy(userId) {
//     return this.readBy.includes(userId);
//   }
//
//   canBeSeenBy(userId) {
//     if (!this.isPrivate) return true;
//     return this.senderId === userId || this.targetUserId === userId;
//   }
//
//   toJSON() {
//     return {
//       id: this.id,
//       senderId: this.senderId,
//       senderEmote: this.senderEmote,
//       senderDisplayName: this.senderDisplayName,
//       message: this.message,
//       status: this.status,
//       isPrivate: this.isPrivate,
//       targetUserId: this.targetUserId,
//       timestamp: this.timestamp,
//       readBy: this.readBy
//     };
//   }
//
//   static fromJSON(data) {
//     const message = Object.assign(new Message(), data);
//     message.timestamp = new Date(message.timestamp);
//     return message;
//   }
//
//   static createJoinMessage(user) {
//     return new Message(
//       user.id,
//       user.emote,
//       user.getDisplayName(),
//       `${user.getDisplayName()} a rejoint le chat`,
//       1,
//       false
//     );
//   }
//
//   static createLeaveMessage(user, customMessage = null) {
//     const message = customMessage || `${user.getDisplayName()} a quitté le chat`;
//     return new Message(
//       user.id,
//       user.emote,
//       user.getDisplayName(),
//       message,
//       2,
//       false
//     );
//   }
// }
//
// module.exports = Message;
