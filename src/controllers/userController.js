const { PrismaClient } = require("../generated/prisma");
const { validateEmail, validatePassword } = require("../utils/userValidation");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.getAllUsers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const roleId = decoded.roleId;

    // Only admin (roleId = 1) can access
    if (roleId !== 1) {
      return res.status(403).json({ error: "Access denied." });
    }

    const users = await prisma.user.findMany({
      include: { role: true },
    });

    const formattedUsers = users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      roleId: u.roleId,
      roleName: u.role.name,
    }));

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: formattedUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, roleId } = req.body;
  try {
    /************* Validation *************/
    const isValidEmail = validateEmail(email);
    if (!isValidEmail) {
      throw new Error("Invalid Email");
    }

    const isValidPassword = validatePassword(password);
    if (!isValidPassword) {
      throw new Error(
        "Password must be 6-16 characters long and contain at least one number and symbol"
      );
    }

    /* Hash Password */
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    const token = jwt.sign(
      { id: newUser.id, roleId: newUser.roleId },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res
      .status(201)
      .json({ message: "Create successful", data: userWithoutPassword });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    // create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const data = {
      userId: user.id,
      userName: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.roleName,
      token,
    };

    res.status(200).json({
      message: "Login successful",
      data,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};
