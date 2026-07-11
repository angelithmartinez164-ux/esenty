import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJkhw5dHbowmIc1zSrTG05TT3_8zXfTj4",
    authDomain: "esenty-app.firebaseapp.com",
    projectId: "esenty-app",
    storageBucket: "esenty-app.appspot.com",
    messagingSenderId: "384759201938",
    appId: "1:384759201938:web:a1b2c3d4e5f6g7h8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let usuarioActual = localStorage.getItem("esenty_user") || "";
let signoActual = localStorage.getItem("esenty_signo") || "Acuario";
let listadoEscritos = [];
let filtroGenero = "TODOS";
let filtroSigno = "TODOS";

const viewLogin = document.getElementById("view-login");
const viewFeed = document.getElementById("view-feed");
const viewPost = document.getElementById("view-post");
const viewProfile = document.getElementById("view-profile");
const mainNav = document.getElementById("main-nav");

const nombreUsuario = document.getElementById("nombreUsuario");
const signoUsuario = document.getElementById("signoUsuario");
const btnEntrar = document.getElementById("btnEntrar");

function crearEstrellas() {
    const container = document.getElementById("stars-container");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 60; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.width = star.style.height = `${Math.random() * 3}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(star);
    }
}
crearEstrellas();

function showView(viewName) {
    [viewLogin, viewFeed, viewPost, viewProfile].forEach(v => v.classList.add("hidden"));
    document.querySelectorAll(".nav-icon").forEach(i => i.classList.remove("active"));
    
    if (viewName === "login") {
        viewLogin.classList.remove("hidden");
        mainNav.classList.add("hidden");
    } else {
        mainNav.classList.remove("hidden");
        if (viewName === "feed") {
            viewFeed.classList.remove("hidden");
            document.getElementById("ico-feed").classList.add("active");
        } else if (viewName === "post") {
            viewPost.classList.remove("hidden");
            document.getElementById("ico-post").classList.add("active");
        } else if (viewName === "profile") {
            viewProfile.classList.remove("hidden");
            document.getElementById("ico-profile").classList.add("active");
            cargarPerfil();
        }
    }
}

btnEntrar.addEventListener("click", () => {
    const userValue = nombreUsuario.value.trim();
    if (!userValue) {
        mostrarToast("Introduce tu frecuencia de autor.");
        return;
    }
    usuarioActual = userValue.startsWith("@") ? userValue : `@${userValue}`;
    signoActual = signoUsuario.value;
    
    localStorage.setItem("esenty_user", usuarioActual);
    localStorage.setItem("esenty_signo", signoActual);
    
    mostrarToast(`¡Bienvenido al cosmos, ${usuarioActual}!`);
    showView("feed");
});

document.getElementById("ico-feed").addEventListener("click", () => showView("feed"));
document.getElementById("ico-post").addEventListener("click", () => showView("post"));
document.getElementById("ico-profile").addEventListener("click", () => showView("profile"));
document.getElementById("btn-salir").addEventListener("click", () => {
    localStorage.clear();
    usuarioActual = "";
    showView("login");
});

const consejosOraculo = [
    "Escribe sobre aquello que perdiste en el último eclipse lunar.",
    "Un verso corto que empiece con la palabra 'Gravedad'.",
    "Describe tu estado de ánimo actual usando metáforas de agujeros negros.",
    "Dedícale un microrrelato a una estrella muerta hace millones de años."
];
document.getElementById("btnOracle").addEventListener("click", () => {
    const box = document.getElementById("oracle-display");
    const frase = consejosOraculo[Math.floor(Math.random() * consejosOraculo.length)];
    box.innerText = `🔮 El Oráculo sugiere: "${frase}"`;
    box.style.display = "block";
});

document.getElementById("textoObra").addEventListener("input", (e) => {
    document.getElementById("char-count").innerText = e.target.value.length;
});

document.getElementById("btnPublicar").addEventListener("click", async () => {
    const texto = document.getElementById("textoObra").value.trim();
    const genero = document.getElementById("generoEscrito").value;
    const esencia = document.getElementById("esenciaObra").value.trim();
    
    if (!texto) {
        mostrarToast("El cosmos rechaza lienzos vacíos.");
        return;
    }

    try {
        await addDoc(collection(db, "obras"), {
            autor: usuarioActual,
            signo: signoActual,
            texto: texto,
            genero: genero,
            esencia: esencia,
            fecha: Date.now(),
            likes: 0,
            comentarios: []
        });

        document.getElementById("textoObra").value = "";
        document.getElementById("esenciaObra").value = "";
        document.getElementById("char-count").innerText = "0";
        document.getElementById("oracle-display").style.display = "none";
        
        mostrarToast("Transmisión estelar completada con éxito.");
        showView("feed");
    } catch (e) {
        mostrarToast("Error en los campos electromagnéticos.");
    }
});

const q = query(collection(db, "obras"), orderBy("fecha", "desc"));
onSnapshot(q, (snapshot) => {
    listadoEscritos = [];
    const astrosUnicos = new Set();
    
    snapshot.forEach((doc) => {
        listadoEscritos.push({ id: doc.id, ...doc.data() });
        if (doc.data().signo) astrosUnicos.add(doc.data().signo);
    });
    
    actualizarBarraAstros(Array.from(astrosUnicos));
    renderizarFeed();
});

function renderizarFeed() {
    const feedContainer = document.getElementById("feed-realtime");
    feedContainer.innerHTML = "";
    
    const filtrados = listadoEscritos.filter(item => {
        const checkGen = (filtroGenero === "TODOS" || item.genero === filtroGenero);
        const checkAstro = (filtroSigno === "TODOS" || item.signo === filtroSigno);
        return checkGen && checkAstro;
    });

    if (filtrados.length === 0) {
        feedContainer.innerHTML = `<p style="opacity:0.4; margin-top:40px;">No hay constelaciones en este cuadrante...</p>`;
        return;
    }

    filtrados.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "feed-item";
        itemDiv.innerHTML = `
            <div class="feed-info">
                <span class="sign-badge">${item.signo} 🌌</span>
                <span class="genre-badge">${item.genero}</span>
                <p style="font-size:0.85rem; margin:0; opacity:0.5; font-family:sans-serif;">Por: ${item.autor}</p>
                <div class="literary-text">${item.texto}</div>
                ${item.esencia ? `<div class="essence-box"><b>Trasfondo:</b> ${item.esencia}</div>` : ""}
                
                <div class="reactions-container">
                    <button class="reaction-btn" data-id="${item.id}">✨ Resonar (${item.likes || 0})</button>
                </div>
            </div>
        `;

        itemDiv.querySelector(".reaction-btn").addEventListener("click", async (e) => {
            const obraId = e.target.getAttribute("data-id");
            const docRef = doc(db, "obras", obraId);
            await updateDoc(docRef, { likes: increment(1) });
            mostrarToast("Tu energía aumentó la resonancia.");
        });

        feedContainer.appendChild(itemDiv);
    });
}

document.getElementById("genre-bar").addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-chip")) return;
    document.querySelectorAll("#genre-bar .filter-chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    filtroGenero = e.target.id.replace("gen-", "");
    renderizarFeed();
});

function actualizarBarraAstros(astros) {
    const bar = document.getElementById("astro-bar");
    bar.innerHTML = `<div class="filter-chip ${filtroSigno === 'TODOS' ? 'active-astro' : ''}" id="astro-TODOS">Todas 🌟</div>`;
    
    astros.forEach(a => {
        const chip = document.createElement("div");
        chip.className = `filter-chip ${filtroSigno === a ? 'active-astro' : ''}`;
        chip.id = `astro-${a}`;
        chip.innerText = a;
        bar.appendChild(chip);
    });
}

document.getElementById("astro-bar").addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-chip")) return;
    document.querySelectorAll("#astro-bar .filter-chip").forEach(c => c.classList.remove("active-astro"));
    e.target.classList.add("active-astro");
    filtroSigno = e.target.id.replace("astro-", "");
    renderizarFeed();
});

document.getElementById("btnLaunchBottle").addEventListener("click", () => {
    const txt = document.getElementById("bottle-input").value.trim();
    if (!txt) return;
    mostrarToast("Tu secreto flota a la deriva en el vacío.");
});
document.getElementById("btnFishBottle").addEventListener("click", () => {
    const display = document.getElementById("bottle-text");
    display.innerText = `"El vacío responde con un silencio cósmico."`;
});

function cargarPerfil() {
    document.getElementById("perf-name").innerText = usuarioActual || "@Anonimo";
    document.getElementById("perf-sign").innerText = `${signoActual} 🌌`;
    
    const misObras = listadoEscritos.filter(o => o.autor === usuarioActual);
    document.getElementById("user-posts-count").innerText = misObras.length;
    
    const resonanciaTotal = misObras.reduce((acc, obj) => acc + (obj.likes || 0), 0);
    document.getElementById("user-energy-count").innerText = resonanciaTotal;

    if (misObras.length > 0) document.getElementById("badge-pionero").classList.add("unlocked");
    if (resonanciaTotal >= 5) document.getElementById("badge-popular").classList.add("unlocked");
    if (misObras.length >= 3) document.getElementById("badge-sabio").classList.add("unlocked");

    dibujarConstelacion();
}

function dibujarConstelacion() {
    const canvas = document.getElementById("constellation-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 120, 120);
    ctx.strokeStyle = "#00e5ff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(60, 15);
    ctx.lineTo(105, 50);
    ctx.lineTo(85, 100);
    ctx.lineTo(35, 100);
    ctx.lineTo(15, 50);
    ctx.closePath();
    ctx.stroke();

    const puntos = [[60,15], [105,50], [85,100], [35,100], [15,50]];
    puntos.forEach(p => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function mostrarToast(mensaje) {
    const center = document.getElementById("notification-center");
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerText = mensaje;
    center.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

const temas = ["theme-galaxia", "theme-constelacion", "theme-agujeronegro"];
let temaActualIdx = 0;
document.getElementById("theme-btn").addEventListener("click", () => {
    document.body.classList.remove(temas[temaActualIdx]);
    temaActualIdx = (temaActualIdx + 1) % temas.length;
    document.body.classList.add(temas[temaActualIdx]);
});

if (usuarioActual) {
    showView("feed");
} else {
    showView("login");
}