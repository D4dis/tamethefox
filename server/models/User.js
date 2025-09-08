// const { v4: uuidv4 } = require('uuid');
//
// class User {
//   constructor(emote) {
//     this.id = uuidv4();
//     this.emote = emote;
//     this.assignedPseudo = null;
//     this.assignedBy = null;
//     this.notes = [];
//     this.createdAt = new Date();
//     this.lastActivity = new Date();
//     this.socketId = null;
//   }
//
//   addNote(content, authorId) {
//     const note = {
//       id: uuidv4(),
//       content,
//       authorId,
//       createdAt: new Date()
//     };
//     this.notes.push(note);
//     return note;
//   }
//
//   assignPseudo(pseudo, assignedBy) {
//     this.assignedPseudo = pseudo;
//     this.assignedBy = assignedBy;
//     this.lastActivity = new Date();
//   }
//
//   updateActivity() {
//     this.lastActivity = new Date();
//   }
//
//   getDisplayName() {
//     return this.assignedPseudo || this.emote;
//   }
//
//   toJSON() {
//     return {
//       id: this.id,
//       emote: this.emote,
//       assignedPseudo: this.assignedPseudo,
//       assignedBy: this.assignedBy,
//       notes: this.notes,
//       createdAt: this.createdAt,
//       lastActivity: this.lastActivity
//     };
//   }
//
//   static fromJSON(data) {
//     const user = Object.assign(new User(), data);
//     user.createdAt = new Date(user.createdAt);
//     user.lastActivity = new Date(user.lastActivity);
//     user.notes = user.notes.map(note => ({
//       ...note,
//       createdAt: new Date(note.createdAt)
//     }));
//     return user;
//   }
// }
//
// module.exports = User;
