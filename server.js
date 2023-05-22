const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const users_collection1 = require('./src/userdatabase/userdata');
require('./src/userdatabase/conn');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const auth = require('./src/middleware/auth');
const app = express();
const http = require('http').createServer(app);
const port = process.env.PORT || 8000;
const amqp = require('amqplib/callback_api');


app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "/")));
app.use(express.static(path.join(__dirname, "/public")));


app.get('/', (req, res) => {
    // res.send('Homepage');
    res.sendFile(path.join(__dirname, "./register.html"))
});

app.get('/homepage', auth, (req, res) => {
    // res.sendFile(path.join(__dirname, "/index.html"));
    res.sendFile(path.join(__dirname, "./homepage.html"));
});

app.get('/logout', auth, (req, res) => {
    try {
        res.clearCookie('jwt');
        console.log('Logout Sucessfully');
        // await.req.user.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "./register.html"))
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "./login.html"))
});

app.post('/', async (req, res) => {
    // console.log(req.body);
    let req_userdata = new users_collection1(req.body);

    let useremail = await users_collection1.findOne({ email: req_userdata.email });
    if (useremail === null && (req_userdata.password === req_userdata.confirm_password)) {
        const token = await req_userdata.generateAuthToken();
        // console.log(`The token part : ${token}`);

        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 300000),
            httpOnly: true
        });


        const registered = await req_userdata.save();
        // console.log(registered);
        // res.sendFile(path.join(__dirname,"../login.html"));
        res.redirect('/login')
    } else {
        res.send('Email or password is incorrect!');
    }
});


app.post('/register', async (req, res) => {
    // console.log(req.body);
    let req_userdata = new users_collection1(req.body);

    let useremail = await users_collection1.findOne({ email: req_userdata.email });
    if (useremail === null && (req_userdata.password === req_userdata.confirm_password)) {
        const token = await req_userdata.generateAuthToken();
        // console.log(`The token part : ${token}`);

        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 300000),
            httpOnly: true
        });


        const registered = await req_userdata.save();
        // console.log(registered);
        // res.sendFile(path.join(__dirname,"../login.html"));
        res.redirect('/login')
    } else {
        res.send('Email or password is incorrect!');
    }
});

app.post("/login", async (req, res) => {
    // let userdata = new users_collection1(req.body);
    let useremail = await users_collection1.findOne({ email: req.body.email });

    if (useremail != null) {
        const compare_password = await bcrypt.compare(req.body.password, useremail.password);

        if (compare_password === true) {
            const token = await useremail.generateAuthToken();
            res.cookie('jwt', token, {
                expires: new Date(Date.now() + 300000),
                httpOnly: true
            });
            console.log('Successfully Logged In');
            res.redirect('/homepage');
        } else {
            res.send('Incorrect Password');
        }
    } else {
        res.send('Email does not exist');
    }

})
// -----------------------------------------------------------------------
// Socket working

const io = require('socket.io')(http);
io.on('connection', (socket) => {
    console.log('Connected....');
    // ------- RabbitMq -------- Producer --------------------------------
    amqp.connect('amqp://localhost', (connError, connection) => {
        if (connError) {
            throw connError;
        }
        connection.createChannel((channelError, channel) => {
            if (channelError) {
                throw channelError;
            }
            const QUEUE = 'chat'
            channel.assertQueue(QUEUE);
            socket.on('message', (msg) =>{
                channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(msg)));
                socket.broadcast.emit('message',msg);
            })
        })
    })

    // ------- RabbitMq -------- Consumer --------------------------------------------
    amqp.connect('amqp://localhost', (connError, connection) => {
        if (connError) {
            throw connError;
        }
        connection.createChannel((channelError, channel) => {
            if (channelError) {
                throw channelError;
            }
            const QUEUE = 'chat'
            channel.assertQueue(QUEUE);
            channel.consume(QUEUE, (msg) => {
                const data = JSON.parse(msg.content.toString());
                console.log(data);
            }, { noAck: true })
        })
    })
});















// ---------------------------------------------------------------------------
http.listen(port, () => console.log(`Server is Running on PORT: ${port}`));