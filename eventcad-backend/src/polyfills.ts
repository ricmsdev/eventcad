/**
 * Polyfills necessários para compatibilidade
 */

// Polyfill para crypto no Node.js 18
import { webcrypto } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Garante que o crypto está disponível globalmente
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}

export {};