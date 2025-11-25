/* ---------------------------------
      SUPABASE SETUP
---------------------------------- */
const sb = window.supabase.createClient(
  "https://ytxhlihzxgftffaikumr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eGhsaWh6eGdmdGZmYWlrdW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODAxNTgsImV4cCI6MjA3OTQ1NjE1OH0._k5hfgJwVSrbXtlRDt3ZqCYpuU1k-_OqD7M0WML4ehA"
);

let currentUser = null;

/* ---------------------------------
      ELEMENTS
---------------------------------- */
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
const userEmailEl = document.getElementById("user-email");

/* notes/gallery/books elements */
const noteInput = document.getElementById("note-input");
const btnSave = document.getElementById("btn-save");
const notesList = document.getElementById("notes-list");

const imageInput = document.getElementById("image-input");
const btnUpload = document.getElementById("btn-upload");
const galleryGrid = document.getElementById("gallery-grid");

const bookText = document.getElementById("book-text");
const bookFile = document.getElementById("book-file");
const btnUploadBook = document.getElementById("btn-upload-book");
const booksList = document.getElementById("books-list");

/* inline forgot (optional) */
const screenForgotInline = document.getElementById("screen-forgot-inline");
const forgotEmailInline = document.getElementById("forgot-email-inline");
const btnSendResetInline = document.getElementById("btn-send-reset-inline");
const btnBackToLogin = document.getElementById("btn-back-to-login");

/* ---------------------------------
      UI: screen switching
---------------------------------- */
gotoLogin?.addEventListener("click", () => {
  screenSignup.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

document.getElementById("goto-signup")?.addEventListener("click", () => {
  screenLogin.classList.add("hidden");
  screenSignup.classList.remove("hidden");
});

document.getElementById("btn-forgot")?.addEventListener("click", () => {
  screenLogin.classList.add("hidden");
  screenForgotInline.classList.remove("hidden");
});

btnBackToLogin?.addEventListener("click", () => {
  screenForgotInline.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

/* ---------------------------------
      SIGNUP
---------------------------------- */
btnSignup?.addEventListener("click", async () => {
  const email = signupEmail.value.trim();
  const password = signupPass.value.trim();
  if (!email || !password) return alert("Enter email and password");

  const { error } = await sb.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert("Sign up successful! Check your email for verification (if enabled).");
  signupEmail.value = signupPass.value = "";
  // show login
  screenSignup.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

/* ---------------------------------
      LOGIN
---------------------------------- */
btnLogin?.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPass.value.trim();
  if (!email || !password) return alert("Enter email and password");

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  currentUser = data.user;
  if (!currentUser) return alert("Login failed: no user returned.");

  userEmailEl.innerText = currentUser.email;
  showApp();
});

/* ---------------------------------
      FORGOT (send reset email)
---------------------------------- */
btnSendResetInline?.addEventListener("click", async () => {
  const email = forgotEmailInline.value.trim();
  if (!email) return alert("Enter email");

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-notes-jade-five.vercel.app/reset.html"
  });
  if (error) return alert(error.message);

  alert("If the email exists, a reset link was sent.");
  forgotEmailInline.value = "";
  screenForgotInline.classList.add("hidden");
  screenLogin.classList.remove("hidden");
});

/* ---------------------------------
      SHOW APP
---------------------------------- */
function showApp() {
  screenSignup.classList.add("hidden");
  screenLogin.classList.add("hidden");
  screenApp.classList.remove("hidden");
  loadNotes();
  loadGallery();
  loadBooks();
}

/* ---------------------------------
      LOGOUT
---------------------------------- */
btnLogout?.addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});

/* ---------------------------------
      NOTES (table: notes with user_id UUID)
---------------------------------- */
async function loadNotes() {
  if (!currentUser) return;
  const { data = [], error } = await sb
    .from("notes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("id");

  if (error) return console.error("loadNotes:", error);
  notesList.innerHTML = "";
  data.forEach(n => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-100 rounded";
    li.textContent = n.text;
    notesList.appendChild(li);
  });
}

btnSave?.addEventListener("click", async () => {
  if (!currentUser) return alert("Not logged in");
  const text = noteInput.value.trim();
  if (!text) return;
  const { error } = await sb.from("notes").insert([{ text, user_id: currentUser.id }]);
  if (error) return alert(error.message);
  noteInput.value = "";
  loadNotes();
});

/* ---------------------------------
      GALLERY (table: images with user_id)
---------------------------------- */
btnUpload?.addEventListener("click", async () => {
  if (!currentUser) return alert("Not logged in");
  const files = imageInput.files;
  if (!files || files.length === 0) return alert("Select images");

  for (const file of files) {
    const filename = `${currentUser.id}_${Date.now()}_${file.name}`;
    const path = `Gallery/${filename}`;

    const { error: uploadErr } = await sb.storage.from("images").upload(path, file);
    if (uploadErr) {
      console.error("uploadErr", uploadErr);
      continue;
    }
    const { data } = sb.storage.from("images").getPublicUrl(path);
    const url = data?.publicUrl ?? null;
    if (url) {
      await sb.from("images").insert([{ file_url: url, user_id: currentUser.id }]);
    }
  }
  imageInput.value = "";
  loadGallery();
});

async function loadGallery() {
  if (!currentUser) return;
  const { data = [], error } = await sb.from("images").select("*").eq("user_id", currentUser.id).order("id");
  if (error) return console.error("loadGallery", error);
  galleryGrid.innerHTML = "";
  data.forEach(i => {
    const img = document.createElement("img");
    img.src = i.file_url;
    img.className = "w-full h-24 object-cover rounded mb-2";
    galleryGrid.appendChild(img);
  });
}

/* ---------------------------------
      BOOKS (table: books with user_id)
---------------------------------- */
btnUploadBook?.addEventListener("click", async () => {
  if (!currentUser) return alert("Not logged in");
  const file = bookFile.files[0];
  let fileURL = null;
  if (file) {
    const filename = `${currentUser.id}_${Date.now()}_${file.name}`;
    const path = `BooksDocs/${filename}`;
    const { error: uploadErr } = await sb.storage.from("images").upload(path, file);
    if (uploadErr) return alert(uploadErr.message);
    const { data } = sb.storage.from("images").getPublicUrl(path);
    fileURL = data?.publicUrl ?? null;
  }
  const text = bookText.value.trim();
  const { error } = await sb.from("books").insert([{ text, file_url: fileURL, user_id: currentUser.id }]);
  if (error) return alert(error.message);
  bookText.value = "";
  bookFile.value = "";
  loadBooks();
});

async function loadBooks() {
  if (!currentUser) return;
  const { data = [], error } = await sb.from("books").select("*").eq("user_id", currentUser.id).order("id");
  if (error) return console.error("loadBooks", error);
  booksList.innerHTML = "";
  data.forEach(b => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-50 rounded";
    li.innerHTML = `<div class="font-medium">${b.text || "(No text)"}</div>
                    ${b.file_url ? `<a href="${b.file_url}" class="text-blue-600 underline" download>Download</a>` : ''}`;
    booksList.appendChild(li);
  });
}

/* ---------------------------------
   PASSWORD RESET: handle recovery flow on reset.html
---------------------------------- */
sb.auth.onAuthStateChange(async (event, session) => {
  // When user opens the reset link Supabase emits PASSWORD_RECOVERY
  if (event === "PASSWORD_RECOVERY") {
    // On the reset page (reset.html) this code will prompt user to enter new password
    // (we also handle it if they open index while having recovery session)
    const newPass = prompt("Enter your new password:");
    if (!newPass) return alert("No password entered");
    const { error } = await sb.auth.updateUser({ password: newPass });
    if (error) return alert(error.message);
    alert("Password updated. Please login with your new password.");
    // optional: redirect to index (login)
   window.location.href = "https://my-notes-jade-five.vercel.app";

  }
});
