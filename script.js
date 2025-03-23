import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
    authDomain: "corretorcerto-76933.firebaseapp.com",
    projectId: "corretorcerto-76933",
    storageBucket: "corretorcerto-76933.appspot.com",
    messagingSenderId: "357149829474",
    appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Ativa a persistência de autenticação
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistência ativada!"))
    .catch((error) => console.error("Erro na persistência:", error));

// Função para mudar a imagem no carrossel
function mudarImagem(carrosselId, direcao) {
    const carrossel = document.getElementById(carrosselId);
    if (!carrossel) return;

    const imagens = carrossel.querySelectorAll('.carrossel-img');
    let indexAtivo = -1;

    imagens.forEach((imagem, index) => {
        if (imagem.style.display === 'block') indexAtivo = index;
    });

    let novoIndex = indexAtivo + direcao;
    if (novoIndex < 0) novoIndex = imagens.length - 1;
    else if (novoIndex >= imagens.length) novoIndex = 0;

    imagens[indexAtivo].style.display = 'none';
    imagens[novoIndex].style.display = 'block';
}

// Torna a função mudarImagem acessível globalmente
window.mudarImagem = mudarImagem;

// Função para carregar imóveis em destaque
async function carregarImoveisDestaque() {
    try {
        const destaqueRef = collection(db, "imoveis");
        const destaqueQuery = query(destaqueRef, where("destaque", "==", true));
        const querySnapshot = await getDocs(destaqueQuery);

        const destaqueContainer = document.getElementById("destaqueContainer");
        if (!destaqueContainer) return;

        destaqueContainer.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const titulo = data.titulo || "Título não disponível";
            const imagens = data.imagens?.length > 0 ? data.imagens : ["images/default.jpg"];
            const carrosselId = `carrossel-${doc.id}`;

            const itemDiv = document.createElement("div");
            itemDiv.classList.add("destaque-item");
            itemDiv.innerHTML = `
                <div class="carrossel" id="${carrosselId}">
                    <div class="carrossel-imagens">
                        ${imagens.map((imagem, index) => `
                            <img src="${imagem}" alt="${titulo}" class="carrossel-img" style="display: ${index === 0 ? 'block' : 'none'}" loading="lazy">
                        `).join('')}
                    </div>
                    <button class="carrossel-seta carrossel-seta-esquerda" onclick="mudarImagem('${carrosselId}', -1)">&#10094;</button>
                    <button class="carrossel-seta carrossel-seta-direita" onclick="mudarImagem('${carrosselId}', 1)">&#10095;</button>
                </div>
                <h3>${titulo}</h3>
                <p>${data.descricao || "Sem descrição"}</p>
                <p><strong>Preço:</strong> R$ ${data.preco || "Preço não informado"}</p>
                <a href="#" class="btn-view-more">Ver Mais</a>
            `;

            destaqueContainer.appendChild(itemDiv);
        });
    } catch (error) {
        console.error("Erro ao carregar destaques:", error);
    }
}

// Função para fazer upload de imagens
async function uploadImagens(imagens, tipo) {
    const urls = [];
    for (let i = 0; i < imagens.length; i++) {
        const file = imagens[i];
        const storageRef = ref(storage, `${tipo}/${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
        }
    }
    return urls;
}

// Função para lidar com o formulário de imóvel
async function handleFormImovelSubmit(e) {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const tipo = document.getElementById("tipo").value;
    const preco = parseFloat(document.getElementById("preco").value);
    const quartos = parseInt(document.getElementById("quartos").value);
    const banheiros = parseInt(document.getElementById("banheiros").value);
    const bairro = document.getElementById("bairro").value;
    const imagens = document.getElementById("imagens").files;

    const imagensURLs = await uploadImagens(imagens, "imoveis");

    try {
        await addDoc(collection(db, "imoveis"), {
            titulo,
            descricao,
            tipo,
            preco,
            quartos,
            banheiros,
            bairro,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            data: new Date()
        });
        alert("Imóvel anunciado com sucesso!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro ao anunciar imóvel:", error);
        alert("Erro ao anunciar imóvel. Tente novamente.");
    }
}

// Função para lidar com o formulário de automóvel
async function handleFormAutomovelSubmit(e) {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const marca = document.getElementById("marca").value;
    const modelo = document.getElementById("modelo").value;
    const ano = parseInt(document.getElementById("ano").value);
    const preco = parseFloat(document.getElementById("preco").value);
    const imagens = document.getElementById("imagens").files;

    const imagensURLs = await uploadImagens(imagens, "automoveis");

    try {
        await addDoc(collection(db, "automoveis"), {
            titulo,
            descricao,
            marca,
            modelo,
            ano,
            preco,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            data: new Date()
        });
        alert("Automóvel anunciado com sucesso!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro ao anunciar automóvel:", error);
        alert("Erro ao anunciar automóvel. Tente novamente.");
    }
}

// Função para buscar carros
async function buscarCarros(precoMin, precoMax, marca, modelo, ano) {
    try {
        const carrosRef = collection(db, "automoveis");
        let q = query(carrosRef);

        if (marca) q = query(q, where("marca", "==", marca));
        if (modelo) q = query(q, where("modelo", "==", modelo));
        if (ano) q = query(q, where("ano", "==", parseInt(ano)));
        if (precoMin) q = query(q, where("preco", ">=", precoMin));
        if (precoMax) q = query(q, where("preco", "<=", precoMax));

        const querySnapshot = await getDocs(q);
        const resultadosContainer = document.getElementById("resultados");
        if (!resultadosContainer) return;

        let resultadosHTML = "<h3>Resultados da Busca:</h3>";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imagens = data.imagens || ["images/default.jpg"];
            const carrosselId = `carrossel-${doc.id}`;

            resultadosHTML += `
                <div class="card">
                    <div class="carrossel" id="${carrosselId}">
                        <div class="carrossel-imagens">
                            ${imagens.map((imagem, index) => `
                                <img src="${imagem}" alt="${data.titulo}" class="carrossel-img" style="display: ${index === 0 ? "block" : "none"}" loading="lazy">
                            `).join("")}
                        </div>
                        <button class="carrossel-seta carrossel-seta-esquerda" onclick="mudarImagem('${carrosselId}', -1)">&#10094;</button>
                        <button class="carrossel-seta carrossel-seta-direita" onclick="mudarImagem('${carrosselId}', 1)">&#10095;</button>
                    </div>
                    <div class="card-content">
                        <h4>${data.titulo}</h4>
                        <p><strong>Marca:</strong> ${data.marca}</p>
                        <p><strong>Modelo:</strong> ${data.modelo}</p>
                        <p><strong>Ano:</strong> ${data.ano}</p>
                        <p><strong>Preço:</strong> R$ ${data.preco}</p>
                        <a href="#" class="btn-view-more">Ver Mais</a>
                    </div>
                </div>
            `;
        });

        resultadosContainer.innerHTML = querySnapshot.empty ? "<p>Nenhum resultado encontrado.</p>" : resultadosHTML;
    } catch (error) {
        console.error("Erro ao buscar carros:", error);
        const resultadosContainer = document.getElementById("resultados");
        if (resultadosContainer) resultadosContainer.innerHTML = "<p>Erro ao realizar a busca.</p>";
    }
}

// Função para buscar imóveis
async function buscarCasas(precoMin, precoMax, bairro) {
    try {
        bairro = bairro.toLowerCase();
        const casasRef = collection(db, "imoveis");
        const q = query(casasRef, where("bairro", "==", bairro));

        const querySnapshot = await getDocs(q);
        const resultadosContainer = document.getElementById("resultados");
        if (!resultadosContainer) return;

        let resultadosHTML = "<h3>Resultados da Busca:</h3>";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imagens = data.imagens || ["images/default.jpg"];
            const carrosselId = `carrossel-${doc.id}`;

            resultadosHTML += `
                <div class="card">
                    <div class="carrossel" id="${carrosselId}">
                        <div class="carrossel-imagens">
                            ${imagens.map((imagem, index) => `
                                <img src="${imagem}" alt="${data.titulo}" class="carrossel-img" style="display: ${index === 0 ? "block" : "none"}" loading="lazy">
                            `).join("")}
                        </div>
                        <button class="carrossel-seta carrossel-seta-esquerda" onclick="mudarImagem('${carrosselId}', -1)">&#10094;</button>
                        <button class="carrossel-seta carrossel-seta-direita" onclick="mudarImagem('${carrosselId}', 1)">&#10095;</button>
                    </div>
                    <div class="card-content">
                        <h4>${data.titulo}</h4>
                        <p><strong>Bairro:</strong> ${data.bairro}</p>
                        <p><strong>Preço:</strong> R$ ${data.preco}</p>
                        <p><strong>Tipo:</strong> ${data.tipo}</p>
                        <a href="#" class="btn-view-more">Ver Mais</a>
                    </div>
                </div>
            `;
        });

        resultadosContainer.innerHTML = querySnapshot.empty ? "<p>Nenhum resultado encontrado.</p>" : resultadosHTML;
    } catch (error) {
        console.error("Erro ao buscar casas:", error);
        const resultadosContainer = document.getElementById("resultados");
        if (resultadosContainer) resultadosContainer.innerHTML = "<p>Erro ao realizar a busca.</p>";
    }
}

// Função para preencher a lista de bairros
function preencherBairros() {
    const bairros = [
        'Boa Vista', 'Centro', 'Chácara Freitas', 'Chácara Santa Fé', 'Conjunto Habitacional Doutor Achiles Galdi',
        // ... (lista completa de bairros)
    ];

    const datalist = document.getElementById("bairros");
    if (!datalist) return;

    bairros.forEach(bairro => {
        const option = document.createElement("option");
        option.value = bairro;
        datalist.appendChild(option);
    });
}

// Função para inicializar a página
function init() {
    console.log("Página carregada! Chamando carregarImoveisDestaque...");
    carregarImoveisDestaque();

    // Adiciona eventos aos formulários
    const formImovel = document.getElementById("form-imovel");
    const formAutomovel = document.getElementById("form-automovel");

    if (formImovel) formImovel.addEventListener("submit", handleFormImovelSubmit);
    if (formAutomovel) formAutomovel.addEventListener("submit", handleFormAutomovelSubmit);

    // Adiciona evento ao botão "Anunciar"
    const btnAnunciar = document.getElementById("btn-anunciar");
    if (btnAnunciar) btnAnunciar.addEventListener("click", () => window.location.href = "anunciar.html");

    // Preenche a lista de bairros
    const inputBairro = document.getElementById("bairro");
    if (inputBairro) inputBairro.addEventListener("focus", preencherBairros);

    // Controle do menu
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            menuToggle.innerHTML = navMenu.classList.contains("active") ? "✕" : "☰";
        });
    }

    // Verifica o estado de autenticação
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginBtn.innerHTML = `<p>${user.displayName || "Meu Perfil"}</p>`;
                loginBtn.href = "#";
            } else {
                loginBtn.innerHTML = `<p>Login / Cadastro</p>`;
                loginBtn.href = "login.html";
            }
        });

        loginBtn.addEventListener("click", (event) => {
            if (!auth.currentUser) {
                event.preventDefault();
                window.location.href = "login.html";
            }
        });
    }
}

// Inicializa a página após o carregamento do DOM
document.addEventListener("DOMContentLoaded", init);
