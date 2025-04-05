// automoveis.js - Lógica específica para automóveis

import { db } from './script.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Elementos DOM
const automoveisTab = document.getElementById('automoveis-tab');
const gradeAutomoveis = document.getElementById('grade-automoveis');
const filtrosAutomoveisForm = document.getElementById('filtros-automoveis');

// Carregar automóveis
export async function carregarAutomoveis(filtros = {}) {
    try {
        gradeAutomoveis.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Carregando automóveis...</span></div>';
        
        const automoveisRef = collection(db, "automoveis");
        let q = query(automoveisRef);
        
        // Aplicar filtros
        if (filtros.marca) {
            q = query(q, where("marca", "==", filtros.marca));
        }
        
        if (filtros.modelo) {
            q = query(q, where("modelo", "==", filtros.modelo));
        }
        
        if (filtros.anoMin) {
            q = query(q, where("ano", ">=", Number(filtros.anoMin)));
        }
        
        if (filtros.anoMax) {
            q = query(q, where("ano", "<=", Number(filtros.anoMax)));
        }
        
        if (filtros.precoMin) {
            q = query(q, where("preco", ">=", Number(filtros.precoMin)));
        }
        
        if (filtros.precoMax) {
            q = query(q, where("preco", "<=", Number(filtros.precoMax)));
        }
        
        if (filtros.combustivel) {
            q = query(q, where("combustivel", "==", filtros.combustivel));
        }
        
        const querySnapshot = await getDocs(q);
        gradeAutomoveis.innerHTML = '';
        
        if (querySnapshot.empty) {
            gradeAutomoveis.innerHTML = '<div class="no-results"><p>Nenhum automóvel encontrado com os filtros selecionados.</p></div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const automovel = doc.data();
            automovel.id = doc.id;
            gradeAutomoveis.appendChild(criarCardAutomovel(automovel));
        });
        
    } catch (error) {
        console.error("Erro ao carregar automóveis:", error);
        gradeAutomoveis.innerHTML = `
            <div class="error-message">
                <p>Ocorreu um erro ao carregar os automóveis.</p>
                <button onclick="carregarAutomoveis()" class="retry-button">Tentar novamente</button>
            </div>
        `;
    }
}

// Criar card de automóvel
function criarCardAutomovel(automovel) {
    const card = document.createElement('div');
    card.className = 'ad-card automovel-card';
    
    // Características principais
    const caracteristicas = [];
    if (automovel.marca) caracteristicas.push(automovel.marca);
    if (automovel.modelo) caracteristicas.push(automovel.modelo);
    if (automovel.ano) caracteristicas.push(automovel.ano);
    
    // Imagem principal (ou placeholder)
    const imagemPrincipal = automovel.imagens && automovel.imagens.length > 0 ? 
        automovel.imagens[0] : 'images/default-automovel.jpg';
    
    card.innerHTML = `
        <div class="ad-image-container">
            <img src="${imagemPrincipal}" alt="${automovel.titulo}" class="ad-image" loading="lazy">
            <button class="favorite-btn" data-ad-id="${automovel.id}">
                <i class="far fa-heart"></i>
            </button>
        </div>
        <div class="ad-details">
            <h3 class="ad-title">${automovel.titulo || 'Automóvel sem título'}</h3>
            <div class="ad-features">
                ${caracteristicas.map(c => `<span>${c}</span>`).join('')}
            </div>
            <div class="ad-price-container">
                <p class="ad-price">R$ ${automovel.preco?.toLocaleString('pt-BR') || '--'}</p>
                <button class="ad-view-btn" data-ad-id="${automovel.id}" data-ad-type="automovel">Ver detalhes</button>
            </div>
        </div>
    `;
    
    // Eventos
    card.querySelector('.ad-view-btn').addEventListener('click', () => {
        openDetailsModal(automovel, true);
    });
    
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorito(automovel);
    });
    
    return card;
}

// Eventos
if (filtrosAutomoveisForm) {
    filtrosAutomoveisForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filtrosAutomoveisForm);
        const filtros = {
            marca: formData.get('marca-automovel'),
            modelo: formData.get('modelo-automovel'),
            anoMin: formData.get('ano-min-automovel'),
            anoMax: formData.get('ano-max-automovel'),
            precoMin: formData.get('preco-min-automovel'),
            precoMax: formData.get('preco-max-automovel'),
            combustivel: formData.get('combustivel-automovel')
        };
        carregarAutomoveis(filtros);
    });
    
    filtrosAutomoveisForm.addEventListener('reset', () => {
        carregarAutomoveis();
    });
}

// Carregar automóveis quando a aba for ativada
if (automoveisTab) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && automoveisTab.classList.contains('active')) {
                carregarAutomoveis();
            }
        });
    });
    
    observer.observe(automoveisTab, { attributes: true });
}
