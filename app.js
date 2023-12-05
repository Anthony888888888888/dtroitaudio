const express = require('express');
const app = express();
const router = express.Router();


app.use(express.urlencoded({extended:false}));
app.use(express.json());

const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'});

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const bcryptjs = require('bcryptjs');

const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
 }));

 const connection = require('./database/db');

// Seleccionar la base de datos
connection.query('USE login', (error) => {
    if (error) {
        console.log('Error al seleccionar la base de datos:', error);
    } else {
        console.log('Base de datos seleccionada');
    }
});

app.get("/", function(req, res){
    res.render("index.ejs");
    })


 app.get("/index", function(req, res){
    res.render("index.ejs");
    })

 app.get("/login", function(req, res){
     res.render("login.ejs");
     })

     const bodyParser = require('body-parser');
     const multer = require('multer');
     
     app.use(bodyParser.json());
     app.use(bodyParser.urlencoded({ extended: true }));
     
     const storage = multer.diskStorage({
         destination: function (req, file, cb) {
             cb(null, 'public/uploads/'); // Ajusta la ruta de destino según tu estructura de archivos
         },
         filename: function (req, file, cb) {
             cb(null, Date.now() + '-' + file.originalname);
         },
     });
     
     const upload = multer({
         storage: storage,
         limits: {
             fileSize: 1024 * 1024 * 5, // Ajusta el límite a 5 MB o según sea necesario
         },
     }).single('imagen_url');
     
     app.post('/agregarProducto', upload, async (req, res) => {
         try {
             const { titulo, descripcion, precio } = req.body;
     
             if (!titulo || !descripcion || !req.file || !precio) {
                 return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
             }
     
             const imagen_url = req.file.filename;
     
             const query = 'INSERT INTO productos (titulo, descripcion, imagen_url, precio) VALUES (?, ?, ?, ?)';
             connection.query(query, [titulo, descripcion, imagen_url, precio], (err, results) => {
                 if (err) {
                     console.error('Error al insertar en la base de datos:', err);
                     return res.status(500).json({ success: false, error: 'Error interno del servidor' });
                 }
     
                 return res.json({ success: true });
             });
         } catch (error) {
             console.error('Error en el manejo de la solicitud:', error);
             res.status(500).json({ success: false, error: 'Error interno del servidor' });
         }
     });

     
     app.delete('/eliminarProducto/:id', (req, res) => {
        const productId = req.params.id;
    
        // Realiza la eliminación del producto en la base de datos
        const query = 'DELETE FROM productos WHERE id = ?';
        connection.query(query, [productId], (err, results) => {
            if (err) {
                console.error('Error al eliminar el producto:', err);
                return res.status(500).json({ success: false, error: 'Error interno del servidor' });
            }
    
            return res.json({ success: true });
        });
    });

    app.use(express.static('resources/uploads'));


     app.get('/productos', async (req, res) => {
        try {
            // Obtener productos de la base de datos
            const productos = await obtenerProductosDeLaBaseDeDatos();
    
            // Renderizar la vista y pasar la variable productos
            res.render('productos', { productos });
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).send('Error interno del servidor');
        }
    });
    
    app.get('/index', async (req, res) => {
        try {
            // Obtener productos de la base de datos
            const productos = await obtenerProductosDeLaBaseDeDatos();
    
            // Renderizar la vista y pasar la variable productos
            res.render('index', { productos });
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).send('Error interno del servidor');
        }
    });

    const obtenerProductosDeLaBaseDeDatos = () => {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM productos', (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    };

    

    app.get('/user_productos', async (req, res) => {
        try {
            // Obtener productos de la base de datos
            const productos = await obtenerProductosDeLaBaseDeDatos();
    
            // Renderizar la vista y pasar la variable productos
            res.render('user_productos', { productos });
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).send('Error interno del servidor');
        }
    });


    app.get('/admin_dashboard', async (req, res) => {
        try {
            // Obtener productos de la base de datos
            const productos = await obtenerProductosDeLaBaseDeDatos();
    
            // Renderizar la vista y pasar la variable productos
            res.render('admin_dashboard', { productos });
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).send('Error interno del servidor');
        }
    });


  

app.get("/register", function(req, res){
        res.render("register.ejs");
        })

app.post('/register', async (req, res) => {
            const user = req.body.user;
            const name = req.body.name;
            const pass = req.body.pass;
        
            try {
                const passwordHash = await bcryptjs.hash(pass, 8);
        
                connection.query('INSERT INTO users SET ?', { user: user, name: name, pass: passwordHash }, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(500).send('Error interno del servidor');
                    } else {
                        res.render('register', {
                            alert: true,
                            alertTitle: 'Registro exitoso',
                            alertMessage: 'Usuario registrado correctamente',
                            alertIcon: 'success',
                            showConfirmButton: false,
                            timer: 1500,
                            ruta:''
                        });
                    }
                });
            } catch (error) {
                console.log(error);
                res.status(500).send('Error interno del servidor');
            }
        });

        app.get("/admin_dashboard", function(req, res) {
            // Verifica si el usuario está autenticado
            if (req.session.loggedin) {
                // Verifica el rol del usuario y redirige en consecuencia
                if (req.session.user && req.session.rol === 'admin') {
                    res.render("admin_dashboard.ejs", { username: req.session.name });
                } else {
                    res.redirect("/user_dashboard");
                }                
                
            } else {
                // Si el usuario no está autenticado, permite el acceso directo a admin_dashboard
                res.render("/login");
            }
        });
        
        app.get('/user_dashboard', (req, res) => {
            if (req.session.loggedin) {
                res.render('user_dashboard', {
                    login: true,
                    name: req.session.name  // Pasa el nombre de usuario a la vista
                });
            } else {
                res.render('user_dashboard', {
                    login: false,
                    name: ', toque salir para iniciar sesion correctamente'
                });
            }
        });

        
        


        app.post('/auth', async (req, res) => {
            const user = req.body.user;
            const pass = req.body.pass;
        
            if (user && pass) {
                connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
                    if (error) {
                        console.error(error);
                        // Manejar el error de la base de datos
                        res.status(500).send('Error interno del servidor');
                        return;
                    }
        
                    if (results.length === 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                        res.render('login', {
                            alert: true,
                            alertTitle: 'Error',
                            alertMessage: 'Usuario y/o contraseña incorrectos',
                            alertIcon: 'error',
                            showConfirmButton: true,
                            timer: false,
                            ruta: 'login'
                        });
                    } else {
                        req.session.loggedin = true;
                        req.session.name = results[0].name;
                        req.session.user = results[0].user;
                        req.session.rol = results[0].rol;  // Agrega esta línea para almacenar el rol en la sesión
        
                        // Verifica el rol y redirige en consecuencia
                        if (results[0].rol === 'admin') {
                            req.session.alertOptions = {
                                alert: true,
                                alertTitle: 'Conexión exitosa',
                                alertMessage: '¡LOGIN CORRECTO!',
                                alertIcon: 'success',
                                showConfirmButton: false,
                                timer: 1500,
                                ruta: '/admin_dashboard'
                            };
                            res.redirect('/admin_dashboard');
                        } else {
                            req.session.alertOptions = {
                                alert: true,
                                alertTitle: 'Conexión exitosa',
                                alertMessage: '¡LOGIN CORRECTO!',
                                alertIcon: 'success',
                                showConfirmButton: false,
                                timer: 1500,
                                ruta: '/user_dashboard'
                            };
                            res.redirect('/user_dashboard');
                        }
                    }
                });
            } else {
                res.render('login', {
                    alert: true,
                    alertTitle: 'Advertencia',
                    alertMessage: '¡Por favor ingrese un usuario y/o contraseña válidos!',
                    alertIcon: 'warning',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }
        });
        
// Página para agregar productos desde el admin_dashboard
router.get('/agregar_producto', (req, res) => {
    res.render('agregar_producto'); // Renderiza una página con un formulario para agregar productos
});

// Manejar la solicitud de agregar producto desde el formulario
router.post('/agregar_producto', (req, res) => {
    const { imagen_url, titulo, descripcion } = req.body;

    connection.query('INSERT INTO productos SET ?', { imagen_url, titulo, descripcion }, (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Error interno del servidor');
        } else {
            res.redirect('/admin_dashboard'); // Redirecciona a la página del admin_dashboard
        }
    });
});


module.exports = router;


app.listen(3000,(req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000')
})