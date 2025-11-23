/* ---------------------------------
        SUPABASE SETUP
---------------------------------- */
const SUPABASE_URL = "https://ytxhlihzxgftffaikumr.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // replace with your key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET = "images";
const BOOK_FOLDER = "BooksDocs";

let currentUser = null; // stores logged in user data

/* SHORTCUTS */
const btnSet = document.getElementById("btn-set");
const newPass = document.getElementById("new-pass");
const toggleNewPass = document.getElementById("toggle-new-pass");
const btnGoLogin = document.getElementById("btn-go-login");
const btnGoSet = document.getElementById("btn-go-set");
const btnLogin = document.getElementById("btn-login");
const loginPass = document.getElementById("login-pass");
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

/* ---------------------------------
        PASSWORD SHOW / HIDE
---------------------------------- */
function togglePassword(inputEl, eyeSvg) {
  if (inputEl.type === "password") {
    inputEl.type = "text";
    eyeSvg.classList.add("text-blue-400");
  } else {
    inputEl.type = "password";
    eyeSvg.classList.remove("text-blue-400");
  }
}

toggleNewPass.addEventListener("click", () => {
  togglePassword(newPass, document.getElementById("new-pass-eye"));
});
toggleLoginPass.addEventListener("click", () => {
  togglePassword(loginPass, document.getElementById("login-pass-eye"));
});

/* ---------------------------------
        CREATE PASSWORD USER
---------------------------------- */
btnSet.onclick = async () => {
  const pass = newPass.value.trim();
  if (!pass) return alert("Enter a password");

  // check if password already exists
  const { data: existing, error: checkErr } = await supabase
    .from("users")
    .select("*")
    .eq("password", pass)
    .single();

  if (checkErr && checkErr.code !== "PGRST116") { 
    console.error(checkErr); 
    return alert("Error checking password"); 
  }

  if (existing) return alert("Password already exists. Try a new one!");

  const { data, error } = await supabase
    .from("users")
    .insert({ password: pass, notes: [], images: [], books: [] })
    .select()
    .single();

  if (error) {
    console.error(error);
    return alert("Error creating password");
  }

  alert("Password created! Please login.");
  newPass.value = "";

  screenSet.classList.add("hidden");
  screenLogin.classList.remove("hidden");
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
btnLogin.onclick = async () => {
  const pass = loginPass.value.trim();
  if (!pass) return alert("Enter password");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("password", pass)
    .single();

  if (error || !data) return alert("Wrong password");
  currentUser = data;

  await loadUserData();

  screenLogin.classList.add("hidden");
  screenApp.classList.remove("hidden");
  loginPass.value = "";
};

/* LOGOUT */
btnLogout.onclick = () => location.reload();

/* ---------------------------------
        LOAD USER DATA
---------------------------------- */
async function loadUserData() {
  currentUser.notes = currentUser.notes || [];
  currentUser.books = currentUser.books || [];
  currentUser.images = currentUser.images || [];

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
  (currentUser.notes || []).forEach(n => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-200 rounded";
    li.textContent = n;
    notesList.appendChild(li);
  });
}

btnSave.onclick = async () => {
  const t = noteInput.value.trim();
  if (!t) return;
  currentUser.notes.push(t);

  await supabase
    .from("users")
    .update({ notes: currentUser.notes })
    .eq("id", currentUser.id);

  loadNotes();
  noteInput.value = "";
};

btnClear.onclick = () => (noteInput.value = "");

/* ---------------------------------
        BOOKS
---------------------------------- */
btnUploadBook.onclick = async () => {
  const text = bookText.value.trim();
  const file = bookFile.files[0];

  if (!text && !file) return alert("Add text or select a document!");

  let fileURL = null;

  if (file) {
    const fileName = `${currentUser.id}_${Date.now()}_${file.name}`;
    const fullPath = `${BOOK_FOLDER}/${fileName}`;

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fullPath}`, {
      method: "PUT",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type
      },
      body: file
    });

    if (!uploadRes.ok) return alert("Document upload failed");
    fileURL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fullPath}`;
  }

  currentUser.books.push({ text, file: fileURL });

  await supabase
    .from("users")
    .update({ books: currentUser.books })
    .eq("id", currentUser.id);

  bookText.value = "";
  bookFile.value = "";

  loadBooks();
  alert("Book saved!");
};

function loadBooks() {
  booksList.innerHTML = "";
  (currentUser.books || []).forEach((b, i) => {
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
    btn.onclick = async e => {
      const index = e.target.dataset.i;
      currentUser.books.splice(index, 1);

      await supabase
        .from("users")
        .update({ books: currentUser.books })
        .eq("id", currentUser.id);

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
    const fileName = `${currentUser.id}_${Date.now()}_${file.name}`;
    const fullPath = `Gallery/${fileName}`;

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fullPath}`, {
      method: "PUT",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type
      },
      body: file
    });

    if (!uploadRes.ok) continue;

    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fullPath}`;
    currentUser.images.push(url);
  }

  await supabase
    .from("users")
    .update({ images: currentUser.images })
    .eq("id", currentUser.id);

  loadGallery();
  imageInput.value = "";
  alert("Images uploaded!");
};

function loadGallery() {
  galleryGrid.innerHTML = "";
  (currentUser.images || []).forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "w-full h-40 object-cover rounded cursor-pointer";
    img.onclick = () => openImage(src);
    galleryGrid.appendChild(img);
  });

  imgCount.innerText = (currentUser.images || []).length;
}

function openImage(src) {
  popupImg.src = src;
  imagePopup.classList.remove("hidden");
}

imagePopup.onclick = () => imagePopup.classList.add("hidden");

/* ---------------------------------
        TABS
---------------------------------- */
function showPanel(p) {
  ["notes","gallery","books"].forEach(name=>{
    document.getElementById(`panel-${name}`).classList.add("hidden");
    document.getElementById(`tab-${name}`).classList.remove("bg-indigo-600","text-white");
  });
  document.getElementById(`panel-${p}`).classList.remove("hidden");
  document.getElementById(`tab-${p}`).classList.add("bg-indigo-600","text-white");
}

document.getElementById("tab-notes").onclick = () => showPanel("notes");
document.getElementById("tab-gallery").onclick = () => showPanel("gallery");
document.getElementById("tab-books").onclick = () => showPanel("books");

