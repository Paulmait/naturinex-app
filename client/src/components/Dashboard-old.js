import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

function Dashboard({ user }) {
  const [file, setFile] = useState(null);
  const [suggestions, setSuggestions] = useState("");

  const handleImage = (e) => {
    setFile(e.target.files[0]);
  };

  const handleScan = async () => {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    const today = new Date().toISOString().slice(0, 10);

    let scans = 0;

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.lastScanDate === today) {
        scans = data.scanCount;
      } else {
        await updateDoc(userRef, { scanCount: 0, lastScanDate: today });
      }
    } else {
      await setDoc(userRef, { scanCount: 0, lastScanDate: today });
    }

    if (scans >= 5) {
      alert("You’ve reached your daily limit of 5 scans.");
      return;
    }

    await updateDoc(userRef, {
      scanCount: scans + 1,
      lastScanDate: today
    });

    try {
      const res = await fetch('http://localhost:5000/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationName: "Advil" }) // TODO: Extract from barcode/image later
      });

      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      alert("AI is currently unavailable. Please try again later.");
    }
  };

  const handleEmail = () => {
    const mailto = `mailto:${user.email}?subject=Your Mediscan Results&body=${encodeURIComponent(suggestions)}`;
    window.location.href = mailto;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user.displayName}</h2>

      <input type="file" accept="image/*" onChange={handleImage} />
      <br /><br />

      <button onClick={handleScan}>Scan Medication</button>
      <br /><br />

      {suggestions && (
        <div>
          <h3>Natural Alternatives:</h3>
          <p>{suggestions}</p>
          <button onClick={handleEmail}>Email Results</button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
