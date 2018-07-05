//Express 기본 모듈
var express = require('express');
var http = require('http');
var path = require('path');

//Express 미들웨어
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var static = require('serve-static');
var errorHandler = require('errorhandler');

// 오류 핸들러
var expressErrorHandler = require('express-error-handler');

//Session 미들웨어
var expressSession = require('express-session');

var app=express();

var router = require('./routes/process.js')

//DB
var mongoose = require('mongoose');

//기본 속성
app.set('port',process.env.PORT||3000);

app.use(bodyParser.urlencoded({ extended: false}));

app.use(bodyParser.json());

app.use('/public',static(path.join(__dirname,'public')));

app.use(cookieParser());

app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

app.use('/',router);

app.set('view engine', 'ejs');
app.set('views', './views')
//-----------------------------------------------------//

//--------------DB연결---------------------//
var MongoClient=require('mongodb').MongoClient;

var database;
var UserSchema;
var UserModel;

function connectDB()
{
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    console.log('데이터 베이스 연결을 시도합니다.');
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('error',console.error.bind(console, 'mongoose connection error'));
    database.on('open',function(){
        
        console.log('데이터 베이스에 연결되었습니다.');
        
        createUserSchema(database);
        createPostSchema(database);  
      
     });
    
    database.on('disconnected',function(){
        
        console.log('연결 끊어짐');
        setInterval(connectDB,5000);
    });
    
    app.set('database',database);

}

function createUserSchema(database){
    
    database.UserSchema = require('./database/user_schema').createSchema(mongoose);
    
    database.UserModel = mongoose.model("users",database.UserSchema);
}

function createPostSchema(database)
{
    database.PostSchema = require('./database/post_schema').createSchema(mongoose);
    
    database.PostModel = mongoose.model("post",database.PostSchema);
    
}
         
http.createServer(app).listen(app.get('port'),function(){
    console.log('서버 시작');
    connectDB();
});