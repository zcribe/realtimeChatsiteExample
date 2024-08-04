const loginPanel = document.getElementById("login-panel");
const homePanel = document.getElementById("home-panel");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameSignupInput = document.getElementById("username-signup");
const passwordSignupInput = document.getElementById("password-signup");
const socketIdSpan = document.getElementById("socket-id");
const logoutForm = document.getElementById("logout-form");
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const typing = document.getElementById("typing");
const members = document.getElementById("members");
const typers = document.getElementById("typers");
const signupBar = document.getElementById("signup-bar");
const modal = document.getElementById("myModal");
const btn = document.getElementById("myBtn");
const span = document.getElementsByClassName("close")[0];

let socket;

async function main() {
  const token = localStorage.getItem("token");

  if (!token) {
    return showLoginPanel();
  }

  const res = await fetch("/api/v1/self", {
    headers: {
      authorization: `bearer ${token}`,
    },
  });

  if (res.status === 200) {
    showHomePanel();
  } else {
    showLoginPanel();
  }
}

function showHomePanel() {
  loginPanel.style.display = "none";
  homePanel.style.display = "block";

  // this will only work if HTTP long-polling is enabled, since WebSockets do not support providing additional headers
  socket = io({
    extraHeaders: {
      authorization: `bearer ${localStorage.getItem("token")}`,
    },
  });

  socket.on("connect", async () => {
    socket.emit("whoami", (username) => {});
  });

  socket.on("disconnect", () => {});

  socket.on("chat message", async (msg) => {
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTo(0, messages.scrollHeight);
  });

  socket.on("user left", (msg) => {
    const item = document.createElement("li");
    item.textContent = `${msg.username} left the room`;
    messages.appendChild(item);
    messages.scrollTo(0, messages.scrollHeight);
  });

  socket.on("typers", (list) => {
    typers.innerHTML = "";
    for (const element of list) {
      const item = document.createElement("span");
      item.textContent = element;
      typers.appendChild(item);
    }
  });

  socket.on("members", (list) => {
    members.innerHTML = "";
    for (const element of list) {
      const item = document.createElement("li");
      item.textContent = element;
      members.appendChild(item);
    }
  });
}

function showLoginPanel() {
  loginPanel.style.display = "block";
  homePanel.style.display = "none";
  signupBar.style.display = "none";
}

loginForm.onsubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/v1/login/", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: usernameInput.value,
      password: passwordInput.value,
    }),
  });

  if (res.status === 200) {
    const { token } = await res.json();
    localStorage.setItem("token", token);
    const response = await fetch("/api/v1/message/", {
      headers: {
        authorization: `bearer ${localStorage.getItem("token")}`,
      },
    });
    const chatMessages = await response.json();
    for (const message of chatMessages) {
      const item = document.createElement("li");
      item.textContent = `${message.author}: ${message.message}`;
      messages.appendChild(item);
    }
    showHomePanel();
    messages.scrollTo(0, messages.scrollHeight);
  } else {
    passwordInput.value = "";
  }
};

signupForm.onsubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/v1/user/", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: usernameSignupInput.value,
      password: passwordSignupInput.value,
    }),
  });

  if (res.status === 201) {
    modal.style.display = "none";
  } else {
    passwordSignupInput.value = "";
  }
};

logoutForm.onsubmit = (e) => {
  e.preventDefault();

  socket.disconnect();
  localStorage.removeItem("token");

  showLoginPanel();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

input.addEventListener("input", (event) => {
    socket.emit("typing");


  setTimeout(() => {
      socket.emit("stop typing");
  }, 3000);
});

btn.onclick = () => {
  modal.style.display = "block";
};
span.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

main();
