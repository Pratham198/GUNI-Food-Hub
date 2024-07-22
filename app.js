const express = require('express');
const router = express.Router();
const path = require('path'); 
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const session = require('express-session'); 
const multer = require('multer');
const fs = require('fs'); 
const port = 3000;


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session middleware configuration
app.use(session({
    secret: 'MySecertKey', // Replace 'secret' with your secret key for session encryption
    resave: true,
    saveUninitialized: true
}));

// Database connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Replace 'your_password' with your MySQL password
    database: 'guni_food_hub'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database');
});

// Routes
app.get('/', (req, res) => {
    // Construct the path to your HTML file using 'path.join'
    const filePath = path.join(__dirname, 'views', 'home.html');
    res.sendFile(filePath);
});

// Route to serve login.html
app.get('/login', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'login.html');
    res.sendFile(loginFilePath);
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Check if the email and password match any record in the database
    const sql = `SELECT * FROM user_signup_details WHERE email = ? AND password = ?`;
    connection.query(sql, [email, password], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Error executing database query' });
            return;
        }
        // If there is a match, redirect to Dash.html
        if (result.length > 0) {
            console.log('Login successful');
            // Assuming you have the user's ID after successful authentication
            const userId = result[0].id; // Assuming the user's ID is stored in the 'id' column of the database
            req.session.userId = userId; // Set userId in the session
            res.redirect('/Dash'); // Redirect to Dash.html if login is successful
        } else {
            console.log('Invalid email or password');
            res.send('<script>alert("Incorrect email or password!"); window.location.href = "/login";</script>');
            // res.status(401).json({ error: 'Invalid email or password' }); // Send error message
        }
    });
});

// Route to serve signup.html
app.get('/signup', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'signup.html');
    res.sendFile(loginFilePath);
});

// Handle form submission

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    //console.log('Received form data:', { username, email, password }); // Log received form data
    const sql = `INSERT INTO user_signup_details (username, email, password) VALUES (?, ?, ?)`;
    //console.log('SQL query:', sql);
    connection.query(sql, [username, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                 res.status(400).json({ error: 'Email already exists!' });
                //res.send('<script>alert("Email already exists!"); window.location.href = "/signup";</script>');
            } else {
                console.error('Error inserting data:', err);
                res.status(500).json({ error: 'Error inserting data into database' });
            }
            return;
        }
        res.json({ message: 'Signup successful!' });
    });
});

// Route to serve Dash.html
app.get('/Dash', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'Dash.html');
    res.sendFile(loginFilePath);
});

// Route to fetch username from the server
app.get('/fetchUsername', (req, res) => {
    const userId = req.session.userId;
    if (userId) {
        const sql = `SELECT username FROM user_signup_details WHERE id = ?`;
        connection.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Error fetching username:', err);
                res.status(500).json({ error: 'Error fetching username' });
                return;
            }
            res.json({ username: result[0].username });
        });
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
});

// Route to serve fastfood.html
app.get('/fastfood', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'fastfood.html');
    res.sendFile(loginFilePath);
});

// Route to serve chinesefood.html
app.get('/chinesefood', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'chinesefood.html');
    res.sendFile(loginFilePath);
});

// Route to serve southfood.html
app.get('/southindianfood', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'southfood.html');
    res.sendFile(loginFilePath);
});

// Route to serve Bakery.html
app.get('/bakery&cakeshop', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'Bakery.html');
    res.sendFile(loginFilePath);
});

// Route to serve Cart.html
app.get('/Cart', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'Cart.html');
    res.sendFile(loginFilePath);
});

// Route to serve payment.html via /pay

app.get('/pay', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'payment.html');
    res.sendFile(loginFilePath);
});

// Handle form submission and redirect to payment page
app.post('/pay', (req, res) => {
    const { totalPrice } = req.body;
    res.redirect(`/pay?totalPrice=${totalPrice}`);
   
});


app.post('/storeOrder', (req, res) => {
    const { totalPrice, productNames } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const getUserSql = `SELECT username FROM user_signup_details WHERE id = ?`;
    connection.query(getUserSql, [userId], (err, userResult) => {
        if (err) {
            console.error('Error fetching user details:', err);
            res.status(500).send('Failed to fetch user details.');
            return;
        }

        if (userResult.length === 0) {
            console.error('User not found');
            res.status(404).send('User not found.');
            return;
        }

        const userName = userResult[0].username;

        const sql = `INSERT INTO order_details (product_name, total_payment, user_name) VALUES (?, ?, ?)`;
        connection.query(sql, [productNames, totalPrice, userName], (err, result) => {
            if (err) {
                console.error('Error storing order details:', err);
                return res.status(500).json({ success: false, message: 'Failed to store order details' });
            }

            console.log('Order details stored successfully!!!');
            return res.json({ success: true });
        });
    });
});




app.get('/orderhistory', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'orderhistory.html');
    res.sendFile(loginFilePath);
});

// Route to fetch order history
app.get('/api/orderHistory', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const getUserSql = `SELECT username FROM user_signup_details WHERE id = ?`;
    connection.query(getUserSql, [userId], (err, userResult) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
        }

        if (userResult.length === 0) {
            console.error('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userName = userResult[0].username;

        const getOrderSql = `SELECT * FROM order_details WHERE user_name = ?`;
        connection.query(getOrderSql, [userName], (err, orderResult) => {
            if (err) {
                console.error('Error fetching user order history:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch order history' });
            }

            return res.json({ success: true, orders: orderResult });
        });
    });
});



app.get('/tst', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'tst.html');
    res.sendFile(loginFilePath);
});
app.get('/tst2', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'tst2.html');
    res.sendFile(loginFilePath);
});
// Route to serve A_Dash.html
app.get('/A_Dash', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_Dash.html');
    res.sendFile(loginFilePath);
});


// Route to serve A_Login.html
app.get('/A_Login', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_Login.html');
    res.sendFile(loginFilePath);
});

// Handle login form submission
app.post('/A_Login', (req, res) => {
    const { username, password } = req.body;

    // Check if username and password are correct
    if (username === "admin19" && password === "password19") {
        // Authentication successful, redirect to the dashboard page
        res.redirect('/A_Dash');
    } else {
        // Authentication failed, render error message
        res.send('<script>alert("Incorrect username or password!"); window.location.href = "/A_Login";</script>');
    }
});

// Route to serve A_AllShop.html
app.get('/A_AllShop', (req, res) => {
    const allShopFilePath = path.join(__dirname, 'views', 'A_AllShop.html');
    res.sendFile(allShopFilePath);
});


// Route to serve A_AddShop.html
app.get('/A_AddShop', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_AddShop.html');
    res.sendFile(loginFilePath);
});

// Route to serve A_AddFood.html
app.get('/A_AddFood', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_AddFood.html');
    res.sendFile(loginFilePath);
});


// Set up storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Route to add a shop
app.post('/addShop', upload.single('photo'), (req, res) => {
    const { shopName, email, phoneNo, openHours, closeHours } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `INSERT INTO shops (shopname, email, phone_no, open_hours, close_hours, image) VALUES (?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [shopName, email, phoneNo, openHours, closeHours, photo], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to add shop');
        } else {
            res.send('Shop added successfully');
        }
    });
});

app.post('/addFoodItem', upload.single('foodPhoto'), (req, res) => {
    const { shopId, shopName, itemName, foodPrice } = req.body;
    const foodPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `INSERT INTO items (shop_id, shop_name, item_name, item_price, item_image) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [shopId, shopName, itemName, foodPrice, foodPhoto], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Failed to add food item');
            return;
        }
        console.log('Food item added successfully');
        res.redirect('/A_AllFood');
    });
});

// Route to get all shops
app.get('/getAllShops', (req, res) => {
    const sql = 'SELECT * FROM shops';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching shops:', err);
            res.status(500).send('Failed to fetch shops');
        } else {
            res.json(results);
        }
    });
});


// Route to delete a shop
app.delete('/deleteShop/:id', (req, res) => {
    const shopId = req.params.id;
    
    const sql = `DELETE FROM shops WHERE id = ?`;
    connection.query(sql, [shopId], (err, result) => {
        if (err) {
            console.error('Error deleting shop:', err);
            res.status(500).send({ success: false, message: 'Failed to delete shop' });
            return;
        }
        res.send({ success: true, message: 'Shop deleted successfully' });
    });
});

// Route to fetch all food items
app.get('/getFoodItems', (req, res) => {
    const sql = 'SELECT * FROM items';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching food items:', err);
            res.status(500).json({ error: 'Error fetching food items' });
            return;
        }
        res.json(results);
    });
});

// Route to delete a food item by ID
app.delete('/deleteFoodItem/:id', (req, res) => {
    const foodId = req.params.id;
    const sql = 'DELETE FROM items WHERE id = ?';
    connection.query(sql, [foodId], (err, result) => {
        if (err) {
            console.error('Error deleting food item:', err);
            res.status(500).json({ success: false, message: 'Failed to delete food item' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Food item not found' });
            return;
        }
        console.log('Food item deleted successfully');
        res.json({ success: true, message: 'Food item deleted successfully' });
    });
});


// Route to serve A_ShopItems.html
app.get('/A_SI', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_ShopItems.html');
    res.sendFile(loginFilePath);
});

// Route to serve A_AddFood.html

app.post('/addFoodItem', upload.single('foodPhoto'), (req, res) => {
    const { shopId, shopName, itemName, foodPrice } = req.body;
    const foodPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `INSERT INTO items (shop_id, shop_name, item_name, item_price, item_image) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [shopId, shopName, itemName, foodPrice, foodPhoto], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Failed to add food item');
            return;
        }
        console.log('Food item added successfully');
        res.redirect('/A_AllFood');
    });
});
// Route to serve A_AllFood.html
app.get('/A_AllFood', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_AllFood.html');
    res.sendFile(loginFilePath);
});

// Route to fetch order details
app.get('/api/orders', (req, res) => {
    const sql = 'SELECT * FROM order_details';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Error fetching orders' });
            return;
        }
        res.json(results);
    });
});

// Mock database update function
const updateOrderStatusInDB = (orderId, status) => {
    const sql = 'UPDATE order_details SET order_status = ? WHERE order_id = ?';
    connection.query(sql, [status, orderId], (err, result) => {
        if (err) {
            console.error('Error updating order status in DB:', err);
            return;
        }
        console.log('Order status updated successfully in DB');
    });
};

// API endpoint to update order status
app.put('/api/orders/:orderId/status', (req, res) => {
    const orderId = req.params.orderId;
    const { order_status } = req.body;

    updateOrderStatusInDB(orderId, order_status);
    res.json({ success: true });
});


// Route to serve A_OrderManagment.html
app.get('/A_OM', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_OrderManagment.html');
    res.sendFile(loginFilePath);
});


// Route to serve A_DeliveredOrders.html
app.get('/A_DO', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_DeliveredOrders.html');
    res.sendFile(loginFilePath);
});

// Endpoint to fetch delivered orders
app.get('/api/deliveredOrders', (req, res) => {
    const sql = 'SELECT * FROM order_details WHERE order_status = ?';
    connection.query(sql, ['Delivered'], (err, results) => {
        if (err) {
            console.error('Error fetching delivered orders:', err);
            res.status(500).json({ error: 'Error fetching delivered orders' });
            return;
        }
        res.json(results);
    });
});

// Route to serve A_User.html
app.get('/A_User', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_User.html');
    res.sendFile(loginFilePath);
});

// // API endpoint to fetch all users
app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, username, email, password FROM user_signup_details';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Error fetching users' });
            return;
        }
        res.json(results);
    });
});

// Route to get all users
// app.get('/api/users', (req, res) => {
//     const sql = `SELECT id, username, email FROM user_signup_details`;
//     connection.query(sql, (err, results) => {
//         if (err) {
//             res.status(500).json({ error: 'Error fetching user data' });
//             return;
//         }
//         res.json(results);
//     });
// });

// Route to get orders for a specific user
app.get('/api/userOrders', (req, res) => {
    const { userId } = req.query;
    const sql = `SELECT * FROM order_details WHERE user_name = (SELECT username FROM user_signup_details WHERE id = ?)`;
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching order data' });
            return;
        }
        res.json(results);
    });
});


// Route to serve A_UserInfo.html
app.get('/A_UserInfo', (req, res) => {
    const loginFilePath = path.join(__dirname, 'views', 'A_UserInfo.html');
    res.sendFile(loginFilePath);
});

// // Route to fetch orders for a specific user
// app.get('/api/orders', (req, res) => {
//     const userId = req.query.user_id;
//     const sql = `SELECT * FROM order_details WHERE user_id = ?`;
//     connection.query(sql, [userId], (err, results) => {
//         if (err) {
//             console.error('Error fetching orders:', err);
//             res.status(500).json({ error: 'Error fetching orders' });
//             return;
//         }
//         res.json(results);
//     });
// });

// Route to fetch fast food items
app.get('/api/fastfood', (req, res) => {
    const shopName = 'Fast Food'; // Name of the shop to fetch items for
    const sql = 'SELECT * FROM items WHERE shop_name = ?';
    connection.query(sql, [shopName], (err, results) => {
        if (err) {
            console.error('Error fetching food items:', err);
            res.status(500).json({ error: 'Error fetching food items' });
            return;
        }
        res.json(results);
    });
});

// Route to fetch Chinese food items
app.get('/api/chinesefood', (req, res) => {
    const shopName = 'Chinese Food';
    const sql = 'SELECT * FROM items WHERE shop_name = ?';
    connection.query(sql, [shopName], (err, results) => {
        if (err) {
            console.error('Error fetching food items:', err);
            res.status(500).json({ error: 'Error fetching food items' });
            return;
        }
        res.json(results);
    });
});

// Route to fetch South Indian food items
app.get('/api/southindianfood', (req, res) => {
    const shopName = 'South Indian Food'; // Name of the shop to fetch items for
    const sql = 'SELECT * FROM items WHERE shop_name = ?';
    connection.query(sql, [shopName], (err, results) => {
        if (err) {
            console.error('Error fetching food items:', err);
            res.status(500).json({ error: 'Error fetching food items' });
            return;
        }
        res.json(results);
    });
});


// Route to fetch Bakery & Cake items
app.get('/api/bakery&cakeshop', (req, res) => {
    const shopName = 'Bakery & Cake Shop'; // Name of the shop to fetch items for
    const sql = 'SELECT * FROM items WHERE shop_name = ?';
    connection.query(sql, [shopName], (err, results) => {
        if (err) {
            console.error('Error fetching food items:', err);
            res.status(500).json({ error: 'Error fetching food items' });
            return;
        }
        res.json(results);
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}. Direct link: http://localhost:${port}`);
});

