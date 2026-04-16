import PreviewShell from "@/components/PreviewShell";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";

export default async function CustomerPreviewPage({ params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  const customerSlug = customer.toLowerCase();
  
  // Attempt to fetch the client configuration from Firebase Firestore
  let clientData = null;
  try {
    const docRef = db.collection('clients').doc(customerSlug);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Expecting Firestore document to have at least { name: "Nike", targetUrl: "https://..." }
      clientData = docSnap.data() as { name: string; targetUrl: string };
    }
  } catch (error) {
    // If the database fails or keys aren't set yet, we could trigger a Sentry report automatically here
    console.warn("Firestore fetch failed. Using fallback.", error);
  }

  // Graceful fallback for demo testing while you set up Firebase connection manually
  if (!clientData && customerSlug === 'demo') {
    clientData = {
      name: "Acme Corp (Fallback)",
      targetUrl: "https://example.com"
    };
  }

  // If client doesn't exist in Firestore and isn't the demo slug, throw Next.js 404
  if (!clientData) {
    return notFound();
  }

  return <PreviewShell clientName={clientData.name} targetUrl={clientData.targetUrl} />;
}
