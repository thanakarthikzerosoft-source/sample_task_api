require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const connectDB = require("./db");

const Admin = require("./models/admin");
const Product = require("./models/product");
const Cart = require("./models/cart");

const authenticateToken = require("./authMiddleware");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your-secret-key";

app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
 console.log("working",req.body)
  try {
    const user = await Admin.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentrrials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  console.log("its working");
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await Admin.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.json({
      success: true,
      message: "Registration successful",
      userId: newUser._id.toString(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}); 


app.get("/profile", authenticateToken, (req, res) => {
  console.log("profile working")
  res.json({
    success: true,
    message: "Protected data",
    user: req.user,
  });
});


app.post("/test", async (req, res) => {  //only load data on postman
  try {
    const data = req.body;

    // CASE 1: MULTIPLE PRODUCTS (ARRAY)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Product array is empty",
        });
      }

      const products = await Product.insertMany(data);

      return res.json({
        success: true,
        message: `${products.length} products added successfully`,
        products,
      });
    }

    // CASE 2: SINGLE PRODUCT (OBJECT)
    const {
      category,
      subCategory,
      title,
      description,
      image,
      price,
    } = data;

    if (!category || !subCategory || !title || !description || !image || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product = new Product({
      category,
      subCategory,
      title,
      description,
      image,
      price,
    });

    await product.save();

    return res.json({
      success: true,
      message: "Product added successfully",
      product,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/test", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // ✅ Add limit support
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(limit); // ✅ Apply limit

    res.json(products); // ✅ Return array directly (not wrapped in object)
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/cart/add", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  try {
    // 1. Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Find cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // 3. Check item exists
    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ productId, quantity: quantity || 1 });
    }

    await cart.save();

    res.json({ success: true, message: "Added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/cart", authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate("items.productId");

    res.json({
      success: true,
      items: cart ? cart.items : [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});




app.listen(PORT, "0.0.0.0", async () => {
  await connectDB();
  console.log(`Server running at: http://192.168.1.53:${PORT}`);
});
