import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';

// Expõe o carregador local ao jogo clássico, sem carregar modelos de terceiros em runtime.
window.CorridaFinanceiraV2GLTFLoader = GLTFLoader;
window.dispatchEvent(new Event('corrida-financeira-v2-gltf-ready'));
