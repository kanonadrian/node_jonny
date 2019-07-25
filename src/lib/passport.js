const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const helpers = require('./helpers');
const pool = require('../database');
const sql = require('mssql');
const mailer = require('nodemailer');
const requestSql = new sql.Request(pool);

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done)=>{
    // console.log("post", req.body);
    // console.log("email=>", email);
    await requestSql.query("SELECT usuario_id as id, password as password, email as email, usuario as usuario FROM Usuario WHERE email in('"+ email +"')")
    .then(async function(dataUser){
        // console.log("response=>", dataUser);
        if(dataUser.recordset.length > 0){
            const responseUser = dataUser.recordset[0];
            const validPass = await helpers.matchPassword(password, responseUser.password);
            // console.log("validPass=>", validPass);
            // console.log("USER=>", responseUser);
            if(validPass){
                return done(null, responseUser);
            }else{
                return done(null, false);
            }
        }else{
            return done(null, false);
        }
    }).catch(function(error){
        return done(null, null);
    });
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const { user } = req.body;
    const newUser ={
        user,
        password,
        email
    };
    newUser.password = await helpers.encryptPassword(password);
    let fecha = getDateSql(new Date());
    await requestSql.
    query("INSERT INTO Usuario (usuario, email, password, perfil, fecha) VALUES('"+ newUser.user +"','"+ newUser.email +"','"+ newUser.password +"',1, '"+ fecha + " ')").
    then(function(dataRows){
        if(dataRows.rowsAffected.length > 0){
            if(dataRows.rowsAffected[0] == 1){
                requestSql.query("SELECT MAX(usuario_id) as id FROM Usuario").then(function(lastInsert){
                    // async function mail(){
                    //     let testAccount = await nodemailer.createTestAccount();
                    //     let transporter = nodemailer.createTransport({
                    //         host: "smtp.ethereal.email",
                    //         port: 587,
                    //         secure: false, // true for 465, false for other ports
                    //         auth: {
                    //           user: testAccount.user, // generated ethereal user
                    //           pass: testAccount.pass // generated ethereal password
                    //         }
                    //       });
                    //       let info = await transporter.sendMail({
                    //         from: '"Fred Foo 👻" <foo@example.com>', // sender address
                    //         to: "bar@example.com, baz@example.com", // list of receivers
                    //         subject: "Hello ✔", // Subject line
                    //         text: "Hello world?", // plain text body
                    //         html: "<b>Hello world?</b>" // html body
                    //       });
                    //       console.log("Message sent: %s", info.messageId);
                    //       console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                    // }
                    // mail().catch(console.error);

                    newUser.id = lastInsert.recordset[0].id;
                    return done(null, newUser);
                }).catch(function(error){
                    console.log(error);
                    return done(null, null);
                });
            }
        }
    }).catch(function(error){
        console.log(error);
        return done(null, null);
    });
}));

function getDateSql(date){
    let myDate = new Date(date);
    let year = myDate.getFullYear();
    let month = myDate.getMonth()+1;
    let day = myDate.getDate();
    let hora = myDate.getHours();
    let min = myDate.getMinutes();
    let sec = myDate.getSeconds();

    if(month < 10){ month = "0" + month; } 
    if (day < 10) { "0" + day; }
    if(hora < 10) { "0" + hora; }
    if(min < 10) { "0" + min; }
    if(sec < 10) { "0" + sec; }

    let result = year + "-" + month + "-" + day  + " " + hora  + ":" + min + ":" + sec  ;

    return result;
};

passport.serializeUser((user, done)=>{
    done(null, user.id);
});

passport.deserializeUser(async (id, done)=>{
    await requestSql.query("SELECT usuario_id as id, password as password, email as email, usuario as usuario FROM Usuario WHERE usuario_id = '"+ id +"'").then(function(data){
        done(null, data.recordset[0]);
    });
});