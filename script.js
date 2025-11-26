/* ---------------------------------
      SUPABASE SETUP
---------------------------------- */
const sb = window.supabase.createClient(
  "https://ytxhlihzxgftffaikumr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eGhsaWh6eGdmdGZmYWlrdW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODAxNTgsImV4cCI6MjA3OTQ1NjE1OH0._k5hfgJwVSrbXtlRDt3ZqCYpuU1k-_OqD7M0WML4ehA"
);

let currentUser = null;

/* ELEMENTS */
const screenSignup = document.getElementById("screen-signup");
const screenLogin = document.getElementById("screen-login");
const screenApp = document.getElementById("screen-app");

const signupEmail = document.getElementById("signup-email");
const signupPass = document.getElementById("signup-pass");
const btnSignup = document.getElementById("btn-signup");
const gotoLogin = document.getElementById("goto-login");

const loginEmail = document.getElementById("login-email");
const loginPass = document.getElementById("login-pass");
const btnLogin = document.getElementById("btn-login");
const btnForgot = document.getElementById("btn-forgot");
const gotoSignup = document.getElementById("goto-signup");

const btnLogout = document.getElementById("btn-logout");

/* notes */
const noteInput = document.getElementById("note-input");
const btnSave = document.getElementById("btn-save");
const notesList = document.getElementById("notes-list");

/* gallery */
const imageInput = document.getElementById("image-input");
const btnUpload = document.getElementById("btn-upload");
const galleryGrid = document.getElementById("gallery-grid");

/* books */
const bookText = document.getElementById("book-text");
const bookFile = document.getElementById("book-file");
const btnUploadBook = document.getElementById("btn-upload-book");
const booksList = document.getElementById("books-list");

/* forgot */
const screenForgotInline = document.getElementById("screen-forgot-inline");
const forgotEmailInline = document.getElementById("forgot-email-inline");
const btnSendResetInline = document.getElementById("btn-send-reset-inline");
const btnBackToLogin = document.getElementById("btn-back-to-login");

/* fullscreen popup */
const imagePopup = document.getElementById("image-popup");
const popupImg = document.getElementById("popup-img");

/* ---------------------------------
     SCREEN SWITCHING
---------------------------------- */
gotoLogin.addEventListener("click", () => {
  screenSignup.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

gotoSignup.addEventListener("click", () => {
  screenLogin.classList.add("hidden");
  screenSignup.classList.remove("hidden");
});

btnForgot.addEventListener("click", () => {
  screenLogin.classList.add("hidden");
  screenForgotInline.classList.remove("hidden");
});

btnBackToLogin.addEventListener("click", () => {
  screenForgotInline.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

/* ---------------------------------
      SIGNUP
---------------------------------- */
btnSignup.addEventListener("click", async () => {
  const email = signupEmail.value.trim();
  const password = signupPass.value.trim();
  if (!email || !password) return alert("Enter email & password");

  const { error } = await sb.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert("Account created! Login now.");
  signupEmail.value = signupPass.value = "";
  screenSignup.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

/* ---------------------------------
      LOGIN
---------------------------------- */
btnLogin.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPass.value.trim();
  if (!email || !password) return alert("Enter email & password");

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  currentUser = data.user;
  showApp();
});

/* ---------------------------------
      FORGOT PASSWORD
---------------------------------- */
btnSendResetInline.addEventListener("click", async () => {
  const email = forgotEmailInline.value.trim();
  if (!email) return alert("Enter your email");

  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-notes-jade-five.vercel.app/reset.html",
  });

  alert("Reset link sent if email exists.");
});

/* ---------------------------------
     SHOW APP
---------------------------------- */
function showApp() {
  screenSignup.classList.add("hidden");
  screenLogin.classList.add("hidden");
  screenForgotInline.classList.add("hidden");
  screenApp.classList.remove("hidden");

  const emailDisplay = document.querySelector("#screen-app .email-display");
  if (emailDisplay) emailDisplay.style.display = "none";

  loadNotes();
  loadGallery();
  loadBooks();
}

/* ---------------------------------
     LOGOUT
---------------------------------- */
btnLogout.addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});

/* ---------------------------------
      NOTES
---------------------------------- */
async function loadNotes() {
  const { data = [] } = await sb
    .from("notes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("id");

  notesList.innerHTML = "";
  data.forEach((n) => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-100 rounded";
    li.textContent = n.text;
    notesList.appendChild(li);
  });
}

btnSave.addEventListener("click", async () => {
  const text = noteInput.value.trim();
  if (!text) return;

  await sb.from("notes").insert([{ text, user_id: currentUser.id }]);
  noteInput.value = "";
  loadNotes();
});

/* ---------------------------------
      FULLSCREEN POPUP
---------------------------------- */
function openFullscreen(url) {
  popupImg.src = url;
  imagePopup.classList.remove("hidden");
}

imagePopup.addEventListener("click", () => {
  imagePopup.classList.add("hidden");
  popupImg.src = "";
});

/* ---------------------------------
      GALLERY (FIXED FULL VIEW)
---------------------------------- */
btnUpload.addEventListener("click", async () => {
  const files = imageInput.files;
  if (!files.length) return alert("Select images");

  for (const file of files) {
    const name = `${currentUser.id}_${Date.now()}_${file.name}`;
    const path = `Gallery/${name}`;

    const { error: uploadError } = await sb.storage
      .from("images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: urlData } = sb.storage.from("images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await sb
      .from("images")
      .insert([{ file_url: publicUrl, user_id: currentUser.id }]);
  }

  loadGallery();
});

async function loadGallery() {
  const { data = [] } = await sb
    .from("images")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("id");

  galleryGrid.innerHTML = "";

  data.forEach((imgObj) => {
    const img = document.createElement("img");

    img.src = imgObj.file_url;
    img.className =
      "w-full h-32 object-contain rounded-xl shadow cursor-pointer";
    img.loading = "lazy";

    img.addEventListener("click", () => openFullscreen(imgObj.file_url));

    galleryGrid.appendChild(img);
  });
}

/* ---------------------------------
      BOOKS
---------------------------------- */
btnUploadBook.addEventListener("click", async () => {
  const file = bookFile.files[0];
  let fileURL = null;

  if (file) {
    const name = `${currentUser.id}_${Date.now()}_${file.name}`;
    const path = `BooksDocs/${name}`;
    await sb.storage.from("images").upload(path, file);
    const { data } = sb.storage.from("images").getPublicUrl(path);
    fileURL = data.publicUrl;
  }

  await sb.from("books").insert([
    { text: bookText.value.trim(), file_url: fileURL, user_id: currentUser.id },
  ]);

  loadBooks();
});

async function loadBooks() {
  const { data = [] } = await sb
    .from("books")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("id");

  booksList.innerHTML = "";

  data.forEach((b) => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-100 rounded";
    li.innerHTML = `
      <div>${b.text}</div>
      ${b.file_url ? `<a href="${b.file_url}" class="text-blue-600 underline" target="_blank">Download</a>` : ""}
    `;
    booksList.appendChild(li);
  });
}

