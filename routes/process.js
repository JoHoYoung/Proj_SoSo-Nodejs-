var express = require('express');
var router = express.Router();
var fs = require('fs');

var http = require('http');
var path = require('path');
//Express 미들웨어
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var static = require('serve-static');
var errorHandler = require('errorhandler');

var multer = require('multer');

var storage = multer.diskStorage({destination: function(req,file,cb){
    cb(null, '../uploads')
},
                    filename: function(req,file,cb){
                        cb(null,file.fieldname+ '-'+Date.now())
                    }
});

var upload = multer({ storage: storage });
// 오류 핸들러
var expressErrorHandler = require('express-error-handler');

//Session 미들웨어
var expressSession = require('express-session');
var user = require('./user.js');

var popup = require('window-popup').windowPopup;

var nodemailer = require('nodemailer');

router.route('/login').get(function (req, res) {

                    res.render('login',{can:0});
                    res.end();        
});

router.route('/process/facebook/login').get(function(req,res){
    var database = req.app.get('database');
    req.session.user = {   id: req.user.id,
                            nickname:req.user.nickname,
                           name: req.user.username,
                          authorized: true};
                    res.redirect('/');
                    res.end();
    
});

router.route('/process/login').post(function (req, res) {

    var database = req.app.get('database');
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    if (req.session.user) {

    } else {
        if (database) {
            user.authUser(database, paramId, paramPassword, function (err, docs) {
                if (err) {
                    throw err;        }

                if (docs) {
                    var username = docs[0].name;
                    req.session.user = {   id: paramId,
                                           nickname:docs[0].nickname,
                                           name: username,
                                           authorized: true};
                    res.redirect('/');
                    res.end();
                } else {res.render('login', {can: -1});
                       }
            });
        } else {res.end();}
    }
});

router.route('/signup').get(function(req,res){
    
    var database = req.app.get('database');
    
    database.UserModel.find({},function(err,results)
                           {
            res.render('signup',{results:results}); 
        
    });
    
})

router.route('/adduser').post(function (req, res) {

    let email = req.body.email;
    
    var database = req.app.get('database');
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var sex = req.body.sex;
    var birth=req.body.year+'.'+req.body.month+'.'+req.body.day;
    var phone=req.body.phonefirst+req.body.phonemiddle+req.body.phonelast;
    var eamil = req.body.email;
    var tokken=req.body.tokken;
    var nickname=req.body.nickname;
    let transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth : {
            user: 'whghdud17@gmail.com',
            pass: '7169asdf'
        }
    });
    
    let mailOptions = {
        from: 'whghdud17@gmail.com',
        to: email,
        subject: '소소에서 본인 확인인증 메일 보내드립니다',
        html: '<p>아래의 링크를 클릭해주세요 !</p>' +
        "<a href='http://localhost:3000/auth/?id="+ paramId +"&token="+ tokken+"'>여기를 눌러 인증해주세요</a>" 
    };
    
    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        }else {
            console.log('Email sent: ' + info.response);
        }
    });
    if (database) {
        user.addUser(database, paramId, paramPassword, paramName,sex,birth,phone,tokken,nickname,email,function (err, result) {

            if (err) {
                throw err;
            }
            if (result) {
                res.render('login', {
            can: 0,
        });
                res.end();

            } else {
                res.write('<h2>사용자 추가 실패</h2>');
                res.redirect('/signup');
                res.end();
            }
        });
    } else {
        res.writeHead('200', {
            'Content-Type': 'text/html;charset=utf8'
        });
        res.write('<h2>데이터 베이스 연결 실패</h2>');
        res.end();
    }
});

router.route('/facebook/adduser').post(function (req, res) {
    console.log("adduser호출 됨");

    var database = req.app.get('database');
    var paramId = req.body.id || req.query.id;
    var paramNickname = req.body.nickname || req.query.password;
    var paramName = req.body.name || req.query.name;
    
    
    user.facebookaddUser(database, paramId, paramName, paramNickname,function (err, result){
            if (err) {
                throw err;
            }
            if (result) {
                res.render('main', {info:req.session.user.nickname, islogin:1});
                res.end();

            } else {
                res.write('<h2>사용자 추가 실패</h2>');
                res.redirect('/signup');
                res.end();
            }
        });
});

router.route('/profile').get(function (req, res) {
    
    var database = req.app.get('database');
    var paramNickname = req.session.user.nickname;
    database.UserModel.find({"nickname":paramNickname},function(err,results){
        if(err) throw err;
        
        res.render('profile',{results:results,islogin:1});
        res.end(); 
    });
    
});

router.route('/profile/update').get(function (req, res) {

    var database = req.app.get('database');
    var paramNickname = req.session.user.nickname;
    database.UserModel.find({"nickname":paramNickname},function(err,results){
        if(err) throw err;
        
        res.render('profileupdate',{results:results,islogin:1});
        res.end(); 
    });
    
});

router.route('/post/updating/:postroot').get(function (req, res) {

    var database = req.app.get('database');
    var filterd = path.parse(req.params.postroot).base;
    if (database.db) {
        database.PostModel.findOne({"_id":filterd},function(err,results){
        if(results)
        {        res.render('postupdate',{results:results});
                res.end();
        }
        });     
    }  
});

router.route('/areapost/updating/:postroot').get(function (req, res) {

    var database = req.app.get('database');
    var filterd = path.parse(req.params.postroot).base;
    if (database.db) {
        database.PostModel.findOne({"_id":filterd},function(err,results){
        if(results)
        {        res.render('areapostupdate',{results:results});
                res.end();
        }
        });     
    }  

});


router.route('/main').get(function (req, res) {

    if (req.session.user) {
        res.render('main', {
            info:req.session.user.nickname, islogin:1
        });
    } else {
        res.render('main', {islogin:0});
    }
});

router.route('/auth').get(function (req, res) {

    var database = req.app.get('database');
    var paramid=req.query.id;
    var tokken= req.query.token;
    console.log(paramid);
    
     database.UserModel.findOneAndUpdate({
        "id" : paramid, "tokken" : tokken
    }, {
        "auth": 1
    }, function (err, results) {
     
         if(err) throw err;
     }
    ); 
    res.redirect('/main');
    res.end();
    
});

router.route('/logout').get(function (req, res) {

    if (req.session.user) {
        req.session.destroy(function (err) {
            if (err) {throw err;    }
            res.redirect('/')
        });
    } else {res.redirect('/');}

});

router.route('/posts/search/all/:str/:idx').get(function (req, res){

    var database = req.app.get('database');
    var searchstr = path.parse(req.params.str).base;;
    var skip = path.parse(req.params.idx).base;
    var Postnum;
    database.PostModel.find({content:{$regex:searchstr}}).count({}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({content:{$regex:searchstr}}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                if(req.session.user)
                {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,specific: "searchall",islogin:1,info:req.session.user.nickname,Upper:"posts"});}
                else{
                    res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,specific: "searchall",islogin:0,type:"all",Upper:"posts"});
                }
            }
        });
    }
});

router.route('/areaposts/search/:areagroup/:str/:idx').get(function (req, res){

    var database = req.app.get('database');
    var searchstr = path.parse(req.params.str).base;
    var skip = path.parse(req.params.idx).base;
    var areagroup = path.parse(req.params.areagroup).base;
    var Postnum;
    database.PostModel.find({content:{$regex:searchstr},areagroup:areagroup}).count({}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({content:{$regex:searchstr},areagroup:areagroup}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                if(req.session.user)
                {res.render('areaposts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,areagroup: "searchall",islogin:1,info:req.session.user.nickname,specific:"areasearch",Upper:"areaposts"});}
                else{
                    res.render('areaposts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,areagroup: "searchall",islogin:1,specific:"areasearch",Upper:"areaposts"});
                }
            }
        });
    }
});

router.route('/hotposts/search/:str/:idx').get(function (req, res){

    var database = req.app.get('database');
    var searchstr = path.parse(req.params.str).base;
    var skip = path.parse(req.params.idx).base;
    var Postnum;
    database.PostModel.find({content:{$regex:searchstr},star:{$gt:10}}).count({}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({content:{$regex:searchstr},star:{$gt:10}}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results) {
                if(req.session.user)
                {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,specific: "hotpostssearch",islogin:1,info:req.session.user.nickname,Upper:"hotposts"});}
                else {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,searchstr: searchstr,specific: "hotpostssearch",islogin:0,Upper:"hotposts"});
                }
            }
        });
    }
});

router.route('/reportposts/search/:str/:idx').get(function(req,res){
    
    var database = req.app.get('database');
    var searchstr = path.parse(req.params.str).base;
    var skip = path.parse(req.params.idx).base;
    var Postnum;
    database.PostModel.find({areagroup:10,star:{$gt:10}}).sort('star').exec(function(err, results){
        
        database.PostModel.find({content:{$regex:searchstr},areagroup:10}).sort('-created_at').skip((skip-1)).limit(10).exec(function (err,result){
            if(req.session.user)
            {res.render('reportposts',{results:result,hot:results,islogin:1,num: skip,PostNum:Postnum,specific:"reportsearch",searchstr:searchstr,Upper:"reportposts"});
            }else{
                res.render('reportposts',{results:result,hot:results,islogin:0,num: skip,PostNum:Postnum,specific:"reportsearch",searchstr:searchstr,Upper:"reportposts"});
            }
        })
        
    })
    
    
})
//1부터 7까지 지역 구분
router.route('/areaposts/:page/:group').get(function (req, res) {

    var database = req.app.get('database');
    var skip = path.parse(req.params.page).base;
    var areagroup = path.parse(req.params.group).base;
    var Postnum;
    
    database.PostModel.count({"areagroup":areagroup}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({"areagroup":areagroup}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                if(req.session.user)
                {res.render('areaposts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"all",islogin:1,info:req.session.user.nickname,areagroup:areagroup,Upper:"areaposts"});
                res.end();}
                else{
                    res.render('areaposts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"all",islogin:0,areagroup:0,Upper:"areaposts"});
                    res.end();
                }
            }
        });
    }
});
//자유게시판, areagroup은 -1로 설정, whatwedo 게시판 , areagroup 100으로 설정.
router.route('/posts/:num').get(function (req, res) {

    var database = req.app.get('database');
    var skip = path.parse(req.params.num).base;
    var Postnum;
    var areagroup;
    var type;
    database.PostModel.count({"areagroup":-1}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({"areagroup":-1}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                areagroup = results.areagroup;
                if(areagroup!='')
                    type="area";
                else type = '';
                if(req.session.user)
                {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"all",islogin:1,info:req.session.user.nickname,type:type,areagroup:areagroup,Upper:"posts"});
                res.end();}
                else{
                    res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"all",islogin:0,type:type,areagroup:areagroup,Upper:"posts"});
                    res.end();
                }
            }
        });
    }
});

router.route('/resolveposts/:num').get(function (req, res) {

    var database = req.app.get('database');
    var skip = path.parse(req.params.num).base;
    var Postnum;
    var areagroup;
    var type;
    database.PostModel.count({"areagroup":100}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({"areagroup":100}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                areagroup = results.areagroup;
                if(areagroup!='')
                    type="area";
                else type = '';
                if(req.session.user)
                {res.render('resolveposts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"resolveposts",islogin:1,info:req.session.user.nickname,type:type,areagroup:areagroup,Upper:"resolveposts"});
                res.end();}
                else{
                    res.render('resolveposts', {results: results,num: skip,req: req,PostNum: Postnum, specific:"all",islogin:0,type:type,areagroup:areagroup,Upper:"resolveposts"});
                    res.end();
                }
            }
        });
    }
});

router.route('/reportposts/:num').get(function (req, res) {

    var database = req.app.get('database');
    var skip = path.parse(req.params.num).base;
    var Postnum;
    var areagroup;
    var type;
    database.PostModel.count({"areagroup":10}, function (err, count) {
        Postnum = count;
    });
    
        database.PostModel.find({"areagroup":10,star:{$gt:10}}).sort('-created_at').limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results){
                
                database.PostModel.find({"areagroup":10}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, result) {
                if(req.session.user)
                {res.render('reportposts', {hot: results,results:result,num: skip,req: req,PostNum: Postnum, specific:"report",islogin:1,info:req.session.user.nickname,type:type,areagroup:areagroup,Upper:"reportposts"});
                res.end();}
                else{
                    res.render('reportposts', {hot: results,results:result,num: skip,req: req,PostNum: Postnum, specific:"report",islogin:0,type:type,areagroup:areagroup,Upper:"reportposts"});
                    res.end();
                }
            });
    
}});
});



router.route('/post/comment/create/:ObjectId/:Upper').post(function (req, res) {
    var database = req.app.get('database')
    var filterd = path.parse(req.params.ObjectId).base;
    var Upper = path.parse(req.params.Upper).base;
    if(req.session.user)
    {database.PostModel.findOne({
        "_id": filterd
    }, function (err, rawContent) {
        if (err) throw err;
        rawContent.commentcount+=1;
        rawContent.comments.unshift({
            content: req.body.content,
            writer: req.session.user.nickname
        });
        rawContent.save(function (err) {
            if (err) throw err;
        });
    });

    res.redirect(`/post/${filterd}/${Upper}`);
    }else {
        res.render('login', {can:0});
    }
});

router.route('/resolvepost/create').get(function (req, res) {
    
    if(req.session.user)
    {res.render('create',{islogin:1,info:req.session.user.nickname,type:"resolve"});
    }else {
        res.render('login', {can: 0});
    }
});

router.route('/areapost/create').get(function (req, res) {
    
    if(req.session.user)
    {res.render('areacreate',{islogin:1,info:req.session.user.nickname});
    }else {
        res.render('login', {can: 0});
    }
});

router.route('/reportpost/create').get(function (req, res) {
    
    if(req.session.user)
    {res.render('create',{islogin:1,info:req.session.user.nickname,type:"report"});
    }else {
        res.render('login', {can: 0});
    }
});

router.route('/post/create').get(function (req, res) {
    
    if(req.session.user)
    {res.render('create',{islogin:1,info:req.session.user.nickname,type:''});
    }else {
        res.render('login', {can: 0});
    }
});

router.route('/post/comment/destroy/:postroot/:Upper').post(function (req, res) {
    var database = req.app.get('database')
    var postroot = path.parse(req.params.postroot).base;
    var filterd = req.body.commentid;
    var Upper = path.parse(req.params.Upper).base;
    database.PostModel.findOne({
        "_id": postroot
    }, function (err, rawContent) {
        if (err) throw err;
        var idx;
        for (var i = 0; i < rawContent.comments.length ; i++){
            if (rawContent.comments[i]._id == filterd) {
                console.log(i);
                console.log("번 같다");
                idx = i;
                break;
            }
        }
        console.log("아니");
        console.log(idx);
        console.log(filterd);
        rawContent.commentcount-=1;
        rawContent.comments.splice(idx, 1);

        rawContent.save(function (err) {
            if (err) throw err;
        });
    });
    res.redirect(`/post/${postroot}/${Upper}`);
});

router.route('/post/comment/update/:postroot/:Upper').post(function (req, res) {
    var database = req.app.get('database')
    var postroot = path.parse(req.params.postroot).base;
    var paramcontent=req.body.paramcontent;
    var filterd = req.body.commentid;
    var Upper = path.parse(req.params.Upper).base;
    database.PostModel.findOne({
        "_id": postroot
    }, function (err, rawContent) {
        if (err) throw err;
        var idx;
        for (var i = 0; i < rawContent.comments.length ; i++){
            if (rawContent.comments[i]._id == filterd) {
                console.log(i);
                console.log("번 같다");
                idx = i;
                break;
            }
        }
        console.log("아니");
        console.log(idx);
        console.log(filterd);
        rawContent.comments[idx].content=paramcontent;

        rawContent.save(function (err) {
            if (err) throw err;
        });
    });
    res.redirect(`/post/${postroot}/${Upper}`);
});

router.route('/post/:ObjectId/:Upper').get(function (req, res) {

    var database = req.app.get('database');
    var filterd = path.parse(req.params.ObjectId).base;
    var Upper = path.parse(req.params.Upper).base;
    
    var areagroup;
    var type;
                
    database.PostModel.findOne({
        "_id": filterd
    }, function (err, results) {

        if (err) throw err;

        if (results) {
            areagroup = results.areagroup;
                if(areagroup!='')
                    type="area";
                else type = '';
            
            results.views += 1;
            results.save(function (err) {
                if (err) throw err;
            });
            var type;
            if(results.area=='')
                type="notarea";
            else type="area";
            
            if(req.session.user)
            {
                res.render('post', { results: results,req: req,islogin : 1,info:req.session.user.nickname, type:type, areagroup:results.areagroup,Upper:Upper});
            res.end();}
            else{
            res.render('post', { results: results,req: req,islogin : 0,type:type, areagroup:results.areagroup,Upper:Upper});
                res.end();
            }
        }
    });
});

router.route('/post/destroy').post(function (req, res) {

    var database = req.app.get('database');
    var filterd = req.body.postid;;

    if (database.db) {
        database.PostModel.findOne({"_id":filterd},function(err,results){
            if(results.images)
            {var images = results.images;
            for(var i=0;i<images.length;i++)
          {     fs.unlink(`./uploads/${images[i].images}`,function(err){
                         if(err){throw err;};         
        });
          }
            }
        });
        database.PostModel.remove({
            "_id": filterd
        }, function (err, results) {

            res.redirect('/posts/1');
        });
    }
});

router.route('/areapost/update').post(function(req, res) {

    var database = req.app.get('database');
    var filterd = req.body.postid;

    database.PostModel.findOne({
        "_id": filterd
    }, function (err, results) {

        if (results) {  res.render('areapostupdate', {results: results,req: req});
        }
    });
});

router.route('/post/update').post(function(req, res) {

    var database = req.app.get('database');
    var filterd = req.body.postid;

    database.PostModel.findOne({
        "_id": filterd
    }, function (err, results) {

        if (results) {  res.render('postupdate', {results: results,req: req});
        }
    });
});

router.route('/post/recommend/:Upper').post(function (req, res) {

    var database = req.app.get('database');
    var filterd = req.body.postid;
    var Upper=path.parse(req.params.Upper).base;

    if(req.session.user)
    {database.PostModel.findOne({
        "_id": filterd
    }, function (err, results) {
        var can = 0;
        if (results) {
            for (var i = 0; i < results.recommender.length; i++) {
                if (results.recommender[i].recommender == req.session.user.nickname) {
                    results.star -= 1;
                    results.recommender.splice(i, 1);
                    can = -1;
                    break;
                }
            }
            if (can == 0) {
                results.star++;
                results.recommender.push({recommender: req.session.user.nickname});
            }
            results.save(function (err) {
                if (err) throw err;
            });
            res.redirect(`/post/${filterd}/${Upper}`);
        }
    });
    }else{
        res.render('login', {can:0});
    }
});

router.route('/hotposts/:num').get(function (req, res) {

  var database = req.app.get('database');
    var skip = path.parse(req.params.num).base;
    var Postnum;
    database.PostModel.count({star:{$gt:10}}, function (err, count) {
        Postnum = count;
    });
    if (database.db) {
        database.PostModel.find({star:{$gt:10}}).sort('-created_at').skip((skip - 1) * 10).limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results) {
                if(req.session.user)
                {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,specific:"hotposts",islogin:1,info:req.session.user.nickname,Upper:"hotposts"});}
                else {res.render('posts', {results: results,num: skip,req: req,PostNum: Postnum,specific:"hotposts",islogin:0,Upper:"hotposts"});
                }
            }
        });
    }
});

router.route("/nodemailerTest").post(function(req,res){
    let email = req.body.email;
    
    let transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth : {
            user: 'whghdud17@gmail.com',
            pass: 'dkdeo6847!'
        }
    });
    
    let mailOptions = {
        from: 'whghdud17@gmail.com',
        to: email,
        subject: '소소에서 본인 확인인증 메일 보내드립니다',
        text: '테스트입니다'
    };
    
    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        }else {
            console.log('Email sent: ' + info.response);
        }
    });   
    res.redirect("/");
});

router.route('/').get(function(req, res) {

    var hotposts;
    var database=req.app.get('database');
    database.PostModel.find({star:{$gt:10}}).sort('-created_at').limit(10).exec(function (err, results) {
            if (err) {return;}
            if (results) {
                hotposts=results;
                
                database.PostModel.find({areagroup:100}).sort('-created_at').limit(5).exec(function (err, result)
                {
                if(req.session.user)
                {res.render('main', {hotposts: hotposts,resolve:result,islogin: 1,info:req.session.user.nickname});}
                else {res.render('main', {hotposts: hotposts,resolve:result,islogin: 0});
                }
            });
            }
        }); 
});

module.exports = router;