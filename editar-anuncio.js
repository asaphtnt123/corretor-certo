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
    
    try {
        // Verifica autenticação
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            alert("Você precisa estar logado para editar anúncios!");
            window.location.href = "login.html";
            return;
        }

        // Verifica se o usuário é o dono do anúncio
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert("Anúncio não encontrado!");
            window.location.href = "perfil.html";
            return;
        }
        
        if (docSnap.data().userId !== user.uid) {
            alert("Você não tem permissão para editar este anúncio");
            window.location.href = "perfil.html";
            return;
        }

        // Prepara dados atualizados
        const dadosAtualizados = {
            titulo: document.getElementById("titulo").value,
            descricao: document.getElementById("descricao").value,
            preco: parseFloat(document.getElementById("preco").value),
            status: document.getElementById("status").checked ? "ativo" : "inativo",
            destaque: document.getElementById("destaque").checked,
            dataAtualizacao: new Date(),
            userId: user.uid // Mantém o userId original
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
        
        // Atualiza o documento
        await updateDoc(docRef, dadosAtualizados);
        
        // Feedback e redirecionamento
        Swal.fire({
            title: 'Sucesso!',
            text: 'Anúncio atualizado com sucesso',
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = "perfil.html";
        });
        
    } catch (error) {
        console.error("Erro detalhado:", error);
        
        let errorMessage = "Erro ao atualizar anúncio. Por favor, tente novamente.";
        
        if (error.code === 'permission-denied') {
            errorMessage = "Você não tem permissão para editar este anúncio.";
        } else if (error.code === 'not-found') {
            errorMessage = "Anúncio não encontrado no banco de dados.";
        }
        
        Swal.fire({
            title: 'Erro!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendi'
        });
    }
});

// Carrega os dados quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", carregarDadosAnuncio);
