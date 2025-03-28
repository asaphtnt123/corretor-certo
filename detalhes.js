document.addEventListener("DOMContentLoaded", function() {
    // Obter ID do anúncio da URL
    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    const tipoAnuncio = urlParams.get('tipo'); // 'imovel' ou 'automovel'

    if (anuncioId && tipoAnuncio) {
        carregarDetalhesAnuncio(anuncioId, tipoAnuncio);
    } else {
        // Redirecionar ou mostrar mensagem de erro
        document.querySelector('.property-details').innerHTML = `
            <div class="error-message">
                <h2>Anúncio não encontrado</h2>
                <p>O anúncio solicitado não está disponível.</p>
                <a href="index.html" class="btn-contact">Voltar à página inicial</a>
            </div>
        `;
    }
});

async function carregarDetalhesAnuncio(id, tipo) {
    try {
        // Substitua com sua lógica de busca no Firebase
        const docRef = doc(db, tipo === 'imovel' ? 'imoveis' : 'automoveis', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            preencherDetalhes(data, tipo);
            configurarCarrossel(data.imagens || ["images/default.jpg"]);
        } else {
            throw new Error("Documento não encontrado");
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        document.querySelector('.property-details').innerHTML = `
            <div class="error-message">
                <h2>Erro ao carregar anúncio</h2>
                <p>${error.message}</p>
                <a href="index.html" class="btn-contact">Voltar à página inicial</a>
            </div>
        `;
    }
}

function preencherDetalhes(data, tipo) {
    if (tipo === 'imovel') {
        document.getElementById('detailTitle').textContent = data.titulo || "Imóvel sem título";
        document.getElementById('detailPrice').textContent = data.preco ? `R$ ${data.preco.toLocaleString('pt-BR')}` : "Preço não informado";
        document.getElementById('detailLocation').textContent = data.bairro || "Localização não informada";
        document.getElementById('detailArea').textContent = data.area ? `${data.area} m²` : "Área não informada";
        document.getElementById('detailBedrooms').textContent = data.quartos || "0";
        document.getElementById('detailBathrooms').textContent = data.banheiros || "0";
        document.getElementById('detailDescription').textContent = data.descricao || "Sem descrição disponível";
        
        const featuresList = document.getElementById('detailFeatures');
        featuresList.innerHTML = '';
        
        const features = [
            `Tipo: ${data.tipo || 'Não informado'}`,
            `Mobiliado: ${data.mobiliado ? 'Sim' : 'Não'}`,
            `Vagas: ${data.vagas || '0'}`,
            `Condomínio: ${data.condominio ? `R$ ${data.condominio.toLocaleString('pt-BR')}` : 'Não informado'}`,
            `IPTU: ${data.iptu ? `R$ ${data.iptu.toLocaleString('pt-BR')}` : 'Não informado'}`,
            `Andar: ${data.andar || 'Não informado'}`
        ];
        
        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
    } else {
        // Implemente similarmente para automóveis
    }
}

function configurarCarrossel(imagens) {
    const mainCarousel = document.getElementById('mainCarousel');
    const thumbnailsContainer = document.querySelector('.carousel-thumbnails');
    
    // Limpa o carrossel
    mainCarousel.innerHTML = '';
    thumbnailsContainer.innerHTML = '';
    
    // Adiciona imagens principais
    imagens.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = "Imagem do anúncio";
        imgElement.style.display = index === 0 ? 'block' : 'none';
        imgElement.classList.add(index === 0 ? 'active' : '');
        mainCarousel.appendChild(imgElement);
        
        // Adiciona miniaturas
        const thumb = document.createElement('img');
        thumb.src = img;
        thumb.alt = "Miniatura";
        thumb.classList.add(index === 0 ? 'active-thumb' : '');
        thumb.addEventListener('click', () => {
            // Remove classe active de todas as imagens
            document.querySelectorAll('#mainCarousel img').forEach(img => {
                img.style.display = 'none';
                img.classList.remove('active');
            });
            
            // Adiciona classe active para a imagem clicada
            imgElement.style.display = 'block';
            imgElement.classList.add('active');
            
            // Atualiza miniaturas ativas
            document.querySelectorAll('.carousel-thumbnails img').forEach(t => {
                t.classList.remove('active-thumb');
            });
            thumb.classList.add('active-thumb');
        });
        
        thumbnailsContainer.appendChild(thumb);
    });
}
