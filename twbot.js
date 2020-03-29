console.log('Bot STARTING...')

//Importo la dependencia de twit
var Twit = require('twit');

//Importo la dependencia de firebase
var admin = require('firebase-admin');

//Me conecto a la API de twitter mediante Twit
var twitterConfig = require('./twitterconfig');
var T = new Twit(twitterConfig);

//Me conecto a la API de firabase mediante firebase-admin
var firebaseConfig = require('./firebaseconfig');
let defaultAppConfig = {
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: 'https://yourDB.firebaseio.com/'
}
defaultApp = admin.initializeApp(defaultAppConfig);

// Creo una referencia a la base de datos(firebase)
const db = admin.database(); 

//--Lógica
var newRandomIndex = 0;
responderMenciones(60000);

//--Funciones 

//--Recursivo
function responderMenciones(tiempo) {
  intervalo(tiempo).then(() => {
    buscoTweets("@yourBotAccount").then(data => {
      responderTweets(data);
    })
    //LOOP INFINITO
    console.log('\n' + "----RESPONDIENDO MENCIONES----");
    responderMenciones(tiempo);
  }
  )
}

async function responderTweets(tweets) {

  dbIds = await traerIdsDB();

  for (let i = 0; i < tweets.statuses.length; i++) {

    if (tweets.statuses[i].user.screen_name === "yourBotAccount") {
      console.log("Tweet propio");
      continue;
    }
    else if (dbIds.includes(tweets.statuses[i].id_str)) {
      console.log("Tweet [" + tweets.statuses[i].id_str + "] ya respondido");
      continue;
    }
    else {

      let tweet = {
        id: tweets.statuses[i].id_str,
        usuario: tweets.statuses[i].user.screen_name,
        creacion: tweets.statuses[i].created_at
      }

      let frases = await traerFrasesDb();
      let tw_frase = await generarFraseRandom(frases);
      let tweeteado = await tweetear(tweet.usuario, tw_frase, tweet.id);
      console.log(tweeteado);
      let faveado = await favearTweet(tweet.id);
      console.log(faveado);
      let fbase = await pushToFirebase(tweet.usuario, tw_frase, tweet.id, tweet.creacion);
      console.log(fbase);
    }
  }
}

function traerIdsDB() {
  // Obtengo todos los valores en el nivel inferior a la clave y me los guardo
  const promesa = new Promise((resolve, reject) => {
    let Ids = [];
    var query = db.ref("tweets").orderByKey();
    query.once("value")
      .then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          // valores almacenados a partir de la clave
          var childData = childSnapshot.val();
          Ids.push(childData.replyId);
        })
      }).then(() => {
        if (Ids.length > 0) {
          resolve(Ids);
        }
        else {
          reject("Error obteniendo Ids");
        }
      })
  });

  return promesa;
}

function traerFrasesDb() {
  // Obtengo todos los valores en el nivel inferior a la clave y me los guardo
  const promesa = new Promise((resolve, reject) => {
    let frases = [];
    var query = db.ref("frases").orderByKey();
    query.once("value")
      .then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          // valores almacenados a partir de la clave
          var childData = childSnapshot.val();
          frases.push(childData);
        })
      }).then(() => {
        if (frases.length > 0) {
          resolve(frases);
        }
        else {
          reject("Error obteniendo frases");
        }
      })
  });

  return promesa;
}


function buscoTweets(busqueda) {

  const promesa = new Promise((resolve, reject) => {
    T.get('search/tweets', { q: busqueda }, function (err, data, response) {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    })
  })
  return promesa;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function intervalo(tiempo) {
  await sleep(tiempo);
}

function numeroAleatorio(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function generarFraseRandom(quotes) {

  const promesa = new Promise((resolve, reject) => {
    let quote;
    obtenderIndice()
      .then(indice => {
        let numeroRandom = numeroAleatorio(0, (quotes.length - 1));
        while (indice[0] === numeroRandom) {
          numeroRandom = numeroAleatorio(0, (quotes.length - 1));
        }
        newRandomIndex = numeroRandom;
        quote = quotes[numeroRandom];
      }).then(() => {
        if (quote != undefined) {
          resolve(quote);
        }
        else {
          reject("Error obteniendo indices");
        }
      })
  });

  return promesa;

}

function obtenderIndice() {

  // Obtengo todos los valores en el nivel inferior a la clave y me los guardo
  const promesa = new Promise((resolve, reject) => {
    let indice = [];
    var query = db.ref("indice").orderByKey();
    query.once("value")
      .then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          // valores almacenados a partir de la clave
          var childData = childSnapshot.val();
          indice.push(childData);
        })
      }).then(() => {
        if (indice.length > 0) {
          resolve(indice);
        }
        else {
          reject("Error obteniendo indices");
        }
      })
  });

  return promesa;

}

function tweetear(nombre, frase, id) {

  const promesa = new Promise(function (resolve, reject) {

    let respuesta;
    let tweetToTweet = "@" + nombre + " " + frase;

    var params = {
      status: tweetToTweet,
      in_reply_to_status_id: id
    };

    T.post('statuses/update', params, function (err, data, response) {
      if (err !== undefined) {
        reject('Error al tweetar ' + err);
      } else {
        respuesta = '-> 1 | TweetId: [' + id + "] Respondido con exito, respuesta: [" + tweetToTweet + "]";
        resolve(respuesta);
      }
    });
  });

  return promesa;
}

function pushToFirebase(username, replyText, replyId, date) {

  const promesa = new Promise(function (resolve, reject) {

    let usuario = "@" + username;

    try {
      db.ref('/tweets').push({
        creado: date,
        replyId: replyId,
        replyText: replyText,
        user: usuario

      });
      db.ref('/indice').update({
        ultimoIndice: newRandomIndex,
      });

      salida = "-> 3 | TweetId: [" + replyId + "] registrado en Firebase con exito" + '\n' +
        "-> 4 | Nuevo numero random [" + newRandomIndex + "] generado con exito" + '\n' 

      resolve(salida);

    } catch (error) {
      reject(error);
    }
  });
  return promesa;

}

function favearTweet(id) {

  const promesa = new Promise((resolve, reject) => {
    T.post('favorites/create', { id: id }, (err, response) => {
      if (err) {
        reject(err);
      }
      else {
        resolve("-> 2 | TweetId: [" + id + "] faveado con éxito");
      }
    })
  })
  return promesa;
}

