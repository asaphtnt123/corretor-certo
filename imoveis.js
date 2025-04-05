// imoveis.js - Lógica específica para imóveis

import { db } from './script.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Elementos DOM
const imoveisTab = document.getElementById('imoveis-tab');
const gradeImoveis = document.getElementById('grade-imoveis');
const filtrosImoveisForm = document.getElementById('filtros-imoveis');

// Carregar imóveis
export async function carregarImoveis(filtros = {}) {
    try {
        gradeImoveis.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Carregando imóveis...</span></div>';
        
        const imoveisRef = collection(db, "imoveis");
        let q = query(imoveisRef);
        
        // Aplicar filtros
        if (filtros.tipo) {
            q = query(q, where("tipo", "==", filtros.tipo));
        }
        
        if (filtros.negociacao) {
            q = query(q, where("negociacao", "==", filtros.negociacao));
        }
        
        if (filtros.precoMin) {
            q = query(q, where("preco", ">=", Number(filtros.precoMin)));
        }
        
        if (filtros.precoMax) {
            q = query(q, where("preco", "<=", Number(filtros.precoMax)));
        }
        
        if (filtros.quartos) {
            q = query(q, where("quartos", ">=", Number(filtros.quartos)));
        }
        
        if (filtros.banheiros) {
            q = query(q, where("banheiros", ">=", Number(filtros.banheiros)));
        }
        
        if (filtros.garagem) {
            q = query(q, where("garagem", ">=", Number(filtros.garagem)));
        }
        
        const querySnapshot = await getDocs(q);
        gradeImoveis.innerHTML = '';
        
        if (querySnapshot.empty) {
            gradeImoveis.innerHTML = '<div class="no-results"><p>Nenhum imóvel encontrado com os filtros selecionados.</p></div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const imovel = doc.data();
            imovel.id = doc.id;
            gradeImoveis.appendChild(criarCardImovel(imovel));
        });
        
    } catch (error) {
        console.error("Erro ao carregar imóveis:", error);
        gradeImoveis.innerHTML = `
            <div class="error-message">
                <p>Ocorreu um erro ao carregar os imóveis.</p>
                <button onclick="carregarImoveis()" class="retry-button">Tentar novamente</button>
            </div>
        `;
    }
}

// Criar card de imóvel
function criarCardImovel(imovel) {
    const card = document.createElement('div');
    card.className = 'ad-card imovel-card';
    
    // Características principais
    const caracteristicas = [];
    if (imovel.quartos) caracteristicas.push(`${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}`);
    if (imovel.banheiros) caracteristicas.push(`${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}`);
    if (imovel.garagem) caracteristicas.push(`${imovel.garagem} vaga${imovel.garagem > 1 ? 's' : ''}`);
    if (imovel.area) caracteristicas.push(`${imovel.area}m²`);
    
    // Imagem principal (ou placeholder)
    const imagemPrincipal = imovel.imagens && imovel.imagens.length > 0 ? 
        imovel.imagens[0] : 'images/default-imovel.jpg';
    
    card.innerHTML = `
        <div class="ad-image-container">
            <img src="${imagemPrincipal}" alt="${imovel.titulo}" class="ad-image" loading="lazy">
            <div class="ad-badge">${imovel.negociacao === 'venda' ? 'Venda' : 'Aluguel'}</div>
            <button class="favorite-btn" data-ad-id="${imovel.id}">
                <i class="far fa-heart"></i>
            </button>
        </div>
        <div class="ad-details">
            <h3 class="ad-title">${imovel.titulo || 'Imóvel sem título'}</h3>
            <p class="ad-location"><i class="fas fa-map-marker-alt"></i> ${imovel.bairro || 'Localização não informada'}</p>
            <div class="ad-features">
                ${caracteristicas.map(c => `<span>${c}</span>`).join('')}
            </div>
            <div class="ad-price-container">
                <p class="ad-price">R$ ${imovel.preco?.toLocaleString('pt-BR') || '--'}</p>
                <button class="ad-view-btn" data-ad-id="${imovel.id}" data-ad-type="imovel">Ver detalhes</button>
            </div>
        </div>
    `;
    
    // Eventos
    card.querySelector('.ad-view-btn').addEventListener('click', () => {
        openDetailsModal(imovel, false);
    });
    
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorito(imovel);
    });
    
    return card;
}

// Eventos
if (filtrosImoveisForm) {
    filtrosImoveisForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filtrosImoveisForm);
        const filtros = Object.fromEntries(formData.entries());
        carregarImoveis(filtros);
    });
    
    filtrosImoveisForm.addEventListener('reset', () => {
        carregarImoveis();
    });
}

// Carregar imóveis quando a aba for ativada
if (imoveisTab) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && imoveisTab.classList.contains('active')) {
                carregarImoveis();
            }
        });
    });
    
    observer.observe(imoveisTab, { attributes: true });
}
