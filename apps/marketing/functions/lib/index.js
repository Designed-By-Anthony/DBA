"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWebhook = void 0;
const admin = require("firebase-admin");
// Initialize firebase admin
admin.initializeApp();
// Export functions here as you add them
var chatWebhook_1 = require("./chatWebhook");
Object.defineProperty(exports, "chatWebhook", { enumerable: true, get: function () { return chatWebhook_1.chatWebhook; } });
//# sourceMappingURL=index.js.map