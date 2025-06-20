import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Инициализация на преводите

// Намираме "root" елемента от public/index.html
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// Рендираме главното приложение вътре в този елемент
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 