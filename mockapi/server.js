const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const uuid = require('uuid/v4')

const adapter = new FileSync('./mockapi/users.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)

function saveUser (user) {
  try {
    db.defaults({ users: []})
      .write()
    db.get('users')
      .push(user)
      .write()
    console.log(user)
  } catch (e) {
    console.log(e)
  }
}

app.use(cors())
app.use(helmet())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.post('/register', function (req, res) {
  // Add a post
  let user = req.body
  user.id = uuid()
  saveUser(user)

  res.json({'status': 200, 'data': 'saved'})
})

app.get('/', (req, res) => {
  res.send('ok')
  console.log('got it')
})

app.listen(4444, () => console.log('mock server at http://localhost:4444'))
