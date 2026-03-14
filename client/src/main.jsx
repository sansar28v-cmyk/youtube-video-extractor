import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: '#14141c',
                    color: '#f0f0f5',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                },
                success: { iconTheme: { primary: '#ff0000', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ff4444', secondary: '#fff' } },
            }}
        />
    </React.StrictMode>
);
