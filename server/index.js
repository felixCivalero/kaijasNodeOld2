const express = require("express");
const app = express();
const mysql = require("mysql2");
// Allowing to send from front-end to my own API
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "../.env" });
// making request from frontend to backend
app.use(cors());
//Parsing the json when we send from frontend to backend
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DB,
});

const transporter = nodemailer.createTransport({
  host: process.env.NM_HOST,
  port: process.env.NM_PORT,
  auth: {
    user: process.env.NM_USER,
    pass: process.env.NM_PASS,
  },
});

/*-----------------LOGIN USER INFO-----------*/

app.get("/getLoginInfo", (req, res) => {
  db.query(
    "select email, band_PIN FROM artists WHERE band_id = 1",
    (err, result) => {
      if (err) {
        console.log("Error getting login-info" + err);
      } else {
        res.send(result);
      }
    }
  );
});

/*-----------------UPLOAD CONCERT TO SERVER-----------*/
app.post("/uploadArtist", (req, res) => {
  const { name, genre, price, date, time, desc } = req.body;
  const options = {
    from: "do-not-reply@kaijasalong.com",
    to: "artist@kaijasalong.com",
    subject: `Koncert uppladdad! `,
    html: `<h1>${name} har precis lagt upp en koncert!</h1>
    <h3>Så här ser det ut:</h3>
    <ul>
      <li>${name}</li>
      <li><strong>${genre}</strong></li>
      <li><strong>${date} ${time}</strong></li>
      <li><strong>${price}</strong></li>
    </ul>
    <p>${desc}</p>
<p>---------------------------</p>
    <p>För att redigera: Logga in på kaijasalong.com/phpmyadmin</p>
    <p>Vsg brysh,<br>Felix</p>
    `,
  };

  db.query(
    "INSERT INTO concerts (artists_name, artists_genre, artists_price, artists_date, artists_time, artists_desc, max_guests) VALUES (?,?,?,?,?,?,?)",
    [name, genre, price, date, time, desc, 25],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");
        transporter.sendMail(options, function (err, info) {
          if (err) throw err;
        });
      }
    }
  );
});

/*-----------------GET CONCERT-----------*/

app.get("/getConcert", (req, res) => {
  let currDate = new Date();
  let date =
    currDate.getFullYear() +
    "-" +
    ("0" + (currDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + currDate.getDate()).slice(-2);
  db.query(
    `select * from concerts where artists_date >= '${date}' ORDER BY artists_date`,
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send(result);
      }
    }
  );
});

/*-----------------UPLOAD BAND REGUEST TO SERVER AND EMAIL artist@kaijasalong.com-----------*/

app.post("/uploadBand", (req, res) => {
  const {
    bandName,
    bandContact,
    bandMail,
    bandTel,
    bandGenre,
    bandLink,
    bandSocial,
    bandDesc,
  } = req.body;
  const bandPIN = Math.floor(1000 + Math.random() * 9000);

  const options = {
    from: "do-not-reply@kaijasalong.com",
    to: "artist@kaijasalong.com",
    subject: `Ny förfrågan: ${bandName}`,
    html: `<h1>${bandName} vill uppträda på Kaijas!</h1>
    <h3>Info om bandet</h3>
    <ul>
      <li>Kontaktperson: <strong>${bandName}</strong></li>
      <li>Mail: <strong>${bandMail}</strong></li>
      <li>PIN-kod: <strong>${bandPIN}</strong></li>
      <li>Tel: <strong>${bandTel}</strong></li>
      <li>Genre: <strong>${bandGenre}</strong></li>
      <li>Länk: ${bandLink}</li>
      <li>Social: ${bandSocial}</li>
    </ul>
    <h4>Beskrivning</h4>
    <p>${bandDesc}</p>

    <p>Vsg brysh,<br>Felix</p>
    `,
  };
  const options2 = {
    from: "do-not-reply@kaijasalong.com",
    to: bandMail,
    subject: "Tack för din förfrågan!",
    html: `<h3>Vad kul att ni vill spela hos oss på Sveriges minsta live-scen</h3>
   <p>Vi kommer höra av oss till dig/er för att hitta ett datum så fort vi har läst igenom det du/ni har skickat och bestämt oss för om vi tror att er musik skulle passa här hos oss. Under tiden kommer här lite allmän info om hur det går till hos oss om vi väljer att boka in dig/er för spelning, läs igenom i lugn och ro! 😊</p>
   <p><strong>Allmän info, tider & logistik</strong></p>
   <ul>
   <li>Alla spelningar börjar kl. 18:30</li>
   <li>Än så länge tillhandahåller vi endast piano, resterande material måste därför tas med på egen hand.</li>
   <li>Mellan kl.13:00-16:00 samma dag som spelningen kan du/ni komma för sound check och lämna era saker.</li>
   <li>Av erfarenhet fungerar 2 set x ca 45 min eller 3 set x ca 30 min bäst (pauser omkring 10 min).</li>
   <li>Servering till gästerna fortsätter under spelningens gång, vi försöker undvika matlagning men det är inget vi kan garantera.</li>
   </ul>
   <p><strong>Allmän info, ersättning & marknadsföring</strong></p>
   <p>P.g.a vår storlek har vi en så kallad “på-dörren-policy”, vi säljer alltså biljetter till alla våra spelningar och din/er ersättning beror på hur många platser som bokas (dock lägst 1000kr). - Därför är det extra viktigt även för din/er skull att vara noga med att marknadsföra i god tid och många gånger på sociala medier och bland vänner/familj. 

   Vi ser helst att du/ni börjar ca 3 veckor innan spelningens datum och att det läggs ut minimum 3 inlägg under tiden. Vi gör snygga bilder som ni kan använda på sociala medier samt ett Facebook-evenemang via vår sida “Kaijas Musiksalong” där vi bjuder in er att vara co-host, på så sätt kan ni bjuda in era kontakter och dela evenemanget på er egen sida eller privata profil.</p>
   <p>Vidare...</p>
   <ul>
   <li>Vi kommer tillsammans fram till ett biljettpris som rör sig mellan 150-350kr.</li>
   <li>Vi tar betalt för biljetterna genom att lägga på biljettpriset på gästernas nota, du/ni får 80% och vi 20% (exkl. moms) av den totala summan, vilken betalas ut på faktura (om inget annat överenskommes).</li>
   <li>Gästerna måste för-boka sina platser via vår hemsida www.kaijasalong.com under fliken “på scen” där kommande spelningar visas, alternativt kan de ringa telefonnummer 073-423 35 04. Detta bör anvisas tydligt när ni lägger ut om spelningen.</li>
   <li>Vi tar in maximalt 27 personer i lokalen. </li>
   <li>Vi bjuder på läsk/vatten och snacks till dig/er som spelar.</li>
   <li>Vi bjuder på en maträtt och en dryck per bandmedlem, dock endast om ersättningen betalas ut via faktura, om swish-skylt önskas användas får vi ingen andel och kan därför inte bjuda på förtäring.</li>
   </ul>


    <p>Tack igen för ditt intresse! Vi är så glada att du har hittat oss!<br>/ Saga & Felix på Kaijas Musiksalong 🎉</p>
    `,
  };

  db.query(
    "INSERT INTO artists (band_name, contact_name, email, phone, genre, artists_link, band_social, band_desc, band_PIN) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      bandName,
      bandContact,
      bandMail,
      bandTel,
      bandGenre,
      bandLink,
      bandSocial,
      bandDesc,
      bandPIN,
    ],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");

        transporter.sendMail(options, function (err, info) {
          if (err) {
            throw err;
          }
        });
        transporter.sendMail(options2, function (err, info) {
          if (err) {
            throw err;
          }
        });
      }
    }
  );
});

/*-----------------UPLOAD vänner TO SERVER and EMAIL confimration-----------*/

app.post("/uploadCostumer", (req, res) => {
  const { costumerName, costumerMail, costumerPhone, costumerInterest } =
    req.body;

  const options = {
    from: "do-not-reply@kaijasalong.com",
    to: costumerMail,
    subject: `Kaijas <3 ${costumerName.split(" ")[0]}`,
    html: `<h1>Du har registrerats som en av Kaijas vänner</h1>
    <h3>Nu är du först med att få nys om våra nyheter</h3>
   
    <p>Som Sveriges minsta live-scen blir våra intima konserter snabbt utsålda. Som Kaijas-vän får du information om våra spelningar och events före de publiceras offentligt. Du får också ta del av specialerbjudanden och bättre priser!</p>

    <p>Vi hörs snart igen!<br>Felix och Saga på Kaijas</p>
    `,
  };

  db.query(
    "INSERT INTO vanner (costumer_name, costumer_email, costumer_phone, costumer_interest) VALUES (?,?,?,?)",
    [costumerName, costumerMail, costumerPhone, costumerInterest],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");

        transporter.sendMail(options, function (err, info) {
          if (err) {
            throw err;
          }
        });
      }
    }
  );
});

/*-------------------BOOKINGS------------*/
app.post("/uploadBooking", (req, res) => {
  const {
    guestsName: bookingName,
    guestsMail: bookingMail,
    guestsTel: bookingTel,
    eat,
    amount: bookingAmount,
    bookingEventId: eventId,
    bookingEventName: eventName,
    bookingEventDate: eventDate,
    bookingEventTime: eventTime,
    totalPrice,
  } = req.body;
  const eatHtml =
    req.body.eat === "Ja"
      ? `Eftersom ni vill äta rekommenderar vi att ni kommer senast 1 timme/45 minuter före kl${eventTime} för att vi ska kunna få ut er beställning i tid till konserten.`
      : "Kom gärna ett par minuter före konsertens start så ni hinner beställa dryck och snacks i lugn och ro.";

  const options = {
    from: "do-not-reply@kaijasalong.com",
    to: bookingMail,
    subject: `Kaijas <> ${eventName}`,
    html: `<h1>Tack för din bokning ${bookingName.split(" ")[0]}!</h1>
    <h3>Välkommen till svergies minsta live-scen!</h3>
    <ul>
      <li>Artist: <strong>${eventName}</strong></li>
      <li>Datum: <strong>${eventDate}</strong></li>
      <li>Tid: <strong>${eventTime}</strong></li>
      <li>Adress: <strong>Storgatan 44, Stockholm</strong></li>
    </ul>
    <p>Totalt biljettpris: ${totalPrice} kr</p>
    <p>${eatHtml}</p>
    <p>Vi ses snart!</p>
    <p>Med vänliga hälsningar,<br>Saga och Felix på Kaijas</p>

    <p>Har du frågor inför besöket? Ring <a href="tel:073-4233504">073-423 35 04</a> eller maila till <a href="mailto:info@kaijasalong.com">info@kaijasalong.com</a> så hjälper vi dig!</p>
    <small>Avbokning ska ske minst 48 timmar innan konsertens datum. Avbkokning senare än 48 timmar, eller eventuell no-show, debiteras med det fulla biljettpriset.</small>
    `,
  };

  db.query(
    "INSERT INTO bookings (booking_name, booking_mail, booking_tel, booking_eat, booking_amount, booking_event_id) VALUES (?,?,?,?,?,?)",
    [bookingName, bookingMail, bookingTel, eat, bookingAmount, eventId],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");

        transporter.sendMail(options, function (err, info) {
          if (err) {
            throw err;
          }
        });
      }
    }
  );
});

app.post("/uploadWaiting", (req, res) => {
  const {
    waitingName,
    waitingMail,
    waitingPhone,
    waitingAmount,
    waitingEat,
    waitingEventName,
    waitingEventDate,
    waitingEventTime,
    waitingEventId,
  } = req.body;

  const options = {
    from: "do-not-reply@kaijasalong.com",
    to: waitingMail,
    subject: `Väntelista <> ${waitingEventName}`,
    html: `<h1>Tack ${
      waitingName.split(" ")[0]
    }, du är uppskriven på väntelistan!</h1>
    <h3>Svergies minsta live-scen!</h3>
    <ul>
      <li>Artist: <strong>${waitingEventName}</strong></li>
      <li>Datum: <strong>${waitingEventDate}</strong></li>
      <li>Tid: <strong>${waitingEventTime}</strong></li>
      <li>Adress: <strong>Storgatan 44, Stockholm</strong></li>
    </ul>
    <p>
    Vid eventuell avbokning går vi igenom väntelistan i turorning!
    </p>
    <p>Vi kanske hörs snart! :)</p>
    <p>Med vänliga hälsningar,<br>Saga och Felix på Kaijas</p>

    <p>Har du frågor? Ring <a href="tel:073-4233504">073-423 35 04</a> eller maila till <a href="mailto:info@kaijasalong.com">info@kaijasalong.com</a> så hjälper vi dig!</p>
    `,
  };

  db.query(
    "INSERT INTO waiting (waiting_name, waiting_mail, waiting_phone, waiting_amount, waiting_eat, waiting_event_id) VALUES (?,?,?,?,?,?)",
    [
      waitingName,
      waitingMail,
      waitingPhone,
      waitingAmount,
      waitingEat,
      waitingEventId,
    ],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");

        transporter.sendMail(options, function (err, info) {
          if (err) {
            throw err;
          }
        });
      }
    }
  );
});

app.post("/updateConcert", (req, res) => {
  const { id, capacity: availability } = req.body;
  db.query(
    `UPDATE concerts SET max_guests = '${availability}' WHERE concerts.artists_id = '${id}';`,
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

app.listen(3001, () => {
  console.log("Your server is running on server 3001");
});
