"use client";

import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Replace with your actual WhatsApp phone number (Country code + number, no '+' or spaces)
  const adminWhatsAppNumber = '919481969309'; 

  const handleWhatsAppResetRequest = (e) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim()) {
      alert('Please enter both your name and phone number.');
      return;
    }

    if (phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Construct the automatic pre-filled WhatsApp message
    const message = 
      `Hello Admin,%0A` +
      `I need to reset my password for my Food App account.%0A%0A` +
      `Name: ${encodeURIComponent(name)}%0A` +
      `Phone Number: ${encodeURIComponent(phoneNumber)}`;

    // Open WhatsApp Web / App directly in browser
    const url = `https://wa.me/${adminWhatsAppNumber}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password?</h1>
        <p style={styles.subtitle}>
          Enter your registered name and phone number below. We will redirect you to WhatsApp to reset your password.
        </p>

        <form onSubmit={handleWhatsAppResetRequest}>
          <label style={styles.label}>Your Full Name</label>
          <input
            type="text"
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            style={styles.input}
            placeholder="Enter your mobile number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <button type="submit" style={styles.whatsappButton}>
            Reset via WhatsApp
          </button>
        </form>

        <a href="/login" style={styles.backButton}>
          Back to Login
        </a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
    lineHeight: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#444',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '16px',
    color: '#333',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  whatsappButton: {
    width: '100%',
    backgroundColor: '#25D366', // Official WhatsApp Green
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  },
  backButton: {
    display: 'block',
    marginTop: '16px',
    textAlign: 'center',
    color: '#007AFF',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
};