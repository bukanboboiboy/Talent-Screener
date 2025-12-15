'use client';

import React from 'react';
import { Authenticator, View } from '@aws-amplify/ui-react';
import ConfigureAmplify from "./ConfigureAmplify";

// 1. Konfigurasi Label Form (Biar gak minta Username, tapi Email)
const formFields = {
  signIn: {
    username: {
      placeholder: 'Masukkan Email Kampus/Pribadi',
      label: 'Email', // Ubah label jadi Email
    },
    password: {
      label: 'Password',
      placeholder: 'Masukkan Password',
    },
  },
  signUp: {
    username: {
      label: 'Email',
      placeholder: 'Masukkan Email',
      order: 1,
    },
    password: {
      label: 'Password',
      placeholder: 'Min. 8 karakter, Huruf Besar, Kecil, Angka, Simbol',
      order: 2,
    },
    confirm_password: {
      label: 'Konfirmasi Password',
      placeholder: 'Ketik ulang password',
      order: 3,
    },
  },
};

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConfigureAmplify />
      
      {/* LOGIKA LAYOUT:
        Kita tidak lagi membungkus semuanya dengan 'flex items-center'.
        Tapi kita biarkan Authenticator mengatur dirinya sendiri dengan margin auto.
        Ini akan memperbaiki Dashboard yang hilang/gepeng.
      */}
      
      <Authenticator formFields={formFields}>
        {({ signOut, user }) => (
          <main>
            {/* Di sini konten website (Dashboard/Upload) dirender NORMAL 
              tanpa dipaksa ke tengah layar. 
            */}
            {children}
          </main>
        )}
      </Authenticator>

      {/* CSS Hack: Supaya form login ada di tengah, tapi dashboard aman */}
      <style jsx global>{`
        [data-amplify-authenticator] {
          margin-top: 5rem; /* Turunkan form login biar gak nempel atas */
          display: flex;
          justify-content: center;
        }
        /* Sembunyikan margin kalau user sudah login (konten utama muncul) */
        main [data-amplify-authenticator] {
          display: none; 
        }
      `}</style>
    </>
  );
}