/* ---------------------------------
      SUPABASE SETUP
---------------------------------- */
const sb = window.supabase.createClient(
  "https://ytxhlihzxgftffaikumr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eGhsaWh6eGdmdGZmYWlrdW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODAxNTgsImV4cCI6MjA3OTQ1NjE1OH0._k5hfgJwVSrbXtlRDt3ZqCYpuU1k-_OqD7M0WML4ehA"
);

let currentUser = null;
const BUCKET = "images";
const BOOK_FOLDER = "BooksDocs";

/* ---------------------------------
        ELEMENT SHORTCUTS
---------------------------------- */
const btnSet = document.getElementById("btn-set");
const btnLogin = document.getElementById("btn-login");
const newPass = document.getElementById("new-pass");
const loginPass = document.getElementById("login-pass");

const toggleNewPass = document.getElementById("toggle-new-pass");
const toggleLoginPass = document.getElementById("toggle-login-pass");
const newPassEye = document.getElementById("new-pass-eye");
const loginPassEye = document.getElementById("login-pass-eye");

const screenSet = document.getElementById("screen-set");
const screenLogin = document.getElementById("screen-login");
const screenApp = document.getElementById("screen-app");

const btnGoLogin = document.getElementById("btn-go-login");
const btnGoSet = document.getElementById("btn-go-set");
const btnLogout = document.getElementById("btn-logout");

/* NOTES / BOOKS / GALLERY */
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

/* ---------------------------------
        UTIL: toggle password visibility
---------------------------------- */
function togglePasswordInput(inputEl, eyeSvg) {
  if (!inputEl) return;
  if (inputEl.type === "password") {
    inputEl.type = "text";
    if (eyeSvg) eyeSvg.classList.add("text-blue-400");
  } else {
    inputEl.type = "password";
    if (eyeSvg) eyeSvg.classList.remove("text-blue-400");
  }
}
toggleNewPass?.addEventListener("click", () => togglePasswordInput(newPass, newPassEye));
toggleLoginPass?.addEventListener("click", () => togglePasswordInput(loginPass, loginPassEye));

/* ---------------------------------
        CREATE PASSWORD
---------------------------------- */
btnSet?.addEventListener("click", async () => {
  const password = newPass?.value?.trim();
  if (!password) return alert("Enter a password");

  try {
    const { data: exists, error: checkErr } = await sb
      .from("users")
      .select("id")
      .eq("password", password)
      .limit(1);

    if (checkErr) {
      console.error("Error checking users table:", checkErr);
      return alert("Error creating password (see console)");
    }

    if (exists && exists.length > 0) return alert("This password already exists!");

    const { error } = await sb.from("users").insert([{ password }]);
    if (error) {
      console.error("Insert error:", error);
      return alert("Error creating password (see console)");
    }

    alert("Password created!");
    newPass.value = "";
  } catch (e) {
    console.error("Unexpected set error:", e);
    alert("Unexpected error (see console)");
  }
});

/* ---------------------------------
              LOGIN
---------------------------------- */
btnLogin?.addEventListener("click", async () => {
  const password = loginPass?.value?.trim();
  if (!password) return alert("Enter password");

  try {
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("password", password)
      .limit(1);

    if (error) {
      console.error("Login select error:", error);
      return alert("Login failed (see console)");
    }

    if (!data || data.length === 0) return alert("Wrong password");

    currentUser = password;
    loginPass.value = "";

    screenLogin?.classList.add("hidden");
    screenApp?.classList.remove("hidden");

    await loadNotes();
    await loadBooks();
    await loadGallery();
  } catch (e) {
    console.error("Unexpected login error:", e);
    alert("Unexpected error during login (see console)");
  }
});

/* ---------------------------------
        SCREEN SWITCH
---------------------------------- */
btnGoLogin?.addEventListener("click", () => {
  screenSet?.classList.add("hidden");
  screenLogin?.classList.remove("hidden");
});
btnGoSet?.addEventListener("click", () => {
  screenLogin?.classList.add("hidden");
  screenSet?.classList.remove("hidden");
});
btnLogout?.addEventListener("click", () => location.reload());

/* ---------------------------------
              NOTES
---------------------------------- */
async function loadNotes() {
  try {
    const { data = [], error } = await sb
      .from("notes")
      .select("*")
      .eq("user_password", currentUser)
      .order("id");

    if (error) return console.error("loadNotes error:", error);

    notesList.innerHTML = "";
    data.forEach(n => {
      const li = document.createElement("li");
      li.className = "p-2 bg-gray-200 rounded";
      li.textContent = n.text;
      notesList.appendChild(li);
    });
  } catch (e) {
    console.error("loadNotes unexpected:", e);
  }
}

btnSave?.addEventListener("click", async () => {
  const text = noteInput?.value?.trim();
  if (!text) return;
  try {
    const { error } = await sb.from("notes").insert([{ text, user_password: currentUser }]);
    if (error) return alert("Could not save note: " + error.message);
    noteInput.value = "";
    await loadNotes();
  } catch (e) {
    console.error("saveNote unexpected:", e);
  }
});

btnClear?.addEventListener("click", () => (noteInput.value = ""));

/* ---------------------------------
              BOOKS
---------------------------------- */
async function loadBooks() {
  try {
    const { data = [], error } = await sb
      .from("books")
      .select("*")
      .eq("user_password", currentUser)
      .order("id");

    if (error) return console.error("loadBooks error:", error);

    booksList.innerHTML = "";
    data.forEach(b => {
      const li = document.createElement("li");
      li.className = "p-3 bg-purple-200 rounded";
      li.innerHTML = `
        <div class="font-medium mb-1">${b.text || "(No text)"}</div>
        <div class="flex gap-4">
          ${b.file_url ? `<a href="${b.file_url}" class="text-blue-700 underline" download>Download</a>` : ""}
        </div>
      `;
      booksList.appendChild(li);
    });
  } catch (e) {
    console.error("loadBooks unexpected:", e);
  }
}

btnUploadBook?.addEventListener("click", async () => {
  const text = bookText?.value?.trim();
  const file = bookFile?.files[0];
  if (!text && !file) return alert("Add text or choose a file");

  try {
    let fileURL = null;
    if (file) {
      const filename = `${currentUser}_${Date.now()}_${file.name}`;
      const path = `${BOOK_FOLDER}/${filename}`;

      const { error: uploadErr } = await sb.storage.from(BUCKET).upload(path, file);
      if (uploadErr) return alert("Upload failed: " + uploadErr.message);

      const { data: pubData } = sb.storage.from(BUCKET).getPublicUrl(path);
      fileURL = pubData?.publicUrl ?? null;
    }

    const { error } = await sb.from("books").insert([{ text, file_url: fileURL, user_password: currentUser }]);
    if (error) return alert("Could not save book: " + error.message);

    bookText.value = "";
    bookFile.value = "";
    await loadBooks();
    alert("Book saved!");
  } catch (e) {
    console.error("uploadBook unexpected:", e);
  }
});

/* ---------------------------------
              GALLERY
---------------------------------- */
btnChoose?.addEventListener("click", () => imageInput?.click());

async function loadGallery() {
  try {
    const { data = [], error } = await sb
      .from("images")
      .select("*")
      .eq("user_password", currentUser)
      .order("id");

    if (error) return console.error("loadGallery error:", error);

    galleryGrid.innerHTML = "";
    data.forEach(i => {
      const img = document.createElement("img");
      img.src = i.file_url;
      img.className = "w-full h-40 object-cover rounded cursor-pointer";
      img.onclick = () => {
        document.getElementById("popup-img").src = i.file_url;
        document.getElementById("image-popup").classList.remove("hidden");
      };
      galleryGrid.appendChild(img);
    });

    imgCount.innerText = data.length;
  } catch (e) {
    console.error("loadGallery unexpected:", e);
  }
}

btnUpload?.addEventListener("click", async () => {
  const files = imageInput?.files;
  if (!files || !files.length) return alert("Select images");

  try {
    for (let file of files) {
      const filename = `${currentUser}_${Date.now()}_${file.name}`;
      const path = `Gallery/${filename}`;

      const { error: uploadErr } = await sb.storage.from(BUCKET).upload(path, file);
      if (uploadErr) {
        console.error("image upload error:", uploadErr);
        continue;
      }

      const { data: pubData } = sb.storage.from(BUCKET).getPublicUrl(path);
      const url = pubData?.publicUrl ?? null;

      await sb.from("images").insert([{ file_url: url, user_password: currentUser }]);
    }

    imageInput.value = "";
    await loadGallery();
    alert("Images uploaded!");
  } catch (e) {
    console.error("uploadImages unexpected:", e);
  }
});

/* ---------------------------------
            TABS & IMAGE POPUP
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

document.getElementById("image-popup").onclick = () =>
  document.getElementById("image-popup").classList.add("hidden");
