const express = require("express");
const app = express();
const Users = require('./UserDetail');
const BattleUser=require('./BattleUserDetail')
let crypto = require("node:crypto");
let GameStats={
  win: {
    xp: 50,
    cups: 10
    },
    loose: {
    xp: 20,
    cups: 0
    }
}
function generateRoomId() {
  return crypto.randomUUID()
}
app.use(express.json());


app.post("/login",(req,res)=>{
  const{mailId}=req.body;
  const user = Users.find(user => user.mailId === mailId);
  if (!user) {
    res.send( {message:"User not found"})
  }
  if (user.online) {
    res.send({message:"User is already logged in"}) ;
  }
  user.online = true;
  res.send({message:`${user.name} Successfully logged In`});
})

app.post("/logout", (req, res) => {
  const { mailId } = req.body;
  const user = Users.find((user) => user.mailId === mailId);
 if(!user.online){
  res.send({message:"User is already logged out"})
 }
 user.online=false;
 res.send({message:`${user.name}Successfully logged out`})
});

let BattleHistory = [];
app.post("/battle/request", (req, res) => {
  const { id} = req.body;
  const player = Users.find((player) => player.id === id);
  
  if (!player){
    return { message: "Player not found" };
  }
  if(!player.online)
  {
    return{message:"Player is offline"}
  }
    let players=[{...player, cups: 0,  xp: 0}]
    let existingBattle = BattleHistory.find(battle => battle.players.some(players => players.id === id));
    if (existingBattle) {
      // update existing battle
      existingBattle.state = existingBattle.players.length + 1;
      existingBattle.players.push({
        team:existingBattle.players.length + 1,
        players
      });
    } 
      // create new battle
      let newBattle = {
        roomId: generateRoomId(),
        state: 1,
        players
      };
      let data = {roomId:newBattle.roomId,
        state:newBattle.state,
        players
      }
      BattleHistory.push(data);
  
    
  return res.send(data)
}

);
  
app.post('/save-battle', (req, res) => {
  let roomId = req.body.roomId;
  let winnerId = req.body.winnerId;
  let looserId=req.body.looserId
  let teamId = req.body.teamId;
  let battleData = BattleHistory.find(b => b.roomId === roomId);
  if (battleData) {
    if (battleData.state === 3) {
      res.json({ error: 'Battle already saved' });
      return;
    }
    battleData.state = 3;
    let winner = battleData.players.find(p => p.id === winnerId);
    let loser = battleData.players.find(p => p.id!== winnerId);
    
    // Update user data
    let winnerUserData = { mailId: `p${winnerId}@gmail.com`, id: winnerId, name: `p${winnerId}`, online: true, cups: GameStats.win.cups, xp: GameStats.win.xp };
    let loserUserData = { mailId: `p${looserId}@gmail.com`, id: looserId, name: `p${looserId}`, online: true, cups: GameStats.loose.cups, xp: GameStats.loose.xp };
    res.json({ WinnerNewData: winnerUserData, LooserNewData: loserUserData });
  } else {
    res.json({ error: 'Room not found' });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});