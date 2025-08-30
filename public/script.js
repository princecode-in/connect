let socket;

const usernamemodal = document.getElementById("mainuserbase");
const closebtn = document.getElementById("closeuserbase");
const settingbtn = document.getElementById("settingsBtn");
const startchatbtn = document.getElementById("userinputbase");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const chatWindow = document.getElementById("chat-window");
const usernameinput = document.getElementById("username");
const userholder = document.getElementById("currentNickname");


sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message && socket) {
    // check if connected
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = "<p style='color:blue;'> You : </p> " + message;
    chatWindow.appendChild(messageDiv);
    messageInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;

    socket.emit("user-msg", message); // now works
  } else {
    alert("⚠️ You must connect first!");
  }
});

function resetchat() {
  chatWindow.innerHTML = "";
  connectBtn.textContent = "Connect";
  socket = null;
}
function partnerDisconnected() {
  chatWindow.innerHTML = "";
  const info = document.createElement("div");
  info.textContent = "⚠️ Waiting for a new partner...";
  chatWindow.appendChild(info);
}

let currentUsername = localStorage.getItem("username") || "";
function openmodal() {
  usernamemodal.style.display = "flex";
  usernameinput.value = currentUsername;
  usernameinput.focus();
}

function closemodal() {
  usernamemodal.style.display = "none";
}

closebtn.addEventListener("click", closemodal);
settingbtn.addEventListener("click", () => {
  console.log("Settings button clicked!"); // Add this line
  openmodal();
});
window.addEventListener("DOMContentLoaded", () => {
  if (!currentUsername) {
    openmodal();
  } else {
    usernameinput.value = currentUsername;
  }
});
const connectBtn = document.getElementById("connect");
startchatbtn.addEventListener("click", () => {
  const username = usernameinput.value.trim();
  currentUsername = username;
  localStorage.setItem("username", currentUsername);
  usernameinput.value = currentUsername;
  closemodal();
  currentNickname.textContent = currentUsername || "stranger";
});


  currentNickname.textContent = currentUsername || "stranger";
connectBtn.addEventListener("click", () => {
  if (!socket) {
    // only connect once
    socket = io();
    socket.emit("set-username", currentUsername || "Stranger");
    connectBtn.innerHTML = "Disconnect";

    socket.on("usermsg", (msg) => {
      const messageDiv = document.createElement("div");
      if (typeof msg === "string") {
        // system message
        messageDiv.textContent = msg;
        if (
          msg.includes("❌") &&
          msg.includes("disconnected") &&
          msg.includes(currentUsername || "stranger")
        ) {
          setTimeout(() => {
            partnerDisconnected();
          }, 1500);
        }
      } else {
        // normal chat message (object)
        messageDiv.innerHTML = `<p style="color:red;">${msg.from} :</p> ${msg.text}`;
      }
      chatWindow.appendChild(messageDiv);
      // messageInput.value = "";
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    socket.on("disconnect", () => {
      resetchat();
    });
  } else {
    socket.disconnect();
    resetchat();
  }
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
usernameinput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startchatbtn.click();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && usernamemodal.style.display === "flex") {
    closemodal();
  }
});
