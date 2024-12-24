require("dotenv").config()
const express = require("express");
const path = require("path");
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

//username hasansemihkahveci
//password HHwoTrWoMuvHQeG2

//Start the server
app.listen(port, console.log(`Server is running on the port ${port}`))

let gameData = [];

//Rabbitmq connection
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

router.get('/results',(req,res,next) =>{
    res.status(200).json(gameData);
})

app.use(express.static(path.join(__dirname, 'backend')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // 'index.html' dosyanızın yolu
  });
router.post('/register',async (req,res,next) =>{
    const { playerName, score1,score2,score3,score4 } = req.body;
    gameData.push({playerName, score1,score2,score3,score4, date: new Date()});
    res.status(200).json({msg: 'Register operation completed succesfully.'})
    console.log("Mesaj geldi.")
})

app.use('/',router);


