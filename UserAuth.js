const express = require("express");
const app = express();
const Users = require('./UserDetail');
const BattleUser=require('./BattleUserDetail')
let crypto = require("node:crypto")
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


app.post("/login", (req, res) => {
  const { mailId } = req.body;
  const user = Users.find((user) => user.mailId === mailId);
  if (user) {
    user.online = true;
    res.send({ message: `${user.name} Successfully logged In` });
  } else {
    res.send({ message: "User not found" });
  }
});

app.post("/logout", (req, res) => {
  const { mailId } = req.body;
  const user = Users.find((user) => user.mailId === mailId);
  if (user) {
    user.online = false;
    res.send({ message: `${user.name} Successfully logged Out` });
  } else {
    res.send({ message: "User not found" });
  }
});

let Battles = [];
let BattleHistory = [];
app.post("/battle/request", (req, res) => {
  const { id} = req.body;
  const player = BattleUser.find((player) => player.id === id);
  
  if (!player){
    return { message: "Player not found" };
  }
  if (!player.online) {
    return { message: "Player is offline" };
  }

    let players=[{...player,prevCups: 0, CupBonus: 0, prevXp: 0, XpBonus: 0}]
    let  battle = {
      roomId: generateRoomId(),
      state: 1,
      players
    };
    Battles.push(battle);
    let data = {roomId:battle.roomId,
    state:battle.state,
    players
    }
    return res.send(data)
  }

);


app.post('/join-battle', (req, res) => {
  let playerId = req.body.playerId;
  let roomId = req.body.roomId;
  let battleData = Battles.find(b => b.roomId === roomId);

  // console.log(battleData)
  if (battleData) {
    battleData.state = 2;
    battleData.players.push({ team: 2, id:playerId, name: `p${playerId}`, online: 'true', prevCups: 0, CupBonus: 0, prevXp: 0, XpBonus: 0 });
    BattleHistory=[...BattleHistory,battleData]
    res.json({
      roomId:roomId,
      state:battleData.state,
      players:battleData.players
    });

  } else {
    res.json  ({ error: 'Room not found' });
  }
});


app.post('/save-battle', (req, res) => {
  let roomId = req.body.roomId;
  let winnerId = req.body.winnerId;
  let looserId=req.body.looserId
  let teamId = req.body.teamId;
  let battleData = Battles.find(b => b.roomId === roomId);
  if (battleData) {
    if (battleData.state === 3) {
      res.json({ error: 'Battle already saved' });
      return;
    }
    battleData.state = 3;
    let winner = battleData.players.find(p => p.id === winnerId);
    let loser = battleData.players.find(p => p.id!== winnerId);
    
    // Update user data
    let winnerUserData = { mailId: `p${winnerId}@gmail.com`, id: winner.id, name: `p${winner.id}`, online: true, cups: GameStats.win.cups, xp: GameStats.win.xp };
    let loserUserData = { mailId: `p${looserId}@gmail.com`, id: loser.id, name: `p${loser.id}`, online: true, cups: GameStats.loose.cups, xp: GameStats.loose.xp };
    res.json({ WinnerNewData: winnerUserData, LooserNewData: loserUserData });
  } else {
    res.json({ error: 'Room not found' });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});