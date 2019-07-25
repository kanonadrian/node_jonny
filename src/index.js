const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const http = require('http');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const MSSQLStore = require('connect-mssql')(session);
const socketIO = require('socket.io');


const { database } = require('./keys');

//Inicializacion
const app = express();
require('./lib/passport');
let server = http.createServer(app);

//settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

//Middelwares
app.use(session({
    secret: 'securitysite',
    resave: false,
    saveUninitialized: false,
    store: new MSSQLStore(database)
}));
app.use(flash())
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
//Global variables
app.use((req, res, next) => {
    app.locals.user = req.user;
    // app.locals.succes = req.flash('succes');
    next();
});

//Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));

//public
app.use(express.static(path.join(__dirname, 'public')));

//AQUÍ ESTÁ TODO LO DEL SERVIDOR SOCKET
let io = socketIO(server);
io.on('connection', (client) => {
    console.log('Usuario Conectado');

    client.on('disconnect', (client) => {
        console.log('Usuario desconectado');
    });

    client.on('eventoEjecutarArduino', (informacionArduino) => {
        client.broadcast.emit('enviarNotificacion', informacionArduino);
    });

})

//start
server.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});