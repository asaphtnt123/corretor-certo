// Importar funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase
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

// Captura os parâmetros da URL
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const tipo = urlParams.get('tipo');
const collectionName = tipo === "imovel" ? "imoveis" : "automoveis";

// Mostra os campos específicos do tipo de anúncio
if (tipo === "imovel") {
    document.getElementById("campos-imovel").classList.remove("d-none");
} else {
    document.getElementById("campos-automovel").classList.remove("d-none");
}

async function carregarDadosAnuncio() {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const anuncio = docSnap.data();
            
            // Preenche campos comuns
            document.getElementById("titulo").value = anuncio.titulo || "";
            document.getElementById("descricao").value = anuncio.descricao || "";
            document.getElementById("preco").value = anuncio.preco || "";
            document.getElementById("status").checked = anuncio.status !== "inativo";
            document.getElementById("destaque").checked = anuncio.destaque || false;
            
            // Preenche campos específicos
            if (tipo === "imovel") {
                document.getElementById("quartos").value = anuncio.quartos || "";
                document.getElementById("banheiros").value = anuncio.banheiros || "";
                document.getElementById("garagem").value = anuncio.garagem || "";
                document.getElementById("area").value = anuncio.area || "";
                document.getElementById("bairro").value = anuncio.bairro || "";
            } else {
                document.getElementById("marca").value = anuncio.marca || "";
                document.getElementById("modelo").value = anuncio.modelo || "";
                document.getElementById("ano").value = anuncio.ano || "";
                document.getElementById("km").value = anuncio.km || "";
                document.getElementById("cor").value = anuncio.cor || "";
            }
        } else {
            alert("Anúncio não encontrado!");
            window.location.href = "perfil.html";
        }
    } catch (error) {
        console.error("Erro ao carregar anúncio:", error);
        alert("Erro ao carregar dados do anúncio.");
        window.location.href = "perfil.html";
    }
}

document.getElementById("form-editar").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    // Campos comuns
    const dadosAtualizados = {
        titulo: document.getElementById("titulo").value,
        descricao: document.getElementById("descricao").value,
        preco: parseFloat(document.getElementById("preco").value),
        status: document.getElementById("status").checked ? "ativo" : "inativo",
        destaque: document.getElementById("destaque").checked,
        dataAtualizacao: new Date()
    };
    
    // Campos específicos
    if (tipo === "imovel") {
        dadosAtualizados.quartos = parseInt(document.getElementById("quartos").value) || 0;
        dadosAtualizados.banheiros = parseInt(document.getElementById("banheiros").value) || 0;
        dadosAtualizados.garagem = parseInt(document.getElementById("garagem").value) || 0;
        dadosAtualizados.area = parseInt(document.getElementById("area").value) || 0;
        dadosAtualizados.bairro = document.getElementById("bairro").value;
    } else {
        dadosAtualizados.marca = document.getElementById("marca").value;
        dadosAtualizados.modelo = document.getElementById("modelo").value;
        dadosAtualizados.ano = parseInt(document.getElementById("ano").value) || 0;
        dadosAtualizados.km = parseInt(document.getElementById("km").value) || 0;
        dadosAtualizados.cor = document.getElementById("cor").value;
    }
    
    try {
        await updateDoc(doc(db, collectionName, id), dadosAtualizados);
        alert("Anúncio atualizado com sucesso!");
        window.location.href = "perfil.html";
    } catch (error) {
        console.error("Erro ao atualizar anúncio:", error);
        alert("Erro ao atualizar anúncio. Por favor, tente novamente.");
    }
});

// Carrega os dados quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", carregarDadosAnuncio);
