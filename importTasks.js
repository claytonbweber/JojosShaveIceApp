const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const tasksData = require('./tasks.json');

const firebaseConfig = {
  apiKey: "AIzaSyBpkq5DgX3elAU1aBLAYbyUZJ6gF8_pcvE",
  authDomain: "jojo-s-management-app.firebaseapp.com",
  projectId: "jojo-s-management-app",
  storageBucket: "jojo-s-management-app.firebasestorage.app",
  messagingSenderId: "1057424025658",
  appId: "1:1057424025658:web:954b5ad6109119b4136d03",
  measurementId: "G-2SHLDTH3NB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importTasks() {
  const tabs = Object.keys(tasksData.tasks);
  for (const tab of tabs) {
    const docRef = doc(db, 'tasks', tab);
    await setDoc(docRef, tasksData.tasks[tab], { merge: true });
    console.log(`Imported tasks for ${tab}`);
  }
}

importTasks().catch(err => console.error('Error importing tasks:', err));