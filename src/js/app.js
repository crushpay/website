// Chad

var url = 'https://fskbr5z7pf.execute-api.ap-northeast-2.amazonaws.com/dev'

var crushBar = document.getElementById('crush-bar')
var crushButton = document.getElementById('crush-button')
var paymentAmount = document.getElementById('payment-amount')
var paymentId = document.getElementById('payment-id')
var paymentAddress = document.getElementById('payment-address')
var paymentCopyButton = document.getElementById('payment-copy-button')
var paymentReceipt = document.getElementById('payment-receipt')

var loader = document.getElementById('loader')

function xhrPostHelper(uri, payload, callback) {
  fetch(url + uri, {
    body: JSON.stringify(payload), 
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'user-agent': 'Mozilla/4.0 CrushPay.io',
      'content-type': 'application/json'
    },
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    referrer: 'no-referrer' 
  })
  .then(function (response) {
    var newPromise = Promise.resolve(response.json())
    return newPromise.then(function(data) { callback(data) })
  })
}

function createPaymentRequest () {
  var amount = document.getElementById('amount-input')

  if (amount.value) {
    var payload = { amount: amount.value }
    console.log('creating lightning payment for ', amount.value)
    xhrPostHelper('/payment/create', payload, handleCreatePaymentResponse)
    loader.style.visibility = 'visible'
    paymentReceipt.innerHTML = ''
  } else {
    console.log('no amount given')
  }
}

function handleCreatePaymentResponse (resp) {
  console.log(resp)
  var id = resp.id
  paymentAddress.innerHTML = ''
  paymentAddress.append(resp.address)
  // crushBar.style.backgroundColor = 'lightcoral'
  crushButton.style.visibility = 'hidden'
  checkPaymentStatusRequest(id)
}

function checkPaymentStatusRequest (id) {
  console.log('checking payment status', id)
  var payload = { id: id }
  xhrPostHelper('/payment/check', payload, handleCheckPaymentResponse)
}

function handleCheckPaymentResponse(resp) {
  if (resp.status === 'unpaid') {
    console.log(resp)
    setTimeout(function () {
      return checkPaymentStatusRequest(resp.id)
    }, 1000)
  } else {
    console.log(resp)
    paymentAddress.innerHTML = ''
    paymentReceipt.innerHTML = '<b>Payment Successful. Lightning Invoice:</b><br><p>' + JSON.stringify(resp.lightning_invoice) + '</p>'
    paymentCopyButton.innerHTML = ''
    crushBar.style.backgroundColor = 'white'
    crushButton.style.visibility = 'visible'
    loader.style.visibility = 'hidden'
    return true
  }
}
