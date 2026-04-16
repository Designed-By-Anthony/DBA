import { google } from 'googleapis';

/**
 * Google Workspace SDK — Docs + Drive
 * 
 * Auth priority:
 * 1. OAuth2 with refresh token (uses YOUR Drive quota)
 * 2. Service account fallback (0 quota on Workspace — read-only)
 * 
 * Get a refresh token: visit /api/auth/google-token
 * Then add GOOGLE_REFRESH_TOKEN to .env.local
 */

function getAuth() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentials) {
    return new google.auth.GoogleAuth({
      keyFile: credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
      ],
    });
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

const auth = getAuth();
const docs = google.docs({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

// ============================================
// Google Docs — Contract Generation
// ============================================

/**
 * Generate an MSA contract from a template.
 * Creates a copy of the template and fills in client variables.
 */
export async function generateContract(params: {
  clientName: string;
  companyName: string;
  clientEmail: string;
  clientPhone: string;
  downPayment: number;
  completionPayment: number;
  monthlyRetainer: number;
  retainerTierName: string;
  crmTierName: string;
  effectiveDate?: string;
  clientAddress?: string;
  clientWebsite?: string;
  projectScope?: string;
}): Promise<{ docId: string; docUrl: string }> {
  const templateId = process.env.GOOGLE_DOCS_MSA_TEMPLATE_ID;
  const targetFolderId = process.env.GOOGLE_DRIVE_CONTRACTS_FOLDER_ID;

  if (!templateId) {
    throw new Error('GOOGLE_DOCS_MSA_TEMPLATE_ID not configured');
  }

  // Step 1: Copy the template
  const docTitle = `MSA — ${params.companyName || params.clientName} — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

  if (!targetFolderId) {
    throw new Error(
      'GOOGLE_DRIVE_CONTRACTS_FOLDER_ID not set. Create a "Contracts" folder in Google Drive, share it with firebase-adminsdk-fbsvc@dba-website-prod.iam.gserviceaccount.com as Editor, then add the folder ID to .env.local'
    );
  }

  // Step 1: Copy the template into the contracts folder
  const copy = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: docTitle,
      parents: targetFolderId ? [targetFolderId] : undefined,
    },
    supportsAllDrives: true,
  });

  const newDocId = copy.data.id!;

  // Step 2: Replace template variables
  // Any field we don't have defaults to a visible "[FILL: ___]" flag
  // so the recipient knows exactly what to complete
  const fill = (label: string) => `[FILL: ${label}]`;

  const replacements: Record<string, string> = {
    '{{DATE}}': params.effectiveDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    '{{CLIENT_NAME}}': params.clientName || fill('Client Full Name'),
    '{{CLIENT_COMPANY}}': params.companyName || params.clientName || fill('Company Name'),
    '{{CLIENT_EMAIL}}': params.clientEmail || fill('Client Email'),
    '{{CLIENT_PHONE}}': params.clientPhone || fill('Client Phone'),
    '{{DOWN_PAYMENT}}': params.downPayment ? `$${params.downPayment.toLocaleString()}` : fill('Down Payment Amount'),
    '{{COMPLETION_PAYMENT}}': params.completionPayment ? `$${params.completionPayment.toLocaleString()}` : fill('Completion Payment Amount'),
    '{{MONTHLY_RETAINER}}': params.monthlyRetainer ? `$${params.monthlyRetainer.toLocaleString()}` : fill('Monthly Retainer Amount'),
    '{{RETAINER_TIER}}': params.retainerTierName || fill('Service Tier'),
    '{{CRM_TIER}}': params.crmTierName || fill('CRM Tier'),
    '{{CLIENT_ADDRESS}}': params.clientAddress || fill('Client Address'),
    '{{CLIENT_WEBSITE}}': params.clientWebsite || fill('Client Website URL'),
    '{{PROJECT_SCOPE}}': params.projectScope || fill('Project Scope — Confirm in Writing'),
    // Also catch the plain-text "Client Company" in the signature block
    'Client Company': params.companyName || params.clientName || fill('Company Name'),
  };

  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText: value,
    },
  }));

  await docs.documents.batchUpdate({
    documentId: newDocId,
    requestBody: { requests },
  });

  // Step 3: Share with the client for e-signature
  try {
    await drive.permissions.create({
      fileId: newDocId,
      requestBody: {
        type: 'user',
        role: 'writer', // Writer so they can add their e-signature
        emailAddress: params.clientEmail,
      },
      sendNotificationEmail: true,
      emailMessage: `Hi ${params.clientName.split(' ')[0]},\n\nPlease review and sign your Master Service Agreement. Click the link to open in Google Docs, then use Insert → Signature to add your electronic signature.\n\nLooking forward to working together!\n\n— Anthony`,
    });
  } catch (shareErr) {
    console.warn('Could not auto-share contract:', shareErr);
    // Non-critical — admin can share manually
  }

  const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;
  return { docId: newDocId, docUrl };
}

// ============================================
// Google Drive — Client Folder Structure
// ============================================

/**
 * Create a structured folder for a new client in Google Drive.
 * Structure:
 *   Clients/
 *     └── {Company Name}/
 *         ├── Assets (logos, photos - shared with client)
 *         ├── Contracts
 *         └── Deliverables
 */
export async function createClientFolder(params: {
  clientName: string;
  companyName: string;
  clientEmail: string;
}): Promise<{ folderId: string; folderUrl: string; assetsFolderId: string }> {
  const parentFolderId = process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID;
  const folderName = params.companyName || params.clientName;

  // Create main client folder
  const mainFolder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    },
    fields: 'id, webViewLink',
  });

  const mainFolderId = mainFolder.data.id!;

  // Create subfolders
  const subfolders = ['Assets', 'Contracts', 'Deliverables'];
  const subfolderIds: Record<string, string> = {};

  for (const name of subfolders) {
    const sub = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolderId],
      },
      fields: 'id',
    });
    subfolderIds[name] = sub.data.id!;
  }

  // Share the Assets folder with the client so they can upload
  try {
    await drive.permissions.create({
      fileId: subfolderIds['Assets'],
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: params.clientEmail,
      },
      sendNotificationEmail: true,
      emailMessage: `Hi ${params.clientName.split(' ')[0]},\n\nPlease upload your logos, photos, and any assets for your website to this folder.\n\n— Anthony`,
    });
  } catch (shareErr) {
    console.warn('Could not auto-share Assets folder:', shareErr);
  }

  const folderUrl = mainFolder.data.webViewLink || `https://drive.google.com/drive/folders/${mainFolderId}`;

  return {
    folderId: mainFolderId,
    folderUrl,
    assetsFolderId: subfolderIds['Assets'],
  };
}
