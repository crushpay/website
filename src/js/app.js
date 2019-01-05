
// RealFuel Javascript

/* HANDLES THE REGISTER MODAL */

var message = document.getElementById('modal_message')

function messageForm (string) {
  var div = document.createElement('p')
  div.innerHTML = '<p>' + string + '</p>'
  message.appendChild(div)
}

function clearModalMessage () {
  message.innerHTML = ''
}

function submitRegisterForm (e) {
  clearModalMessage()
  var flag = 0
  var firstname = cleanStr(document.getElementById('firstname').value)
  var lastname = cleanStr(document.getElementById('lastname').value)
  var email = cleanStr(document.getElementById('email').value)
  var phone = cleanNum(document.getElementById('phone').value)

  if (!firstname && !lastname && !email && !phone) {
    messageForm('Please complete the form.')
    --flag
  } else if (!validatePhone(phone)) {
    messageForm('Please add your country code.')
    --flag
  } else if (!validateEmail(email)) {
    messageForm('Plese check your email address.')
    --flag
  } else if (!validateName(firstname)) {
    messageForm('Please check your firstname.')
    --flag
  } else if (!validateName(lastname)) {
    messageForm('Please check your lastname.')
    --flag
  } else if (flag < 0) {
    clearModalMessage()
  } else if (flag === 0) {
    completeRegisterModal({
      firstname: firstname, 
      lastname: lastname, 
      email: email, 
      phone: cleanNum(phone)})
  }
}

var modalForm = document.getElementById('modal_form')
var registerComplete = document.getElementById('modal_complete')
var modalGdpr = document.getElementById('modal_gdpr')
var gdpr = document.getElementById('modal_gdpr_input')

var registerToken = {
  get: function () {
    return localStorage.getItem('realfuel')
  },
  set: function (payload) {
    var token = JSON.stringify(payload)
    return localStorage.setItem('realfuel', token)
  }
}

function completeRegisterModal (userData) {
  registerToken.set(userData)
  modalForm.style.visibility = 'hidden'
  registerComplete.style.visibility = 'visible'
  postRequest(userData)
}

function validateName (name) {
  var namereg = /^[a-z][a-z\s]*$/
  return namereg.test(String(name).toLowerCase())
}

function validateEmail (email) {
  var emailreg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailreg.test(String(email).toLowerCase())
}

function validatePhone (num) {
  var clean = cleanNum(num)
  var phonereg = /^[a-zA-Z0-9\-().\s]{10,15}$/
  return phonereg.test(String(clean))
}

function cleanNum(num) {
  var cleanNum = num.replace(/[^\d]/g, '')
  return cleanNum
}

function cleanStr(str) {
  var cleanStr = str.replace(/\s/g, '')
  return cleanStr
}

var modal = document.getElementById('myModal')

function openModal () {
  toggleGdprNotice()
  modal.style.display = 'block'
  if (registerToken.get()) {
    modalForm.style.visibility = 'hidden'
    registerComplete.style.visibility = 'visible'
  }
  clearModalMessage()
}

function closeModal () {
  modal.style.display = 'none'
  gdpr.checked = false
}

function gdprOk () {
  if (gdpr.value === 'on') {
    modalGdpr.style.visibility = 'hidden'
    modalForm.style.visibility = 'visible'
  }
}

function toggleGdprNotice () {
  if (registerToken.get()) {
    modalGdpr.style.visibility = 'hidden'
  } else {
    modalGdpr.style.visibility = 'visible'
    modalForm.style.visibility = 'hidden'
  }
}

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none'
    clearModalMessage()
  }
}

function postRequest (userInfo) {
  // var url = document.URL;
  // var url = 'http://localhost:4444/users'
  var aws = "https://cm0djctn7l.execute-api.ap-southeast-1.amazonaws.com/develop/users"
  postData(aws, userInfo)
    .then(function () { console.log('registered') })
    .catch(function (error) { console.error(error) })
}

function postData (url, data) {
  return fetch(url, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json'
    },
    method: 'PUT', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer' // *client, no-referrer
  })
    .then(function(response) { response.json() }) // parses response to JSON
}
