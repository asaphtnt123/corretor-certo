// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase (deve ser a mesma usada em outros arquivos)
const firebaseConfig = {
    apiKey: "AIzaSyA-7HOp-Ycvyf3b_03ev__8aJEwAbWSQZY",
    authDomain: "connectfamilia-312dc.firebaseapp.com",
    projectId: "connectfamilia-312dc",
    storageBucket: "connectfamilia-312dc.appspot.com",
    messagingSenderId: "797817838649",
    appId: "1:797817838649:web:1aa7c54abd97661f8d81e8",
    measurementId: "G-QKN9NFXZZQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    Swal.fire({
        title: type === 'error' ? 'Erro!' : 'Sucesso!',
        text: message,
        icon: type,
        confirmButtonText: 'OK'
    });
}

// Função para carregar os detalhes do anúncio
async function carregarDetalhesAnuncio() {
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = urlParams.get('tipo');
    const id = urlParams.get('id');

    if (!tipo || !id) {
        showAlert('Anúncio não encontrado', 'error');
        window.location.href = 'index.html';
        return;
    }

    try {
        let docRef;
        if (tipo === 'imovel') {
            docRef = doc(db, "imoveis", id);
        } else if (tipo === 'automovel') {
            docRef = doc(db, "automoveis", id);
        } else {
            throw new Error('Tipo de anúncio inválido');
        }

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const anuncio = docSnap.data();
            anuncio.id = docSnap.id;
            exibirDetalhesAnuncio(anuncio, tipo);
        } else {
            showAlert('Anúncio não encontrado', 'error');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        showAlert('Erro ao carregar detalhes do anúncio', 'error');
        window.location.href = 'index.html';
    }
}

// Função para exibir os detalhes do anúncio
function exibirDetalhesAnuncio(anuncio, tipo) {
    const anuncioContainer = document.getElementById('anuncio-container');
    
    // Formatar preço
    const precoFormatado = anuncio.preco?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }) || 'Preço não informado';

    // Criar HTML dos detalhes específicos
    let detalhesEspecificos = '';
    if (tipo === 'imovel') {
        detalhesEspecificos = `
            <div class="detail-item">
                <span class="detail-label">Bairro</span>
                <span class="detail-value">${anuncio.bairro || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipo</span>
                <span class="detail-value">${anuncio.tipo || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Quartos</span>
                <span class="detail-value">${anuncio.quartos || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Banheiros</span>
                <span class="detail-value">${anuncio.banheiros || 'Não informado'}</span>
            </div>
        `;
    } else if (tipo === 'automovel') {
        detalhesEspecificos = `
            <div class="detail-item">
                <span class="detail-label">Marca</span>
                <span class="detail-value">${anuncio.marca || 'Não informada'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Modelo</span>
                <span class="detail-value">${anuncio.modelo || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ano</span>
                <span class="detail-value">${anuncio.ano || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">KM</span>
                <span class="detail-value">${anuncio.km ? anuncio.km.toLocaleString('pt-BR') + ' km' : 'Não informado'}</span>
            </div>
        `;
    }

    // Criar HTML do carrossel de imagens
    const imagensHTML = anuncio.imagens?.map((img, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" alt="${anuncio.titulo}">
        </div>
    `).join('') || `
        <div class="carousel-item active">
            <img src="images/default.jpg" class="d-block w-100" alt="Sem imagem">
        </div>
    `;

    // Criar HTML dos indicadores do carrossel
    const indicadoresHTML = anuncio.imagens?.map((_, index) => `
        <button type="button" data-bs-target="#anuncioCarousel" data-bs-slide-to="${index}" 
                class="${index === 0 ? 'active' : ''}" aria-current="${index === 0 ? 'true' : 'false'}"></button>
    `).join('') || '';

    // Montar o HTML completo
    anuncioContainer.innerHTML = `
        <div class="row">
            <div class="col-lg-8">
                <div id="anuncioCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                        ${indicadoresHTML}
                    </div>
                    <div class="carousel-inner rounded">
                        ${imagensHTML}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#anuncioCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#anuncioCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Próximo</span>
                    </button>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-body">
                        <h2 class="card-title">${anuncio.titulo || 'Sem título'}</h2>
                        <div class="price-display mb-3">${precoFormatado}</div>
                        
                        <div class="details-grid mb-4">
                            ${detalhesEspecificos}
                        </div>
                        
                        <button id="btnContato" class="btn btn-primary w-100 mb-3">
                            <i class="fas fa-envelope me-2"></i> Entrar em Contato
                        </button>
                        
                        <button id="btnFavorito" class="btn btn-outline-primary w-100">
                            <i class="fas fa-heart me-2"></i> Adicionar aos Favoritos
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Descrição</h3>
                        <p class="card-text">${anuncio.descricao || 'Nenhuma descrição fornecida.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Configurar eventos
    document.getElementById('btnContato')?.addEventListener('click', () => {
        // Implementar lógica de contato
        showAlert('Funcionalidade de contato será implementada em breve', 'info');
    });

    document.getElementById('btnFavorito')?.addEventListener('click', async () => {
        try {
            // Implementar lógica de favoritos
            showAlert('Funcionalidade de favoritos será implementada em breve', 'info');
        } catch (error) {
            console.error('Erro ao adicionar favorito:', error);
            showAlert('Erro ao adicionar aos favoritos', 'error');
        }
    });
}

// Carregar os detalhes quando a página for carregada
document.addEventListener('DOMContentLoaded', carregarDetalhesAnuncio);
