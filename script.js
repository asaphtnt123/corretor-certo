import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
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

const storage = getStorage(app); // Agora a função getStorage está definida corretamente
console.log("Firestore conectado:", db);

document.addEventListener("DOMContentLoaded", () => {

    setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistência ativada!");
  })
  .catch((error) => {
    console.error("Erro na persistência:", error);
  });
  
  
  
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Página carregada! Chamando carregarImoveisDestaque...");
    carregarImoveisDestaque();
});



  
  

function mudarImagem(carrosselId, direcao) {
    const carrossel = document.getElementById(carrosselId);
    const imagens = carrossel.querySelectorAll('.carrossel-img');
    let indexAtivo = -1;

    // Encontra a imagem ativa (visível)
    imagens.forEach((imagem, index) => {
        if (imagem.style.display === 'block') {
            indexAtivo = index;
        }
    });

    // Calcula o novo índice
    let novoIndex = indexAtivo + direcao;
    if (novoIndex < 0) {
        novoIndex = imagens.length - 1; // Volta para a última imagem
    } else if (novoIndex >= imagens.length) {
        novoIndex = 0; // Volta para a primeira imagem
    }

    // Esconde a imagem atual
    imagens[indexAtivo].style.display = 'none';

    // Exibe a nova imagem
    imagens[novoIndex].style.display = 'block';
}


// Torna a função mudarImagem acessível globalmente
window.mudarImagem = mudarImagem;

async function carregarImoveisDestaque() {
    try {
        console.log("Iniciando a busca de imóveis em destaque...");

        const db = getFirestore();
        const destaqueRef = collection(db, "imoveis");
        const destaqueQuery = query(destaqueRef, where("destaque", "==", true));
        const querySnapshot = await getDocs(destaqueQuery);

        console.log("Número de imóveis encontrados:", querySnapshot.size);

        if (querySnapshot.empty) {
            console.log("Nenhum imóvel em destaque encontrado.");
            return;
        }

        const destaqueContainer = document.getElementById("destaqueContainer");
        destaqueContainer.innerHTML = ''; // Limpa o conteúdo anterior

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Dados do documento:", data);

            // Pegando o título corretamente
            const titulo = data.titulo ? data.titulo : "Título não disponível";
            console.log("Título processado:", titulo);

            // Pegando as imagens corretamente (se não houver imagens, coloca uma imagem padrão)
            const imagens = data.imagens && data.imagens.length > 0 ? data.imagens : ["images/default.jpg"];
            console.log("Imagens processadas:", imagens);

            // Cria o carrossel de imagens
            const carrosselId = `carrossel-${doc.id}`; // ID único para cada carrossel

            const itemDiv = document.createElement("div");
            itemDiv.classList.add("destaque-item");

            // Exibe a primeira imagem, outras serão manipuladas pela função de navegação
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


// Função para upload de imagens
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
            console.error("Erro ao fazer upload da imagem: ", error);
        }
    }
    return urls;
}

// Formulário de Imóvel
document.getElementById("form-imovel")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const tipo = document.getElementById("tipo").value;
    const preco = parseFloat(document.getElementById("preco").value);
    const quartos = parseInt(document.getElementById("quartos").value);
    const banheiros = parseInt(document.getElementById("banheiros").value);
    const bairro = document.getElementById("bairro").value;
    const imagens = document.getElementById("imagens").files;

    // Faz o upload das imagens
    const imagensURLs = await uploadImagens(imagens, "imoveis");

    // Salva no Firestore
    try {
        const docRef = await addDoc(collection(db, "imoveis"), {
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
});

// Formulário de Automóvel
document.getElementById("form-automovel")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const marca = document.getElementById("marca").value;
    const modelo = document.getElementById("modelo").value;
    const ano = parseInt(document.getElementById("ano").value);
    const preco = parseFloat(document.getElementById("preco").value);
    const imagens = document.getElementById("imagens").files;

    // Faz o upload das imagens
    const imagensURLs = await uploadImagens(imagens, "automoveis");

    // Salva no Firestore
    try {
        const docRef = await addDoc(collection(db, "automoveis"), {
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
});



document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('form-anuncio').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Captura o valor selecionado
    const tipo = document.getElementById('tipo').value;
    
    // Redireciona para anunciar.html, passando o tipo como parâmetro
    window.location.href = "anunciar.html?tipo=" + encodeURIComponent(tipo);
  });
});



// Função para carregar o logo do Firestore
async function carregarLogo() {
    try {
        const db = getFirestore();
        const logoCollection = collection(db, 'LOGO');
        const querySnapshot = await getDocs(logoCollection);

        if (!querySnapshot.empty) {
            const primeiroLogo = querySnapshot.docs[0].data();
            document.getElementById('logoContainer').innerHTML = `
                <img src="${primeiroLogo.imgLogo}" alt="Logo Corretor Certo" class="logo-img" style="max-width: 150px; height: auto;" loading="lazy">
            `;
        } else {
            console.warn("Nenhuma imagem de logo encontrada no Firestore.");
        }
    } catch (error) {
        console.error("Erro ao carregar logo:", error);
        document.getElementById('logoContainer').innerHTML = 'Corretor Certo';
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const tipoOptions = document.querySelectorAll(".tipo-option");
    const tipoInput = document.getElementById("tipo");
    const campoImovel = document.getElementById("campo-imovel");
    const campoCarro = document.getElementById("campo-carro");

    // Função para alternar entre os campos de pesquisa de imóveis e automóveis
    function toggleFields(tipo) {
        // Limpa os resultados antes de mudar o tipo de pesquisa
        document.getElementById("resultados").innerHTML = "";

        // Exibe ou esconde os campos conforme o tipo de pesquisa
        if (tipo === "imovel") {
            campoImovel.style.display = "block";
            campoCarro.style.display = "none";
        } else if (tipo === "carro") {
            campoImovel.style.display = "none";
            campoCarro.style.display = "block";
        }
    }

    // Adiciona o evento de clique aos ícones de casa e carro
    tipoOptions.forEach((option) => {
        option.addEventListener("click", function () {
            // Remove a classe 'active' de todas as opções
            tipoOptions.forEach((opt) => opt.classList.remove("active"));

            // Adiciona a classe 'active' à opção clicada
            this.classList.add("active");

            // Atualiza o valor do campo oculto
            const tipoSelecionado = this.getAttribute("data-tipo");
            tipoInput.value = tipoSelecionado;

            // Alterna entre os campos de pesquisa de imóveis e automóveis
            toggleFields(tipoSelecionado);
        });
    });

    // Define a opção "Imóvel" como selecionada por padrão
    tipoOptions[0].classList.add("active");
    toggleFields("imovel"); // Exibe os campos de imóveis inicialmente

    // Evento do formulário de pesquisa
    document.getElementById("form-pesquisa").addEventListener("submit", function (e) {
        e.preventDefault();
        const precoMin = parseInt(document.getElementById("preco-min").value) || 0;
        const precoMax = parseInt(document.getElementById("preco-max").value) || 0;
        const tipo = tipoInput.value;

        if (tipo === "imovel") {
            const bairro = document.getElementById("bairro").value;
            buscarCasas(precoMin, precoMax, bairro);
        } else if (tipo === "carro") {
            const marca = document.getElementById("marca").value;
            const modelo = document.getElementById("modelo").value;
            const ano = document.getElementById("ano").value;
            buscarCarros(precoMin, precoMax, marca, modelo, ano);
        }
    });

    // Função para buscar carros
    async function buscarCarros(precoMin, precoMax, marca, modelo, ano) {
        try {
            const carrosRef = collection(db, "automoveis");
            let q = query(carrosRef);

            // Filtros de marca, modelo e ano
            if (marca) {
                q = query(q, where("marca", "==", marca));
            }
            if (modelo) {
                q = query(q, where("modelo", "==", modelo));
            }
            if (ano) {
                q = query(q, where("ano", "==", parseInt(ano)));
            }

            // Filtros de preço
            if (precoMin) {
                q = query(q, where("preco", ">=", precoMin));
            }
            if (precoMax) {
                q = query(q, where("preco", "<=", precoMax));
            }

            const querySnapshot = await getDocs(q);
            console.log("Número de documentos encontrados:", querySnapshot.size);

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

            document.getElementById("resultados").innerHTML = querySnapshot.empty ? "<p>Nenhum resultado encontrado.</p>" : resultadosHTML;
        } catch (error) {
            console.error("Erro ao buscar carros: ", error);
            document.getElementById("resultados").innerHTML = "<p>Erro ao realizar a busca.</p>";
        }
    }

    // Função para buscar imóveis
    async function buscarCasas(precoMin, precoMax, bairro) {
        try {
            bairro = bairro.toLowerCase(); // Converte o bairro para minúsculas
            console.log("Bairro pesquisado:", bairro); // Verifique o valor do bairro

            const casasRef = collection(db, "imoveis");
            
            // Realiza a busca com o valor de bairro em minúsculas
            const q = query(
                casasRef,
                where("bairro", "==", bairro) // O bairro do Firestore também deve estar em minúsculas
            );

            const querySnapshot = await getDocs(q);
            console.log("Número de documentos encontrados:", querySnapshot.size); // Verifique quantos documentos foram encontrados

            let resultadosHTML = "<h3>Resultados da Busca:</h3>";
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Dados do documento:", data); // Verifique os dados de cada documento

                const imagens = data.imagens || ["images/default.jpg"];
                const carrosselId = `carrossel-${doc.id}`; // ID único para cada carrossel

                // Criação do card com carrossel
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

            // Exibe os resultados ou uma mensagem de erro
            document.getElementById("resultados").innerHTML = querySnapshot.empty ? "<p>Nenhum resultado encontrado.</p>" : resultadosHTML;
        } catch (error) {
            console.error("Erro ao buscar casas: ", error);
            document.getElementById("resultados").innerHTML = "<p>Erro ao realizar a busca.</p>";
        }
    }
});


// Controle do menu
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.innerHTML = navMenu.classList.contains('active') ? '✕' : '☰';
});

// Lista de bairros
const bairros = [
    'Boa Vista', 'Centro', 'Chácara Freitas', 'Chácara Santa Fé', 'Conjunto Habitacional Doutor Achiles Galdi',
    'Conjunto Habitacional Doutor José Secchi', 'Conjunto Habitacional General Euclides Figueiredo',
    'Conjunto Habitacional Hélio Nicolai', 'Conjunto Habitacional Humberto Carlos Passarella', 'Conjunto Habitacional Juscelino Kubitschek de Oliveira',
    'Cubatão', 'Estâncias de Recreio Santa Fé', 'Flávio Zacchi', 'Jardim Bela Vista', 'Jardim Bonfim', 'Jardim Camboriú',
    'Jardim Esplanada', 'Jardim Galego', 'Jardim Guarujá', 'Jardim Isaura', 'Jardim Itamaracá', 'Jardim Itapema',
    'Jardim Itapuã', 'Jardim Ivete', 'Jardim Lindóia', 'Jardim Macucos', 'Jardim Magali', 'Jardim Nossa Senhora Aparecida',
    'Jardim Paraíso', 'Jardim Raquel', 'Jardim Soares', 'Jardim Tropical', 'Jardim Yara', 'José Tonolli', 'Loteamento Boa Vista II',
    'Loteamento Conjunto Habitacional Antônio Assad Alcici', 'Loteamento Della Rocha', 'Loteamento Elizeu do Espírito Santo', 'Loteamento Habitacional Haldi',
    'Loteamento João de Barros', 'Loteamento José Casimiro Rodrigues', 'Loteamento Nações Unidas', 'Loteamento Popular Istor Luppi',
    'Loteamento Residencial Villagio Verde', 'Macumbé', 'Mário Cega', 'Nenê Cega', 'Nova Itapira', 'Parque da Felicidade', 
    'Parque da Felicidade II', 'Parque Fortaleza', 'Parque Industrial Juvenal Leite', 'Parque Progresso', 'Parque Residencial Braz Cavenaghi', 
    'Parque Santa Bárbara', 'Parque São Francisco', 'Parque São Jorge', 'Parque São Lucas', 'Pires', 'Ponte Nova', 'Prados', 
    'Recanto do Bié I', 'Recanto do Bié II', 'Recanto do Bié III E IV', 'Residencial Alonso Carmona Ortiz', 'Salgados', 'Santa Cruz', 
    'Santa Fé', 'Santo Antônio', 'São Benedito', 'São Vicente', 'Vila Bazani', 'Vila Esperança', 'Vila Ilze', 'Vila Maria', 
    'Vila Penha do Rio do Peixe', 'Vila Pereira', 'Vila Santa Marta', 'Vila Vieira', 'Cercado Grande', 'Duas Pontesarco Iris', 
    'Istor Luppi', 'Machadinho', 'Rio Manso'
];

// Função para preencher o datalist com os bairros
function preencherBairros() {
    const datalist = document.getElementById('bairros');
    bairros.forEach(bairro => {
        const option = document.createElement('option');
        option.value = bairro;
        datalist.appendChild(option);
    });
}

// Chama a função de preencher os bairros quando o input for focado
document.getElementById('bairro').addEventListener('focus', preencherBairros);

// Tudo que precisa esperar o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializações
    carregarLogo();

   
});
document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("login-btn");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Se o usuário estiver logado, exibir nome
            loginBtn.innerHTML = `<p>${user.displayName || "Meu Perfil"}</p>`;
            loginBtn.href = "#"; // Pode definir um link para a página de perfil no futuro
        } else {
            // Se não estiver logado, manter o botão de login/cadastro
            loginBtn.innerHTML = `<p>Login / Cadastro</p>`;
            loginBtn.href = "login.html"; // Redireciona para a página de login
        }
    });

    // Caso o botão seja clicado e o usuário não esteja logado, ir para login.html
    loginBtn.addEventListener("click", function (event) {
        if (!auth.currentUser) {
            event.preventDefault(); // Impede a navegação padrão caso queira adicionar alertas
            window.location.href = "login.html";
        }
    });
});





// Lógica para alternar entre formulários
document.getElementById("form-anuncio").addEventListener("submit", function(event) {
    event.preventDefault();
    var tipoAnuncio = document.getElementById("tipo-anuncio").value;
    if (tipoAnuncio === "imovel") {
        document.getElementById("form-imovel").style.display = "block";
        document.getElementById("form-carro").style.display = "none";
    } else if (tipoAnuncio === "carro") {
        document.getElementById("form-imovel").style.display = "none";
        document.getElementById("form-carro").style.display = "block";
    }
});
document.addEventListener("DOMContentLoaded", function () {
   // Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos da página
const loginBtn = document.getElementById("login-btn");
const userNameElement = document.getElementById("user-name");

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário está logado
        console.log("Usuário logado:", user.uid);

        // Exibe o nome do usuário
        userNameElement.textContent = user.displayName || "Meu Perfil";

        // Altera o link para redirecionar para perfil.html
        loginBtn.href = "perfil.html";
    } else {
        // Usuário não está logado
        userNameElement.textContent = "Login / Cadastro";
        loginBtn.href = "login.html";
    }
});

// Adiciona um evento de clique para o botão de perfil
loginBtn.addEventListener("click", (event) => {
    if (!auth.currentUser) {
        event.preventDefault(); // Impede o redirecionamento padrão
        window.location.href = "login.html"; // Redireciona para a página de login
    }
});
});


document.getElementById("btn-anunciar").addEventListener("click", () => {
    // Redireciona para a página de anúncio
    window.location.href = "anunciar.html";
});

// Torna a função mudarImagem acessível globalmente
window.mudarImagem = mudarImagem;

    });
