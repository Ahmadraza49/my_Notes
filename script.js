/* ---------------------------------
        LOCAL DATABASE
---------------------------------- */
let users = JSON.parse(localStorage.getItem("users_db") || "{}");
let currentUser = null;

/* SHORTCUTS */
const btnSet = document.getElementById("btn-set");
const newPass = document.getElementById("new-pass");
const btnGoLogin = document.getElementById("btn-go-login");
const btnGoSet = document.getElementById("btn-go-set");
const btnLogin = document.getElementById("btn-login");
const loginPass = document.getElementById("login-pass");

const toggleNewPass = document.getElementById("toggle-new-pass");
const toggleLoginPass = document.getElementById("toggle-login-pass");

const screenSet = document.getElementById("screen-set");
const screenLogin = document.getElementById("screen-login");
const screenApp = document.getElementById("screen-app");

const btnLogout = document.getElementById("btn-logout");

const notesList = document.getElementById("notes-list");
const noteInput = document.getElementById("note-input");
const btnSave = document.getElementById("btn-save");
const btnClear = document.getElementById("btn-clear");

const booksList = document.getElementById("books-list");
const bookText = document.getElementById("book-text");
const bookFile = document.getElementById("book-file");
const btnUploadBook = document.getElementById("btn-upload-book");

const galleryGrid = document.getElementById("gallery-grid");
const imgCount = document.getElementById("img-count");
const btnChoose = document.getElementById("btn-choose");
const btnUpload = document.getElementById("btn-upload");
const imageInput = document.getElementById("image-input");

const popupImg = document.getElementById("popup-img");
const imagePopup = document.getElementById("image-popup");

/* SAVE DB */
function saveDB() {
  localStorage.setItem("users_db", JSON.stringify(users));
}

/* ---------------------------------
        SUPABASE SETUP
---------------------------------- */
const SUPABASE_URL = "https://ytxhlihzxgftffaikumr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eGhsaWh6eGdmdGZmYWlrdW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODAxNTgsImV4cCI6MjA3OTQ1NjE1OH0._k5hfgJwVSrbXtlRDt3ZqCYpuU1k-_OqD7M0WML4ehA";

const BUCKET = "images";  
const BOOK_FOLDER = "BooksDocs";

/* ---------------------------------
      PASSWORD SHOW / HIDE
---------------------------------- */
function togglePassword(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);

  if (input.type === "password") {
    input.type = "text";
    eye.classList.add("text-blue-400");
  } else {
    input.type = "password";
    eye.classList.remove("text-blue-400");
  }
}

toggleNewPass.onclick = () => togglePassword("new-pass", "new-pass-eye");
toggleLoginPass.onclick = () => togglePassword("login-pass", "login-pass-eye");

/* ---------------------------------
        CREATE PASSWORD USER
---------------------------------- */
btnSet.onclick = () => {
  const pass = newPass.value.trim();
  if (!pass) return alert("Enter a password");

  if (!users[pass]) {
    users[pass] = { notes: [], books: [], images: [] };
  }

  saveDB();
  alert("Password created!");

  newPass.value = "";
};

/* SWITCH SCREENS */
btnGoLogin.onclick = () => {
  screenSet.classList.add("hidden");
  screenLogin.classList.remove("hidden");
};

btnGoSet.onclick = () => {
  screenLogin.classList.add("hidden");
  screenSet.classList.remove("hidden");
};

/* LOGIN */
btnLogin.onclick = () => {
  const pass = loginPass.value.trim();
  if (!users[pass]) return alert("Wrong password");

  currentUser = pass;
  loadUserData();

  screenLogin.classList.add("hidden");
  screenApp.classList.remove("hidden");
  loginPass.value = "";
};

btnLogout.onclick = () => location.reload();

/* LOAD ALL DATA */
function loadUserData() {
  loadNotes();
  loadBooks();
  loadGallery();
  showPanel("notes");
}

/* ---------------------------------
                NOTES
---------------------------------- */
function loadNotes() {
  notesList.innerHTML = "";
  users[currentUser].notes.forEach(n => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-200 rounded";
    li.textContent = n;
    notesList.appendChild(li);
  });
}

btnSave.onclick = () => {
  const t = noteInput.value.trim();
  if (!t) return;

  users[currentUser].notes.push(t);
  saveDB();
  loadNotes();
  noteInput.value = "";
};

btnClear.onclick = () => (noteInput.value = "");

/* ---------------------------------
        BOOKS (TEXT + DOCUMENT)
---------------------------------- */
btnUploadBook.onclick = async () => {
  const text = bookText.value.trim();
  const file = bookFile.files[0];

  if (!text && !file) return alert("Add text or select a document!");

  let fileURL = null;

  if (file) {
    const fileName = `${currentUser}_${Date.now()}_${file.name}`;
    const fullPath = `${BOOK_FOLDER}/${fileName}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fullPath}`,
      {
        method: "PUT",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": file.type
        },
        body: file
      }
    );

    if (!uploadRes.ok) {
      alert("Document upload failed!");
      return;
    }

    fileURL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fullPath}`;
  }

  users[currentUser].books.push({ text, file: fileURL });

  saveDB();
  loadBooks();

  bookText.value = "";
  bookFile.value = "";

  alert("Book saved!");
};

function loadBooks() {
  booksList.innerHTML = "";

  users[currentUser].books.forEach((b, i) => {
    const li = document.createElement("li");
    li.className = "p-3 bg-purple-200 rounded";

    li.innerHTML = `
      <div class="font-medium mb-1">${b.text || "(No text)"}</div>
      <div class="flex gap-4">
        ${b.file ? `<a href="${b.file}" class="text-blue-700 underline" download>Download</a>` : ""}
        <button data-i="${i}" class="text-red-600 delete-book">Delete</button>
      </div>
    `;

    booksList.appendChild(li);
  });

  document.querySelectorAll(".delete-book").forEach(btn => {
    btn.onclick = e => {
      const index = e.target.dataset.i;
      users[currentUser].books.splice(index, 1);
      saveDB();
      loadBooks();
    };
  });
}

/* ---------------------------------
              GALLERY
---------------------------------- */
btnChoose.onclick = () => imageInput.click();

btnUpload.onclick = async () => {
  const files = imageInput.files;
  if (!files.length) return alert("Select images first");

  for (let file of files) {
    const fileName = `${currentUser}_${Date.now()}_${file.name}`;
    const fullPath = `Gallery/${fileName}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fullPath}`,
      {
        method: "PUT",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": file.type
        },
        body: file
      }
    );

    if (uploadRes.ok) {
      const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fullPath}`;
      users[currentUser].images.push(url);
    }
  }

  saveDB();
  loadGallery();
  imageInput.value = "";
  alert("Images uploaded!");
};

function loadGallery() {
  galleryGrid.innerHTML = "";

  users[currentUser].images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "w-full h-40 object-cover rounded cursor-pointer";
    img.onclick = () => openImage(src);
    galleryGrid.appendChild(img);
  });

  imgCount.innerText = users[currentUser].images.length;
}

/* FULL-SIZE IMAGE VIEWER */
function openImage(src) {
  popupImg.src = src;
  popupImg.className = "max-w-[95vw] max-h-[95vh] object-contain rounded";
  imagePopup.classList.remove("hidden");
}

imagePopup.onclick = () => imagePopup.classList.add("hidden");

/* ---------------------------------
                TABS
---------------------------------- */
function showPanel(p) {
  ["notes", "gallery", "books"].forEach(name => {
    document.getElementById(`panel-${name}`).classList.add("hidden");
    document.getElementById(`tab-${name}`).classList.remove("bg-indigo-600", "text-white");
  });

  document.getElementById(`panel-${p}`).classList.remove("hidden");
  document.getElementById(`tab-${p}`).classList.add("bg-indigo-600", "text-white");
}

document.getElementById("tab-notes").onclick = () => showPanel("notes");
document.getElementById("tab-gallery").onclick = () => showPanel("gallery");
document.getElementById("tab-books").onclick = () => showPanel("books");


