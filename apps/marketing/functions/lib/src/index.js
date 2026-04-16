"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAudit = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
// Initialize firebase admin
admin.initializeApp();
exports.runAudit = functions.https.onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        const { targetUrl } = req.body;
        if (!targetUrl) {
            res.status(400).json({ error: 'Target URL is required' });
            return;
        }
        // The API key stored as a base64 string for Basic Auth
        // e.g. "mozscape-hl8iOpb8DN:jThUm4Ezr8m5QPvfla7hARbWdhLgMVDg" encoded
        const apiKey = process.env.MOZ_LOCAL_API_KEY;
        if (!apiKey) {
            console.error('Missing MOZ_LOCAL_API_KEY environment variable');
            res.status(500).json({ error: 'Internal Server Error: Missing API config' });
            return;
        }
        // Mozscape v2 url_metrics endpoint
        const response = await fetch('https://lsapi.seomoz.com/v2/url_metrics', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targets: [targetUrl],
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Moz API Error:', response.status, errorText);
            res.status(response.status).json({ error: 'External API Error', details: errorText });
            return;
        }
        const data = await response.json();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error('Audit execution error:', error);
        res.status(500).json({ error: 'Internal server error while processing audit.' });
    }
});
//# sourceMappingURL=index.js.map