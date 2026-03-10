import express from "express";
import { createServer as createViteServer } from "vite";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = express();
const PORT = 3000;

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);
const storage = getStorage(appFirebase);

// Redirect route
app.get("/f/:shortKey", async (req, res) => {
  const { shortKey } = req.params;
  
  try {
    const docRef = doc(db, 'files', shortKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const storageRef = ref(storage, data.storagePath);
      const downloadUrl = await getDownloadURL(storageRef);
      return res.redirect(downloadUrl);
    } else {
      return res.status(404).send("File not found");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
