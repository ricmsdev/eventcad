// Script de inicialização com polyfill crypto
const { webcrypto } = require('crypto');

// Adiciona crypto ao global
if (!global.crypto) {
  global.crypto = webcrypto;
}

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// Inicia a aplicação
require('./dist/main');