var express = require('express');
var aws = require('aws-sdk');
var router = express.Router();
var multer = require('multer');
//var cloudinary = require('cloudinary');
var passport = require('passport');
var sha1 = require('sha1');
//var passport = require('passport-local');
//var Strategy = require('passport-facebook').Strategy;
var config = require('../config');
var path = require('path');
var Orders = require('../models/order.js');
var Spec = require('../models/specification.js');
var Contact = require('../models/contact.js');


// TODO agregar seguridad a esta ruta
router.get('/listorders/:limit', function(req, res) {
  Orders.find({'userid':req.user._id},function(err, orders) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (orders) {
      console.log('se encontraron pedidos');
      res.setHeader('Content-Type', 'application/json');
      res.send(orders); 

    } 
    else {
      console.log('No se encontraron pedidos');
    }
   
  }).select('imagecount numorder status date').sort('-date').limit(req.params.limit);
});

// TODO agregar seguridad a esta ruta
router.get('/listorders', function(req, res) {
  Orders.find({'userid':req.user._id},function(err, orders) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (orders) {
      console.log('se encontraron pedidos');
      res.setHeader('Content-Type', 'application/json');
      res.send(orders); 

    } 
    else {
      console.log('No se encontraron pedidos');
    }
   
  }).select('imagecount numorder status date').sort('-date');
});


// TODO agregar seguridad a esta ruta
router.get('/listallorders', function(req, res) {
  Orders.find({},function(err, orders) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (orders) {
      console.log('se encontraron pedidos');
      res.setHeader('Content-Type', 'application/json');
      res.send(orders); 

    } 
    else {
      console.log('No se encontraron pedidos');
    }
   
  }).select('imagecount numorder status date');
});
 
// TODO agregar seguridad a esta ruta
router.get('/listspecs', function(req, res) {
  
  Spec.find({'userid':req.user._id},function(err, specs) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (specs) {
      console.log('se encontraron especificaciones');
      res.setHeader('Content-Type', 'application/json');
      res.send(specs); 
    } 
    else {
      console.log('No se encontraron especificaciones');
    }
  }).select('_id name date totalprice').sort('-date');
});

// TODO agregar seguridad a esta ruta
// TODO usar una sola ruta para consultar especificaciones
router.get('/listspecs/:limit', function(req, res) {
  
  Spec.find({'userid':req.user._id},function(err, specs) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (specs) {
      console.log('se encontraron especificaciones');
      res.setHeader('Content-Type', 'application/json');
      res.send(specs); 
    } 
    else {
      console.log('No se encontraron especificaciones');
    }
  }).select('_id name date totalprice').sort('-date').limit(req.params.limit);
});

/* Crea un nuevo contacto. */
  router.post('/newcontact', function(req, res) {
    console.log(req.body);
    var newContact = new Contact();
    newContact.name = req.body['name'];
    newContact.email = req.body['email'];
    newContact.message = req.body['message'];
    newContact.save(function(err) {
      if (err){
          console.log('No se pudo guardar el pedido: '+err);  
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar el contacto'})); 
      }
      else{
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ error: 0, message: 'Se guardó el contacto'})); 
      }
    });  
  });
 


/* Crea un nuevo pedido. */
  router.post('/neworder', function(req, res) {
    // Display the Login page with any flash message, if any
   // todo: modificar este try catch
   try {
    console.log(req.body['imageUploadInfos']);
    //console.log(req.params);
    var numorderstr="";
    var newOrder = new Orders();
          //newOrder.name = 'orderfotos';
          newOrder.userid = req.user._id;
          newOrder.imagecount = req.body['imagecount'];
          newOrder.specid = req.body.specid;
          newOrder.totalpay = req.body.totalpay;
          // todo: recorrer el req.body para obtener los datos de las imagenes
          



    var imageUploadInfos = JSON.parse(req.body['imageUploadInfos']);
    console.log(imageUploadInfos);

          for (var i=0; i < imageUploadInfos.length; i++){
              //i === 0: arr[0] === undefined;
              //i === 1: arr[1] === 'hola';
              //i === 2: arr[2] === 'chau';
              console.log(imageUploadInfos[i]);
            newOrder.images.push(imageUploadInfos[i]);

          }

           // save the user
          newOrder.save(function(err) {
            if (err){
              //console.log(newOrder);
              //console.log(newOrder.images);
              console.log('No se pudo guardar el pedido: '+err); 
              //res.render('como2', {message: req.flash('message')}); 
              //throw err;  
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar el pedido'})); 


            }
            else
            {

              console.log(' Se guardo el pedido'); 
              console.log(newOrder.numorder);
              // res.render('como2', {message: req.flash('message')});
              numorderstr = String(newOrder.numorder);
              console.log(numorderstr);
              

              //res.write('<h1>'+ numorderstr + '</h1>');
              //res.end();
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ error: 0, message: 'Se guardó el pedido', numorder: newOrder.numorder})); 


            }

        });  
}
catch(err) {
   
   console.log(err.message);
}
          // newOrder.images.push({imagename:"https://s3.amazonaws/imagen.jpg", width:300});
          // newOrder.images.push({imagename:"https://s3.amazonaws/imagen.jpg", width:300});
          // newOrder.images.push({imagename:"https://s3.amazonaws/imagen.jpg", width:300});
          // newOrder.images.push({imagename:"https://s3.amazonaws/imagen.jpg", width:300});

          
          
         
    //res.set('Content-Type', 'application/javascript');

  });
 

 // router.get('/neworder',
 //  function(req, res) {

 //  });



      


//var flash = require('connect-flash'); // middleware para mensajes en passport

//app.use(flash());



/* GET home page. */
//router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
//});

// PASSPORT

// router.get('*',function(req,res){  
//     res.redirect('https://imgnpro.com'+req.url)
// });

  router.get('/',
  function(req, res) {
    res.render('intro', {message: req.flash('message')});
    //res.sendFile('../public/htmls/intro.html' , { root : __dirname});
    //console.log(req.user);
  });


/* GET como page. */
  router.get('/como', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('como', {message: req.flash('message')});
  });

  router.get('/contacto', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('contacto', {message: req.flash('message')});
  });

  router.get('/registro', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('registro', {message: req.flash('message')});
  });
  router.get('/faq', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('faq', {message: req.flash('message')});
  });

  router.get('/como2', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('como2', {message: req.flash('message')});
  });


  router.get('/precios', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('precios', {message: req.flash('message')});
  });

 router.get('/pedidos', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('pedidos', {message: req.flash('message')});
  });


/* GET login page. */
  router.get('/login', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('login', {message: req.flash('message')});
  });
 
  router.get('/logout',
  function(req, res){
     
     //res.redirect('https://www.facebook.com/logout.php?next=localhost:3000/&access_token='+passport.accessToken);
     req.logOut();
     req.session.destroy();
     res.clearCookie('connect.sid');

     setTimeout(function() {
        res.redirect("/");
     }, 1000);
  });


// Passport local 


  /* Maneja la aplicación micuenta */
  // router.get('/micuenta', 
  //    require('connect-ensure-login').ensureLoggedIn('/login'),
  //        function(req, res){

  //         var newOrder = new Orders();
  //         // set the user's local credentials
  //         newOrder.useremail = 'userlongname';
          
          
  //         // save the user
  //         newOrder.save(function(err) {
  //           if (err){
  //             console.log('No se pudo guardar el pedido: '+err);  
  //             throw err;  
  //           }
  //           console.log('Se registró correctamente el pedido ' + newOrder.useremail );    
  //         });
  //          res.render('micuenta', {message: req.flash('message'), user: req.user});
  // });


/* Maneja la página micuenta */
  router.get('/micuenta', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('micuenta', {message: req.flash('message'), user: req.user});
  });


/* Maneja la página especificaciones1 */
  router.get('/especificaciones1', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('especificaciones1', {message: req.flash('message'), user: req.user});
  });

  /* Maneja la página especificaciones2 */
  router.get('/especificaciones2', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('especificaciones2', {message: req.flash('message'), user: req.user, config:config});
  });

  /* Maneja la aplicación principal */
  router.get('/principal', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          console.log(req.user);
           res.render('principal', {message: req.flash('message'), user: req.user});
  });

 

/* Maneja la página historial */
  router.get('/historial', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('historial', {message: req.flash('message'), user: req.user});
  });


/* Maneja la pagina donde se escoge la tecnica para subir imagenes */
  router.get('/subirimagen1', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('subirimagen1', {message: req.flash('message'), user: req.user});
  });


/* Maneja la pagina que tiene el dropzone para subir imágenes */
  router.get('/chooseanimage', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseanimage', {message: req.flash('message'), user: req.user});
  });

/* Maneja la pagina que permite elegir un extra de la especificación */
  router.get('/chooseanextra', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseanextra', {message: req.flash('message'), user: req.user, config:config});
  });


/* Maneja la pagina que tiene el dropzone para subir imágenes */
  router.get('/uploadimages', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('uploadimages', {message: req.flash('message'), user: req.user});
  });

/* Maneja la pagina que tiene el dropzone para subir imágenes 
   Cuando es llamada desde la creación de una especificación
*/
  router.get('/uploadimages/:newSpecid', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
            findaspec(req.params.newSpecid,function(error,spec){
              //console.log(spec);
              res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
            });
  });

/* Maneja la pagina donde se cierra el pedido o la orden de compra */
  router.get('/chooseaspecification', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseaspecification', {message: req.flash('message'), user: req.user});
  });

/* Maneja la pagina donde se cierra el pedido o la orden de compra */
  // router.get('/subirimagen3/:numorder', 
  //    require('connect-ensure-login').ensureLoggedIn('/login'),
  //        function(req, res){
  //          console.log(req.params);
  //          res.render('subirimagen3', {message: req.flash('message'), user: req.user, numorder:req.params.numorder});
  // });

/* Maneja la pagina donde se paga el pedido o la orden de compra */
  router.get('/confirmpayorder/:numorder', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          findaorder(req.params.numorder,function(error,order){
               console.log(order);
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
               res.render('confirmpayorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, order:order[0]});             
          });
  });

 router.get('/payorder/:numorder', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
               res.render('payorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder});             
         
  });
// router.get('/uploadimages/:newSpecid', 
//      require('connect-ensure-login').ensureLoggedIn('/login'),
//          function(req, res){
//             findaspec(req.params.newSpecid,function(error,spec){
//               //console.log(spec);
//               res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
//             });
//   });

  /* Handle Login POST */
  router.post('/signin', passport.authenticate('login', {
    successRedirect: '/principal',
    failureRedirect: '/login',
    failureFlash : true,
    successFlash : true 
  }));
 
   /* Handle Registration POST */
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/signup_success',
    failureRedirect: '/signup_error',
    failureFlash : true, 
    successFlash : true 
  }));

  /* maneja si el registro fue exitoso */
  // router.get('/signup_success', function(req, res) {
  //   var msjres = req.flash('success');
  //   res.setHeader('Content-Type', 'application/json');
  //   res.send(JSON.stringify({ error: 0, message: msjres[0]}));
  // });



 router.get('/signup_success', require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req, res){
        var msjres = req.flash('success');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ error: 0, message: msjres[0]}));
  });




  // Si sucede un error al registrar un usuario se ejecuta esta ruta
  router.get('/signup_error', function(req, res) {
    var msjres = req.flash('error');
    if (msjres[0]!= undefined){
         console.log(msjres[0]);
         res.setHeader('Content-Type', 'application/json');
         res.send(JSON.stringify({ error: 1, message: msjres[0]}));
    }
    else {
         res.redirect('/');
    }
  });


// /newstepspec


/* Handle new step by step specification  POST */
  router.post('/newstepspec', function (req,res) {
    // body...
    //console.log(req.body);

    //console.log(req.user._id);
    
    var specInfos = JSON.parse(req.body['specInfos']);
    console.log(specInfos);
    console.log(specInfos[0].specname);
    console.log(specInfos[0].format);
    console.log(specInfos[0].colormode);


      var newSpec = new Spec();
      // set the user's local credentials

      // recibir el array de datos

      newSpec.name = specInfos[0].specname;
      newSpec.format = specInfos[0].format;
      newSpec.colormode = specInfos[0].colormode;
      newSpec.background = specInfos[0].background;
      newSpec.dpi = specInfos[0].DPI;
      newSpec.nonedpi = specInfos[0].nonedpi;
      newSpec.userid = req.user._id;  
      newSpec.alignnone = specInfos[0].alignnone;
      newSpec.alignhor = specInfos[0].alignhor;
      newSpec.alignver = specInfos[0].alignver;
      newSpec.imagesize = specInfos[0].imagesize;
      newSpec.measuresize = specInfos[0].measuresize;
      newSpec.marginmeasure = specInfos[0].marginmeasure;
      newSpec.margintop = specInfos[0].margintop; //??
      newSpec.marginbottom = specInfos[0].marginbottom; //??
      newSpec.marginright = specInfos[0].marginright; //??
      newSpec.marginleft = specInfos[0].marginleft; //??
      newSpec.naturalshadow = specInfos[0].naturalshadow;
      newSpec.dropshadow = specInfos[0].dropshadow;
      newSpec.correctcolor = specInfos[0].correctcolor;
      newSpec.clippingpath = specInfos[0].clippingpath;
      newSpec.basicretouch = specInfos[0].basicretouch;
      console.log(newSpec.basicretouch);
      // pasar el req specInfo
      spectotalprice(specInfos[0],function(total){
          console.log(total);
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 0, ntotal:total , message: 'Se guardó la especificación'})); 
          newSpec.totalprice = total;
          // save the user
          newSpec.save(function(err) {
            if (err){
              console.log('No se pudo guardar la especificación: ' + err); 
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar la especificación'})); 
              throw err;  
            }
            console.log('Se guardó correctamente la especificación');
            console.log(newSpec._id);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: 0, newSpecid: newSpec._id, message: 'Se guardó correctamente la especificación'})); 
          });
    });
  });



 /* Handle new specification POST */
  router.post('/newspec', function (req,res) {
    // body...
    console.log(req.body);

    console.log(req.user._id);
    
      var newSpec = new Spec();
      // set the user's local credentials
      newSpec.name = req.body.name;
      newSpec.format = req.body.format;
      newSpec.colormode = req.body.colormode;
      newSpec.background = req.body.background;
      newSpec.dpi = req.body.DPI;
      newSpec.nonedpi = req.body.nonedpi;
      newSpec.userid = req.user._id;  
      newSpec.alignnone = req.body.alignnone;
      newSpec.alignhor = req.body.alignhor;
      newSpec.alignver = req.body.alignver;
      newSpec.imagesize = req.body.imagesize;
      newSpec.marginmeasure = req.body.marginmeasure;
      newSpec.measuresize = req.body.measuresize;
      newSpec.margintop = req.body.margintop;
      newSpec.marginbottom = req.body.marginbottom;
      newSpec.marginright = req.body.marginright;
      newSpec.marginleft = req.body.marginleft;
      newSpec.naturalshadow = req.body.naturalshadow;
      newSpec.dropshadow = req.body.dropshadow;
      newSpec.correctcolor = req.body.correctcolor;
      newSpec.clippingpath = req.body.clippingpath;
      newSpec.basicretouch = req.body.basicretouch;

        
      spectotalprice(req.body,function(total){
          console.log(total);
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 0, ntotal:total , message: 'Se guardó la especificación'})); 
          newSpec.totalprice = total;





          // save the user
          newSpec.save(function(err) {
            if (err){
              console.log('No se pudo guardar la especificación: ' + err); 
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar la especificación'})); 
              throw err;  
            }
            console.log('Se guardó correctamente la especificación');
            console.log(newSpec._id);

            //El pedido se va a crear después de crear una especificación 
            // Orders.findOneAndUpdate({numorder: req.param('numorder')}, {$set: { specid: newSpec._id } },{upsert:true, new: true}, function(error, Order)   {
            //     if(error){
            //       //throw err;
            //       console.log(error);
            //     }
            //     else {
            //       console.log("Se actualizó el pedido");
            //     } 
                
            // }); 


// orderSchema.pre('save', function(next) {
//     var doc = this;
//     counter.findByIdAndUpdate({_id: 'entityId'}, {$inc: { seq: 1} },{upsert:true, new: true}, function(error, counter)   {
//         if(error)
//             return next(error);
//         doc.numorder = counter.seq;
//         next();
//     }); 
// });
//             findOneAndUpdate(
//     {_id: req.query.id},
//     {$push: {items: item}},
//     {safe: true, upsert: true},
//     function(err, model) {
//         console.log(err);
//     }    
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: 0, newSpecid: newSpec._id, message: 'Se guardó correctamente la especificación'})); 
              
          });






    });



  });


/* Handle get payment sign POST */
  router.post('/getpaymentsign', function (req,res) {
   
    var secretkey = 'trgy4y55664dgf'; 
    var paymentsign = '';
    var Ds_Merchant_Amount = req.param('Ds_Merchant_Amount');
    var Ds_Merchant_Order = req.param('Ds_Merchant_Order');
    var Ds_Merchant_MerchantCode = req.param('Ds_Merchant_MerchantCode');
    var Ds_Merchant_Currency = req.param('Ds_Merchant_Currency');
    var Ds_Merchant_TransactionType  = req.param('Ds_Merchant_TransactionType');
    paymentsign = sha1(Ds_Merchant_Amount + Ds_Merchant_Order + Ds_Merchant_MerchantCode + Ds_Merchant_Currency + Ds_Merchant_TransactionType + secretkey);
    console.log(paymentsign);

 //SHA-1()
           
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 0, sign: paymentsign})); 
              
  });
  /* Handle Registration POST */
  // router.post('/signuplocal', passport.authenticate('signup', {
  //   successRedirect: '/reslocal',
  //   failureRedirect: '/signuplocal',
  //   failureFlash : true,
  //   successFlash : true 
  // }));

// Passport local

// Define routes.
// router.get('/',
//   function(req, res) {
//     res.render('index', { user: req.user });
//     //console.log(req.user);
//   });

//res.sendFile(__dirname + '/indexAgent.html');

router.get('/uploadfile',
  function(req, res) {
    res.render('uploadfile', { user: req.user });
  });

// router.get('/paypal',
//   function(req, res) {
//     res.render('paypal', { user: req.user });
//   });


// router.get('/login',
//   function(req, res){
//     res.render('login');
//   });

 // /* GET Registration Page */
  // router.get('/signup', function(req, res){
  //   console.log("get signup");
  //   res.render('registerlocal',{ message: req.flash('message')});
  // });
 

router.get('/login/facebook',
  passport.authenticate('facebook'));


// router.get('/login/facebook/return', 
//   passport.authenticate('facebook', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/principal');
//     console.log (req);
//   });


 // router.get('/signin', passport.authenticate('login', {
 //    successRedirect: '/principal',
 //    failureRedirect: '/login',
 //    failureFlash : true,
 //    successFlash : true 
 //  }));
 

router.get('/login/facebook/return', 
  passport.authenticate('facebook', { 
    successRedirect: '/principal',
    failureRedirect: '/login',
    failureFlash : true,
    successFlash : true 
  }));

 
  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  router.get('/login/google', passport.authenticate('google', 
    { scope : ['profile', 'email'] }
    )
  );

  // the callback after google has authenticated the user
  router.get('/login/google/return',
          passport.authenticate('google', {
            successRedirect : '/principal',
            failureRedirect : '/login'
  }));



router.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

//var upload = multer({ dest: 'uploads/' });



const S3_BUCKET = process.env.S3_BUCKET_NAME;



/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 */
router.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query['filename'];
  const fileType = req.query['filetype'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 10000,
    ContentType: fileType,
    ACL: 'public-read'
  };
  console.log(fileName);
  console.log(fileType);
   console.log(s3Params);
  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log("error");
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});




/*
 * Respond to POST requests to /submit_form.
 * This function needs to be completed to handle the information in
 * a way that suits your application.
 */
router.post('/save-details', (req, res) => {
  // TODO: Read POSTed form data and do something useful
});




// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}));

// app.set("view engine", "jade");
// app.use(express.static("public"));


// cloudinary.config({ 
//   cloud_name: config.cloudinary.cloud_name, 
//   api_key: config.cloudinary.api_key, 
//   api_secret: config.cloudinary.api_secret 
// });

// var storage =   multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, 'public/uploads/');
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.originalname + '-' + Date.now());
//   }
// });
 

//  var type = multer({ storage : storage}).single('photoimage');


// router.post('/upload', type, function (req,res) {

//   /** When using the "single"
//       data come in "req.file" regardless of the attribute "name". **/
//   var tmp_path = req.file.path;
//   console.log(tmp_path);
//   cloudinary.uploader.upload(req.file.path, function(result) { 
//      console.log(result) 
//      //res.render("index");
//      res.render('photo', {file : result});
//      //res.send(result);
//   });

// });

    // cutandremove:1.50,
    // naturalshadow:0.55,
    // dropshadow:0.20,
    // correctcolor:0.40,
    // clippingpath:2.40,
    // basicretouch:0.60

function spectotalprice(req, cb){
  
  // se agrega a nTotal el costo mínimo 

  //console.log(req.param('background'));
  console.log(req); 
  //console.log(parseFloat(req.body.naturalshadow));
  // se multiplica por 100 para quitar los decimales y evitar errores de precision
  var nTotal = (config.prices.cutandremove) * 100;
  if (parseFloat(req.naturalshadow ) > 0){
    nTotal = nTotal + (config.prices.naturalshadow * 100);
  }
  if (parseFloat(req.dropshadow) > 0){
    nTotal = nTotal + (config.prices.dropshadow * 100);
  }
  if (parseFloat(req.correctcolor) > 0){
    nTotal = nTotal + (config.prices.correctcolor * 100);
  }
  if (parseFloat(req.clippingpath)> 0){
    nTotal = nTotal + (config.prices.clippingpath * 100);
  }
  if (parseFloat(req.basicretouch) >0){
    nTotal = nTotal + (config.prices.basicretouch * 100);
  }
  nTotal = nTotal / 100;
  cb(nTotal);
}


function findaspec(specid, cb){
  Spec.find({'_id':specid},function(err, specrecord) {
    // In case of any error return
     if (err){
       console.log('Error al consultar la especificación');

      cb(1);
     }
   // already exists
    if (specrecord) {
      console.log('se encontró  la especificación');
      cb( 0, specrecord);
    } 
    else {
      console.log('No se encontró la especificación');
        cb(2);
    }
   
  }).select('name totalprice date').limit(1);
}


function findaorder(orderid, cb){
  console.log(orderid);
  Orders.find({'numorder':orderid},function(err, orderrecord) {
    // In case of any error return
     if (err){
       console.log('Error al consultar el pedido');

      cb(1);
     }
     //console.log("prueba 2");
   // already exists
    if (orderrecord) {
      console.log('Se encontró  el pedido');
      console.log(orderrecord);
      //res.setHeader('Content-Type', 'application/json');
      //res.send(orders); 

      cb( 0, orderrecord);

    } 
    else {
      console.log('No se encontró el pedido');

        cb(2);
    }
  }).select('date status totalpay').limit(1);
}

module.exports = router;
