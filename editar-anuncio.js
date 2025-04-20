// Importações corretas no início do arquivo editar-anuncio.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
  authDomain: "corretorcerto-76933.firebaseapp.com",
  databaseURL: "https://corretorcerto-76933-default-rtdb.firebaseio.com",
  projectId: "corretorcerto-76933",
  storageBucket: "corretorcerto-76933.firebasestorage.app",
  messagingSenderId: "357149829474",
  appId: "1:357149829474:web:324b2005d82eabbce5e43b"
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
        // 1. Obter instância de autenticação corretamente
        const auth = getAuth(app); // Passando a instância do app
        
        // 2. Verificar autenticação com tratamento mais robusto
        await new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe(); // Remove o listener após o primeiro evento
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error("Usuário não autenticado"));
                }
            });
        });

        const user = auth.currentUser;
        
        // 3. Validação de parâmetros mais completa
        if (!id || !tipo || !['imovel', 'automovel'].includes(tipo)) {
            throw new Error(`Parâmetros inválidos: id=${id}, tipo=${tipo}`);
        }

        // 4. Carregar dados do documento com timeout
        const docRef = doc(db, collectionName, id);
        const docSnap = await Promise.race([
            getDoc(docRef),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout ao carregar anúncio")), 5000)
            )
        ]);
        
        if (!docSnap.exists()) {
            throw new Error("DOC_NOT_FOUND");
        }

        const anuncio = docSnap.data();
        
        // 5. Verificação de propriedade com mensagem mais clara
        if (anuncio.userId !== user.uid) {
            throw {
                code: "PERMISSION_DENIED",
                message: "Você não é o proprietário deste anúncio"
            };
        }
        
        // 6. Preenchimento dos campos com validação
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value || "";
        };

        const setChecked = (id, condition) => {
            const element = document.getElementById(id);
            if (element) element.checked = !!condition;
        };

        // Campos comuns
        setValue("titulo", anuncio.titulo);
        setValue("descricao", anuncio.descricao);
        setValue("preco", anuncio.preco);
        setChecked("status", anuncio.status !== "inativo");
        setChecked("destaque", anuncio.destaque);

        // Campos específicos
        if (tipo === "imovel") {
            setValue("quartos", anuncio.quartos);
            setValue("banheiros", anuncio.banheiros);
            setValue("garagem", anuncio.garagem);
            setValue("area", anuncio.area);
            setValue("bairro", anuncio.bairro);
            document.getElementById("campos-imovel").classList.remove("d-none");
        } else {
            setValue("marca", anuncio.marca);
            setValue("modelo", anuncio.modelo);
            setValue("ano", anuncio.ano);
            setValue("km", anuncio.km);
            setValue("cor", anuncio.cor);
            document.getElementById("campos-automovel").classList.remove("d-none");
        }

    } catch (error) {
        console.error("Erro ao carregar anúncio:", {
            error: error.message,
            code: error.code,
            stack: error.stack
        });

        // Mapeamento de códigos de erro para mensagens amigáveis
        const errorMessages = {
            'permission-denied': "Sem permissão para acessar este anúncio",
            'PERMISSION_DENIED': "Você não tem permissão para editar este anúncio",
            'DOC_NOT_FOUND': "Anúncio não encontrado",
            'auth/user-not-found': "Usuário não autenticado",
            'default': "Ocorreu um erro ao carregar o anúncio"
        };

        const message = errorMessages[error.code] || errorMessages.default;

        // Exibir mensagem com SweetAlert2
        await Swal.fire({
            title: 'Erro',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            willClose: () => {
                window.location.href = "perfil.html";
            }
        });
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
