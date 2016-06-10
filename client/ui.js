var UI = {};

// UI.enable = function(id) { document.getElementById(id).classList.remove("mdl-button--disabled");};
// UI.disable = function(id) { document.getElementById(id).classList.add("mdl-button--disabled");};
UI.enable = function(id) { document.getElementById(id).disabled = false; };
UI.disable = function(id) { document.getElementById(id).disabled = true; };
UI.setLabel = function(text) { var lbl = document.getElementById("phone-state"); lbl.innerText = text; };
UI.showMessage = function(from, subject, content) { console.log(from, subject, content); };
