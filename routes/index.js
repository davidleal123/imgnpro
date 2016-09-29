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
var OrderPacks = require('../models/orderpacks.js');
var User = require('../models/user.js');
var User_details = require('../models/user_details.js');
var Spec = require('../models/specification.js');
var Contact = require('../models/contact.js');
var ordersinproc  = 0;

aws.config.region = 'us-east-1';
var S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'imgnpro';
var S3_BUCKET_NAME_THUMB = process.env.S3_BUCKET_NAME_THUMB|| 'imgnprothumb';

// console.log(process.env.AWS_ACCESS_KEY_ID);
// console.log(process.env.AWS_SECRET_ACCESS_KEY);
//console.log(fillzero(23456, '0000000'));
// TODO agregar seguridad a esta ruta
router.get('/listorders/:limit', function(req, res) {
  Orders.find({'userid':req.user._id},function(err, orders) {
    // In case of any error return
     if (err){
       console.log('Error al consultar: ' + err);
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
   
  }).select('imagecount numorder status date').sort('-date').limit(parseInt(req.params.limit));
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
      //console.log('se encontraron pedidos');
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
      //console.log('se encontraron pedidos');
      res.setHeader('Content-Type', 'application/json');
      res.send(orders); 

    } 
    else {
      console.log('No se encontraron pedidos');
    }
   
  }).select('imagecount numorder status date');
});

// TODO agregar seguridad a esta ruta
router.get('/listallorderpacks', function(req, res) {
  OrderPacks.find({},function(err, orderpacks) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (orderpacks) {
      //console.log('se encontraron pedidos');
      res.setHeader('Content-Type', 'application/json');
      res.send(orderpacks); 

    } 
    else {
      console.log('No se encontraron paquetes de pedidos');
    }
   
  }).select('imagecount numorder status date name userid');
});




// TODO agregar seguridad a esta ruta
router.get('/listspecs', function(req, res) {
  
  Spec.find({'userid':req.user._id, 'disabled':false},function(err, specs) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (specs) {
      //console.log('se encontraron especificaciones');
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
  
  Spec.find({'userid':req.user._id, 'disabled':false},function(err, specs) {
    // In case of any error return
     if (err){
       console.log('Error al consultar');
     }
     //console.log("prueba 2");
   // already exists
    if (specs) {
      //console.log('se encontraron especificaciones');
      res.setHeader('Content-Type', 'application/json');
      res.send(specs); 
    } 
    else {
      console.log('No se encontraron especificaciones');
    }
  }).select('_id name date totalprice').sort('-date').limit(parseInt(req.params.limit));
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
 
// Confirma la aceptación del pedido.
  router.post('/confirmOrder/:numorder', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
              //res.render('historial', {message: req.flash('message'), user: req.user, countorders:count });
           findaorder(req.params.numorder,function(error,order){ 
              console.log(order); 
              findanyspec(order[0].specid, function(error, spec){
                //console.log(spec);
                console.log(req.user);
                doConfirmOrder(req.params.numorder, req, spec[0].typespec ,function(tipomsg,message,href){
                    //console.log(spec);
                    //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
                    

                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: tipomsg, message: message, href:href})); 
                    //res.render('especificaciones1', {message: 'Prueba', user: req.user, href:'thankyou'});
                });
              });  
            });  
  });


/* Crea un nuevo pedido. */
  router.post('/neworder', function(req, res) {
    // Display the Login page with any flash message, if any
   // todo: modificar este try catch
   try {
    console.log(req.body['imageUploadInfos']);
    console.log(req.params);
    var imageUploadInfos = JSON.parse(req.body['imageUploadInfos']);

    findaspec(req.body.specid,function(error,spec){
              //console.log(spec);
              //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
    console.log(error);
    console.log(spec[0].maxfiles);

    console.log(imageUploadInfos.length);
    if (error == 1){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar el pedido'})); 


    }
    else
     {
        if (spec[0].maxfiles > 0 && (imageUploadInfos.length > spec[0].maxfiles )){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({
           error: 1, message: 'Para este tipo de especificación solamente se permiten '+ spec[0].maxfiles + ' archivos'} 
           )); 

        }
        else{

          // todo bien
        var numorderstr="";
        var newOrder = new Orders();
        //newOrder.name = 'orderfotos';
        newOrder.userid = req.user._id;
        newOrder.imagecount = req.body['imagecount'];
        newOrder.specid = req.body.specid;
        newOrder.totalpay = req.body.totalpay;

        if (spec[0].typespec == 'free'){
          newOrder.status = 'Por pagar';
        }
        else
        {
          newOrder.status = 'Por pagar';
        }

        // todo: recorrer el req.body para obtener los datos de las imagenes
        
        console.log(imageUploadInfos);

        for (var i=0; i < imageUploadInfos.length; i++){
            //i === 0: arr[0] === undefined;
            //i === 1: arr[1] === 'hola';
            //i === 2: arr[2] === 'chau';
            imageUploadInfos[i].position = i+1;
            console.log(imageUploadInfos[i].position);
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
          else{

              console.log(' Se guardó el pedido'); 
              console.log(newOrder.numorder);
              // res.render('como2', {message: req.flash('message')});
              numorderstr = String(newOrder.numorder);
              console.log(numorderstr);
              // inhabilitar la especificacion gratuita
              disableSpec(req.body.specid,function(err,message_spec){});

              // crear paquetes de trabajo
             //console.log('cantidad imagenes ' + newOrder.images.length());

            var packagelenght = config.package.length;
            var imagecount = imageUploadInfos.length;
            var numpacksfull = Math.floor(imagecount/packagelenght);
            var otherfiles = (imagecount % packagelenght);
             // crea un registro
            var lownumber = 1;
            var highnumber = packagelenght;
            for (var i=1; i <= numpacksfull; i++){
                  var newOrderPack = new OrderPacks();
                  newOrderPack.status = newOrder.status;  
                  newOrderPack.userid = newOrder.userid;
                  newOrderPack.numorder = newOrder.numorder;
                  newOrderPack.name = 'Package ' + i;
                  newOrderPack.userid = newOrder.userid;
                  newOrderPack.date = Date();
                  newOrderPack.imagecount = (highnumber - lownumber) + 1;
                   // almacenar los datos del paquete
                   console.log(lownumber + ', ' + highnumber); 
                   for (var y=lownumber; y <= highnumber; y++){
                      newOrderPack.images.push(imageUploadInfos[y-1]);
                   } 
                    
                    newOrderPack.save(function(err) {
                        if (err){
                          console.log('No se pudo guardar el paquete del pedido: '+ err); 
                        }
                        else
                        {
                          console.log(' Se guardó el paquete ' + y + ' del pedido');
                          console.log(newOrderPack); 
                        }
                    });
                   lownumber = lownumber + packagelenght;
                   highnumber = highnumber + packagelenght;     

            }
            if (otherfiles > 0){
                highnumber = lownumber + (otherfiles-1);
                console.log(lownumber + ', ' + highnumber);
                var newOrderPack = new OrderPacks();
                newOrderPack.status = newOrder.status;  
                newOrderPack.userid = newOrder.userid;
                newOrderPack.numorder = newOrder.numorder;
                newOrderPack.name = 'Package ' + (numpacksfull + 1);
                newOrderPack.userid = newOrder.userid;
                newOrderPack.date = Date();
                newOrderPack.imagecount = (highnumber - lownumber) + 1;
               for (var y=lownumber; y <= highnumber; y++){
                  newOrderPack.images.push(imageUploadInfos[y-1]);
               } 
                newOrderPack.save(function(err) {
                    if (err){
                      console.log('No se pudo guardar el paquete ' + y +' del pedido: '+ err); 
                    }
                    else
                    {
                      console.log(' Se guardó el paquete' + y + ' del pedido'); 
                      console.log(newOrderPack);
                    }
                });
               
            }
              //res.write('<h1>'+ numorderstr + '</h1>');
              //res.end();
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ error: 0, message: 'Se guardó el pedido', numorder: newOrder.numorder, typespec: spec[0].typespec })); 
            }
          });  
        }
      } 
    });
  }
  catch(err) {
    console.log(err.message);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar el pedido'})); 
  }
});

  router.get('/',
  function(req, res) {
    res.render('intro', {message: req.flash('message')});
    //res.sendFile('../public/htmls/intro.html' , { root : __dirname});
    //console.log(req.user);
  });

router.get('/imagen',
  function(req, res) {
    //res.render('intro', {message: req.flash('message')});
    //res.download('../public/images/boton_play1.png');
    console.log(path.resolve(__dirname));
      res.attachment(path.join(__dirname, '../public/htmls', 'micuenta.bak' ));

    res.attachment(path.join(__dirname, '../public/htmls', 'thankyou.bak' ));
    res.end();
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

  router.get('/de_registro', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('de_registro', {message: req.flash('message')});
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
    res.render('precios', {message: req.flash('message'), precio:config.prices.cutandremove});
  });

 router.get('/de_packages', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('de_packages', {message: req.flash('message')});
  });
  
 router.get('/hinewuser', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('hinewuser', {message: req.flash('message')});
  });

/* GET login page. */
  router.get('/login', function(req, res) {
    //console.log(req.flash('message'));
   
    //res.render('login', {message: 'dfjhdjhsjd'});
    var msjres = req.flash('message');
    res.render('login', {message: msjres[0]});

  });
//Login para diseñadores
  router.get('/de_login', function(req, res) {
    res.render('de_login', {message: req.flash('message')});
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

/* Maneja la página micuenta */
  router.get('/micuenta', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('micuenta', {message: req.flash('message'), user: req.user, countorders:ordersinproc});
  });


/* Maneja la página especificaciones1 */
  router.get('/especificaciones1', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){

          countorders(req.user._id,function(count){
               
              //res.render('historial', {message: req.flash('message'), user: req.user, countorders:count });
              res.render('especificaciones1', {message: req.flash('message'), user: req.user, countorders:count});
          });

          
  });

  /* Maneja la página especificaciones2 */
  router.get('/especificaciones2', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('especificaciones2', {message: req.flash('message'), user: req.user, config:config, countorders:ordersinproc, specid:''});
  });



/* Maneja la confirmación de un usuario */
  router.get('/confirmuser/:userid',function(req, res) {
    doConfirmUser(req.params.userid, function(err, message){
         res.render('login', {message: message});
    });      
  });

/* Maneja la página especificaciones2 cuando se va a editar una especificación */
  router.get('/especificaciones2/:specid', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('especificaciones2', {message: req.flash('message'), user: req.user, config:config, countorders:ordersinproc, specid:req.params.specid});
  });
  /* Maneja la aplicación principal */
  router.get('/principal', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          console.log(req.user);
          

          countorders(req.user._id,function(count){
            // Validar que el usuario esta activo.
               //console.log(count);
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
              // res.render('confirmpayorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, order:order[0]});             
              res.render('principal', {message: req.flash('message'), user: req.user, countorders:count});
 
          });
 });

 

/* Maneja la página historial */
  router.get('/historial', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){

           countorders(req.user._id,function(count){
               //console.log(count);
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
              // res.render('confirmpayorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, order:order[0]});             
              //res.render('principal', {message: req.flash('message'), user: req.user, countorders:count});
              res.render('historial', {message: req.flash('message'), user: req.user, countorders:count });
          });
           
  });


/* Maneja la pagina donde se escoge la tecnica para subir imagenes */
  router.get('/subirimagen1', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
               countorders(req.user._id,function(count){
               res.render('subirimagen1', {message: req.flash('message'), user: req.user, countorders:count });
          });
  });


/* Maneja la pagina que tiene el dropzone para subir imágenes */
  router.get('/chooseanimage', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
            countorders(req.user._id,function(count){
               res.render('chooseanimage', {message: req.flash('message'), user: req.user, countorders:count });
           });
  });

/* Maneja la pagina para seleccionar el tamaño de las imágenes */
  router.get('/chooseasize', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseasize', {message: req.flash('message'), user: req.user, countorders:ordersinproc});
  });

/* Maneja la pagina para seleccionar el margen las imágenes */
  router.get('/chooseamargin', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseamargin', {message: req.flash('message'), user: req.user, countorders:ordersinproc});
  });

  /* Maneja la pagina para seleccionar la alineación de las imágenes */
  router.get('/chooseanalignment', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseanalignment', {message: req.flash('message'), user: req.user,countorders:ordersinproc});
  });

/* Maneja la pagina que permite elegir un extra de la especificación */
  router.get('/chooseanextra', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseanextra', {message: req.flash('message'), user: req.user, config:config, countorders:ordersinproc});
  });


/* Maneja la pagina que tiene el dropzone para subir imágenes */
  router.get('/uploadimages', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('uploadimages', {message: req.flash('message'), user: req.user, countorders:ordersinproc});
  });

/* Maneja la pagina que tiene el dropzone para subir imágenes 
   Cuando es llamada desde la creación de una especificación
*/
  router.get('/uploadimages/:newSpecid', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
            findaspec(req.params.newSpecid,function(error,spec){
              //console.log(spec);
              res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
            });
  });

  /* Maneja la pagina que tiene el dropzone para subir imágenes 
   Cuando es llamada desde la creación de una especificación
*/
  router.get('/getSpec/:specid', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
            findaspecfull(req.params.specid,function(error,message,spec){
              //console.log(spec);
              //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
              
              if (error===0){
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: error, message: message, spec: spec[0]})); 
              }
              else{
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: error, message: message})); 
              }
              
            });
  });

  router.get('/getUser_details/:userid', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
            findauser_details(req.params.userid,function(error,message,user_details){
              //console.log(spec);
              //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
              
              if (error===0){
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: error, message: message, user_details: user_details[0]})); 
              }
              else{
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: error, message: message})); 
              }
              
            });
  });
/* Maneja la pagina donde se cierra el pedido o la orden de compra */
  router.get('/chooseaspecification', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
           res.render('chooseaspecification', {message: req.flash('message'), user: req.user, countorders:ordersinproc});
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
               res.render('confirmpayorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, order:order[0], countorders:ordersinproc});             
          });
  });

  router.get('/thankyou/:numorder', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          findaorder(req.params.numorder,function(error,order){
               console.log(order);
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
               res.render('thankyou', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, order:order[0], countorders:ordersinproc});             
          });
  });

 router.get('/payorder/:numorder', 
     require('connect-ensure-login').ensureLoggedIn('/login'),
         function(req, res){
          
               //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id });
               //var numorder_zero = fillzero(req.params.numorder, '0000000');

               res.render('payorder', {message: req.flash('message'), user: req.user, numorder:req.params.numorder, countorders:ordersinproc});             
         
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
  
  /* Handle Designer Login POST */
 router.post('/de_signin', passport.authenticate('de_login', {
    successRedirect: '/de_designers1.html',
    failureRedirect: '/de_login',
    failureFlash : true,
    successFlash : true 
  }));
 
   /* Handle Designer Registration POST */
  router.post('/de_signup', passport.authenticate('de_signup', {
    successRedirect: '/de_signup_success',
    failureRedirect: '/de_signup_error',
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

  router.get('/de_signup_success', require('connect-ensure-login').ensureLoggedIn('/de_login'),
    function(req, res){
        var msjres = req.flash('success');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ error: 0, message: msjres[0]}));
  });




  // Si sucede un error al registrar un usuario se ejecuta esta ruta
  router.get('/de_signup_error', function(req, res) {
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


// CRUD
/* Handle new step by step specification  POST */
  router.post('/newstepspec', function (req,res) {
    // body...
      var specInfos = JSON.parse(req.body['specInfos']);
      var newSpec = new Spec();
      // set the user's local credentials
      // recibir el array de datos
      newSpec.name = specInfos[0].specname;
      newSpec.format = specInfos[0].format;
      newSpec.colormode = specInfos[0].colormode;
      newSpec.background = specInfos[0].background;
      newSpec.backgrndcolor = specInfos[0].backgrndcolor;
      newSpec.dpi = specInfos[0].DPI;
      newSpec.dpinone = specInfos[0].dpinone;
      newSpec.userid = req.user._id;  
      newSpec.alignnone = specInfos[0].alignnone;
      newSpec.alignhor = specInfos[0].alignhor;
      newSpec.alignver = specInfos[0].alignver;
      newSpec.imagesize = specInfos[0].imagesize;
      newSpec.sizenone = specInfos[0].sizenone;
      newSpec.measuresize = specInfos[0].measuresize;
      newSpec.marginnone = specInfos[0].marginnone;
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
      newSpec.widthsize = specInfos[0].widthsize;
      newSpec.heightsize = specInfos[0].heightsize;
      newSpec.spectype = specInfos[0].spectype;
      newSpec.date = specInfos[0].date;
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



router.post('/updateuserdetails', require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req, res){
    
  // body...
    //var user_details_id = req.body.specid;
    var newUserDet = new User_details();
      // set the user's local credentials
      //newSpec.specid = req.body.specid;
    newUserDet.userid = req.user._id;
    newUserDet.contactname = req.body.contactname;
    newUserDet.contactemail = req.body.contactemail;
    newUserDet.sel_contactcountry = req.body.sel_contactcountry;
    newUserDet.chk_factura = req.body.chk_factura;
    newUserDet.factrfc = req.body.factrfc;
    newUserDet.sel_factcountry = req.body.sel_factcountry;
    newUserDet.factmunicipio = req.body.factmunicipio;
    newUserDet.factcolonia = req.body.factcolonia;
    newUserDet.factnum_ext = req.body.factnum_ext;
    newUserDet.factcp = req.body.factcp;
    newUserDet.factpaymethod = req.body.factpaymethod;
    newUserDet.factrazonsocial = req.body.factrazonsocial;
    newUserDet.factestado = req.body.factestado;
    newUserDet.factciudad = req.body.factciudad;
    newUserDet.factcalle = req.body.factcalle;
    newUserDet.factnum_int = req.body.factnum_int;
    newUserDet.factemail2 = req.body.factemail2;
    newUserDet.factterminacion = req.body.factterminacion;
    User_details.findOne({ userid: req.user._id}, function (err, doc){
        //console.log(req.body.name);
        console.log(err);
        if (err){
            console.log('Se presentó un problema al buscar los detalles del usuario: '+err);
            //res.setHeader('Content-Type', 'application/json');
            //res.send(JSON.stringify({ error: 1, newSpecid: newSpec._id, message: 'No se guardaron los cambios, favor de contactar al administrador'})); 
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: 1, newUserDet: newUserDet._id, message: 'No se pudieron guardar los cambios, favor de contactar al administrador'}));
        }
        else{
          if (doc) {

            doc.userid=  req.user._id;
            doc.contactname =  req.body.contactname;
            doc.contactemail =  req.body.contactemail;
            doc.sel_contactcountry =  req.body.sel_contactcountry;
            doc.chk_factura =  req.body.chk_factura;
            doc.factrfc =  req.body.factrfc;
            doc.sel_factcountry = req.body.sel_factcountry;
            doc.factmunicipio = req.body.factmunicipio;
            doc.factcolonia = req.body.factcolonia;
            doc.factnum_ext = req.body.factnum_ext;
            doc.factcp = req.body.factcp;
            doc.factpaymethod = req.body.factpaymethod;
            doc.factrazonsocial = req.body.factrazonsocial;
            doc.factestado = req.body.factestado;
            doc.factciudad = req.body.factciudad;
            doc.factcalle = req.body.factcalle;
            doc.factnum_int = req.body.factnum_int;
            doc.factemail2 = req.body.factemail2;
            doc.factterminacion = req.body.factterminacion;
            //doc.specid = req.user.specid;
            console.log(doc);
            doc.save( function(err){
               if (err){
                  //newSpec.save();
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 0, newUserDet: newUserDet._id, message: 'No se guardaron correctamente los detalles del usuario'})); 
               }
               else{
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 0, newUserDet: newUserDet._id, message: 'Se guardaron correctamente los detalles del usuario'})); 
               }
            });
          } 
          else {
            ///guardar
              newUserDet.save(function(err) {
                if (err){
                  console.log('No se pudo guardar los detalles del usuario: ' + err); 
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar los detalles del usuario'})); 
                  //throw err;  
                }
                else{
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 0, newUserDet: newUserDet._id, message: 'Se guardó correctamente los detalles del usuario'})); 
                }
              });

             
          }

          
        }

      });


});
   


 /* Handle new specification POST */
  router.post('/newspec', function (req,res) {
    // body...
    console.log(req.body);

    console.log(req.user._id);
    
    console.log(req.body.specid);
    var specid = req.body.specid;
      var newSpec = new Spec();
      // set the user's local credentials
      //newSpec.specid = req.body.specid;
      newSpec.name = req.body.name;
      newSpec.format = req.body.format;
      newSpec.colormode = req.body.colormode;
      newSpec.background = req.body.background;
      newSpec.backgrndcolor = req.body.backgrndcolor;
      newSpec.dpi = req.body.DPI;
      newSpec.dpinone = req.body.dpinone;
      newSpec.userid = req.user._id;  
      newSpec.alignnone = req.body.alignnone;
      newSpec.alignhor = req.body.alignhor;
      newSpec.alignver = req.body.alignver;
      newSpec.sizenone = req.body.sizenone;
      newSpec.imagesize = req.body.imagesize;
      newSpec.marginnone = req.body.marginnone;
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
      newSpec.widthsize = req.body.widthsize;
      newSpec.heightsize = req.body.heightsize;
      newSpec.spectype = req.body.spectype;
      newSpec.date = req.body.date;
      spectotalprice(req.body,function(total){
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 0, ntotal:total , message: 'Se guardó la especificación'})); 
          newSpec.totalprice = total;
          // guarda los cambios de una especificacion
          if (specid === null || specid === ''){
            // crea una nueva especificacion
            newSpec.save(function(err) {
                if (err){
                  console.log('No se pudo guardar la especificación: ' + err); 
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 1, message: 'No se pudo guardar la especificación'})); 
                  throw err;  
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: 0, newSpecid: newSpec._id, message: 'Se generó correctamente la especificación'})); 
              });
          }else{
            console.log('Update');
            console.log(specid);
            Spec.findOne({ _id: specid, typespec:'normal'  }, function (err, doc){
              console.log(req.body.name);
              console.log(err);
              if (err){
                  console.log('Error al guardar la especificación: '+err);
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 1, newSpecid: newSpec._id, message: 'No se guardaron los cambios, favor de contactar al administrador'})); 
              }
              else{
                if (doc) {
                  doc.name = req.body.name;
                  doc.format = req.body.format;
                  doc.colormode = req.body.colormode;
                  doc.background = req.body.background;
                  doc.backgrndcolor = req.body.backgrndcolor;
                  doc.dpi = req.body.DPI;
                  doc.dpinone = req.body.dpinone;
                  //doc.userid = req.user._id;  
                  doc.alignnone = req.body.alignnone;
                  doc.alignhor = req.body.alignhor;
                  doc.alignver = req.body.alignver;
                  doc.sizenone = req.body.sizenone;
                  doc.imagesize = req.body.imagesize;
                  doc.marginnone = req.body.marginnone;
                  doc.marginmeasure = req.body.marginmeasure;
                  doc.measuresize = req.body.measuresize;
                  doc.margintop = req.body.margintop;
                  doc.marginbottom = req.body.marginbottom;
                  doc.marginright = req.body.marginright;
                  doc.marginleft = req.body.marginleft;
                  doc.naturalshadow = req.body.naturalshadow;
                  doc.dropshadow = req.body.dropshadow;
                  doc.correctcolor = req.body.correctcolor;
                  doc.clippingpath = req.body.clippingpath;
                  doc.basicretouch = req.body.basicretouch;
                  doc.widthsize = req.body.widthsize;
                  doc.heightsize = req.body.heightsize;
                  doc.spectype = req.body.spectype;
                  doc.date = req.body.date;
                  doc.totalprice = newSpec.totalprice;
                  //doc.specid = req.user.specid;
                  console.log(doc);

                  doc.save();
                  
                  //newSpec.save();
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 0, newSpecid: newSpec._id, message: 'Se guardaron correctamente los cambios a la especificación'})); 
                } 
                else {
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ error: 1, newSpecid: newSpec._id, message: 'No se encontró la especificación, los cambios no fueron almacenados'})); 
                }
              }
            });  
          }
    });
  });

/* Handle get payment sign POST */
  router.post('/getpaymentsign/:numorder', function (req,res) {
    //res.setHeader('Content-Type', 'application/json');
    //res.send(JSON.stringify({ error: error, message: message, user_details: user_details[0]})); 
    findaorder(req.params.numorder,function(err,order){
      if (err){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ error: 1, message:'No se encontró el pedido', sign: ''})); 
      }
      else{
          console.log(order);
          var CSSB = process.env.CSSB || '5634ytyertewrg';
          var paymentsign = '';
          var Ds_Merchant_Amount = order[0].totalpay.toString().replace('.', ''); //req.param('Ds_Merchant_Amount');
          var Ds_Merchant_Order = fillzero(req.params.numorder, '0000000');
          var Ds_Merchant_MerchantCode = 4093847; //req.param('Ds_Merchant_MerchantCode');
          var Ds_Merchant_Currency = 840; //req.param('Ds_Merchant_Currency');
          var Ds_Merchant_TransactionType  = 0; //req.param('Ds_Merchant_TransactionType');
          var Ds_Merchant_UrlOK = 'https://www.imgnpro.com/transactionok';
          var Ds_Merchant_UrlKO = 'https://www.imgnpro.com/transactiondeny';
          var Ds_Merchant_MerchantURL = 'https://www.imgnpro.com';
          var Ds_Merchant_MerchantName = 'IMAGEN PRO';
          var Ds_Merchant_Terminal = 1;
          console.log('A pagar:' + Ds_Merchant_Amount);
          console.log('Pedido:' + Ds_Merchant_Order);
          console.log('Codigo comercio:' + Ds_Merchant_MerchantCode);
          console.log('Moneda:' + Ds_Merchant_Currency);
          console.log('Tipo transacción:' + Ds_Merchant_TransactionType);




          paymentsign = sha1(Ds_Merchant_Amount + Ds_Merchant_Order + Ds_Merchant_MerchantCode + Ds_Merchant_Currency + Ds_Merchant_TransactionType + CSSB);
          console.log(paymentsign);

             //SHA-1()
                 
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ error: 0, Ds_Merchant_MerchantSignature: paymentsign, Ds_Merchant_Amount:Ds_Merchant_Amount, Ds_Merchant_Order:Ds_Merchant_Order, Ds_Merchant_UrlOK:Ds_Merchant_UrlOK, Ds_Merchant_UrlKO:Ds_Merchant_UrlKO, Ds_Merchant_MerchantURL:Ds_Merchant_MerchantURL, Ds_Merchant_MerchantCode:Ds_Merchant_MerchantCode, Ds_Merchant_Currency:Ds_Merchant_Currency, Ds_Merchant_TransactionType:Ds_Merchant_TransactionType, Ds_Merchant_MerchantName:Ds_Merchant_MerchantName, Ds_Merchant_Terminal:Ds_Merchant_Terminal})); 
        }
    });        
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
          failureRedirect : '/login',
          failureFlash : true,
          successFlash : true 
  }));



router.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

//var upload = multer({ dest: 'uploads/' });

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 */

router.get('/delete-s3', (req, res) => {
  const s3 = new aws.S3();
  console.log(req.query['filename']);
  const fileName = req.user._id +'/' + req.query['filename']; 
  var params = {
    Bucket: S3_BUCKET_NAME, /* required */
    Key: fileName /* required */
    //MFA: 'STRING_VALUE',
    //RequestPayer: 'requester',
    //VersionId: 'STRING_VALUE'
  };
  s3.deleteObject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); 
      var returnData = {
        error: 1,
        message: `Error al borrar`
      };
      res.write(JSON.stringify(returnData));
      res.end();
    
    }// an error occurred
    else{     
      console.log(data);           // successful response
      var returnData = {
          error: 0,
          message: `se borró`
        };
        res.write(JSON.stringify(returnData));
        res.end();
        }
      });




});

router.get('/sign-s3', (req, res) => {

//var AWS = require('aws-sdk');
   

  const s3 = new aws.S3();

  // el nombre del folder llevar el id del usuario
  var folder = req.user._id +'/' ;
  // crea la carpeta para guardar las imágenes
  var params = { Bucket: S3_BUCKET_NAME, Key: folder, ACL: 'public-read', Body:'body does not matter' };
  s3.upload(params, function (err, data) {
  if (err) {
      console.log("Error creating the folder: ", err);
      } else {
      //console.log("Successfully created a folder on S3");

      }
  });
  // crea la carpeta para guardar las vistas en miniatura de las imágenes
  var params = { Bucket: S3_BUCKET_NAME_THUMB, Key: folder, ACL: 'public-read', Body:'body does not matter' };
  s3.upload(params, function (err, data) {
  if (err) {
      console.log("Error creating the folder thumbnail: ", err);
      } else {
      //console.log("Successfully created a thumbnail folder on S3");

      }
  });


  // al fileName se le agrega el folder para que la firma lo reconozca
  const fileName = req.user._id +'/' + req.query['filename'];
  const fileType = req.query['filetype'];
  const s3Params = {
    Bucket: S3_BUCKET_NAME,
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
      url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
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
  Spec.find({'_id':specid, 'disabled':false},function(err, specrecord) {
    // In case of any error return
     if (err){
       console.log('Error al consultar la especificación');

      cb(1);
     }
   // already exists
    if (specrecord) {
      console.log('se encontró  la especificación');
      console.log(specrecord);
      cb( 0, specrecord);
    } 
    else {
      console.log('No se encontró la especificación');
        cb(2);
    }
   
  }).select('name totalprice date maxfiles typespec').limit(1);
}

function findanyspec(specid, cb){
  console.log(specid);
  Spec.find({'_id':specid},function(err, specrecord) {
    // In case of any error return
     if (err){
       console.log('Error al consultar la especificación');

      cb(1);
     }
   // already exists
    if (specrecord) {
      console.log('se encontró  la especificación');
      console.log(specrecord);
      cb( 0, specrecord);
    } 
    else {
      console.log('No se encontró la especificación');
        cb(2);
    }
   
  }).select('name totalprice date maxfiles typespec').limit(1);
}


function findaspecfull(specid, cb){
  if (specid.length === 0){
    cb(1, 'Error al consultar la especificación, longitud 0');
  }
  else{
      Spec.find({'_id':specid, 'disabled':false},function(err, specrecord) {
      // In case of any error return
       if (err){
         console.log('Error al consultar la especificación');

        cb(1, 'Error al consultar la especificación');
       }
       else{
    // already exists
          if (specrecord) {
            console.log('Se encontró  la especificación');
            console.log(specrecord);
            cb( 0,'Se encontró  la especificación', specrecord);
          } 
          else {
            console.log('No se encontró la especificación');
              cb(2,'No se encontró  la especificación' );
          }
       }
    }).limit(1);
  }
}

function findauser_details(userid, cb){
  if (userid.length === 0){
    cb(1, 'Error al consultar los detalles del usuario, longitud 0');
  }
  else{
      User_details.find({'userid':userid},function(err, userrecord) {
      // In case of any error return
       if (err){
         console.log('Error al consultar los detalles del usuario');

        cb(1, 'Error al consultar los detalles del usuario');
       }
       else{
    // already exists
          if (userrecord) {
            console.log('Se encontraron los detalles del usuario');
            console.log(userrecord);
            cb( 0,'Se encontraron los detalles del usuario', userrecord);
          } 
          else {
            console.log('No se encontraron los detalles del usuario');
              cb(2,'No se encontraron los detalles del usuario' );
          }
       }
    }).limit(1);
  }
}

function findauser(userid, cb){
  if (userid.length === 0){
    cb(1, 'Error al consultar al usuario, longitud 0');
  }
  else{
      console.log(userid);
      User.find({'_id':userid},function(err, user) {
      // In case of any error return
       if (err){
         console.log('Error al consultar el usuario');

        cb(1, 'Error al consultar el usuario');
       }
       else{
    // already exists
          if (user) {
            console.log('Se encontró el usuario');
            console.log(user);
            cb( 0,'Se encontró el usuario', user);
          } 
          else {
            console.log('No se encontró el usuario');
              cb(2,'No se encontró el usuario' );
          }
       }
    }).limit(1);
  }
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
  }).select('date status totalpay specid').limit(1);
}

function doConfirmOrder(numorder,req,typespec,cb){
  //console.log(req.user);
  findauser(req.user._id,function(error,message,user){
      //console.log(spec);
      //res.render('uploadimages', {message: req.flash('message'), user: req.user, namespec:spec[0].name, totalprice:spec[0].totalprice, specid:spec[0]._id , countorders:ordersinproc});
      
      if (error){
        cb( 1,'No se encontró el usuario');
      }
      else
      {
        console.log('error:' + error);
       console.log('user: ');
       console.log(user);

        var statusorder ='';
       
        if (user[0].usertype=='business' || typespec=='free' ){
            statusorder ='En Proceso';
            href = 'thankyou';
        }
        else
        {
           statusorder ='Por pagar';
            href = 'payorder';
        }
        console.log(user);
        console.log(statusorder);

        //confirmar pedido y paquetes

        if (statusorder =='En Proceso'){
          var conditions = { numorder: numorder }
            , update = { $set: { status: statusorder }}
            , options = { multi: true };

          Orders.update(conditions, update, options, function (err, numAffected) {
            // numAffected is the number of updated documents
           
            console.log(numAffected);
            if (err){
                console.log(err);
                cb( 1,'No fue posible actualizar el estatus del pedido');
            }
            else{
                // actualizar paquetes

                OrderPacks.update(conditions, update, options, function (err, numAffected) {
                  // numAffected is the number of updated documents
                 
                  console.log(numAffected);
                  if (err){
                      console.log(err);
                      cb( 1,'No fue posible actualizar el estatus del pedido');
                  }
                  else{
                      // actualizar paquetes
                      cb( 0,'Se actualizó el estatus del pedido', href);

                  }
                });
                //cb( 0,'Se actualizó el estatus del pedido', href);

            }
          });

        }
        else
        {
            cb( 2,'Pedido normal', href);
        }
          

      }
    });
}

function countorders(userid,cb){

  Orders.count({'userid':userid, 'status':'En proceso'}, function( err, count){
    //console.log(userid);
    //console.log( "Número de pedidos:", count );
    //req.countorders = count;
    ordersinproc = count;
    cb(count);
  });

}

function toDateString(date,cb){
  var dateformat = '';
  dateformat = String('00' + date.getDate()).slice(-2) + '/' + String('00' + date.getMonth()).slice(-2)+ '/' + date.getFullYear();
  cd(dateformat);
}

function doConfirmUser(userid,cb){
 //var confirmUser = new User();

  console.log('Confirm user');
  console.log(userid);
  User.findOne({ _id: userid  }, function (err, doc){

    console.log(err);
    if (err){
        console.log('Error al confimar usuario: '+err);
        cb(1,'Error al confimar usuario: '+err);
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 1, message: 'No se guardaron los cambios, favor de contactar al administrador'})); 
    }
    else{
      if (doc) {
        doc.disabled = false;
       
        //doc.specid = req.user.specid;
        console.log(doc);

        doc.save();
        cb(0,'usuario confirmado, favor de ingresar');
        //newSpec.save();
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 0,  message: 'Se guardaron correctamente los cambios a la especificación'})); 
      } 
      else {
        cb(1,'No se encontró al usuario');
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 1,  message: 'No se encontró la especificación, los cambios no fueron almacenados'})); 
      }
    }
  });  
}

function disableSpec(specid,cb){
    console.log(specid);
    Spec.findOne({ _id: specid, typespec:'free'  }, function (err, doc){
      //console.log(req.body.name);
      console.log(err);
      if (err){
          console.log('Error al guardar la especificación: '+err);
          //res.setHeader('Content-Type', 'application/json');
          //res.send(JSON.stringify({ error: 1, newSpecid: newSpec._id, message: 'No se guardaron los cambios, favor de contactar al administrador'})); 
          cb(1,'Error al guardar la especificación: '+err);
      }
      else{
        if (doc) {
          
          doc.disabled = true;
          //doc.specid = req.user.specid;
          console.log(doc);

          doc.save();
          cb(0,'Error al guardar la especificación: '+err);
          //newSpec.save();
          //res.setHeader('Content-Type', 'application/json');
          //res.send(JSON.stringify({ error: 0, newSpecid: newSpec._id, message: 'Se guardaron correctamente los cambios a la especificación'})); 
        } 
        else {
          cb(1,'No se encontró la especificación, los cambios no fueron almacenados');
          //res.setHeader('Content-Type', 'application/json');
          //res.send(JSON.stringify({ error: 1, newSpecid: newSpec._id, message: 'No se encontró la especificación, los cambios no fueron almacenados'})); 
        }
      }
    });  
}

function fillzero(param,pattern){
  return (pattern + param).slice(-7);

}

module.exports = router;
