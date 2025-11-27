const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (tickets.length === 0) {
      return res.status(200).json({
        message: "No data found",
        data: [],
      });
    }

    res.status(200).json({
      message: "Success",
      data: tickets,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTicketByUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const roleId = decoded.roleId;

    let tickets;

    if (roleId === 1) {
      // Admin Role
      tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          status: true,
        },
      });
    } else {
      tickets = await prisma.ticket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          status: true,
        },
      });
    }

    if (tickets.length === 0) {
      return res.status(200).json({
        message: "No data found",
        data: [],
      });
    }

    const formatted = tickets.map((t) => ({
      ticketId: t.id,
      name: t.name,
      description: t.description,
      statusId: t.statusId,
      statusName: t.status.name,
      statusColor: t.status.color,
      userId: t.userId,
      userName: t.user.name,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      message: "Success",
      data: formatted,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createTicket = async (req, res) => {
  const { name, description, statusId, userId } = req.body;

  try {
    /************* Validation *************/
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    /************* End Validation *************/

    const newTicket = await prisma.ticket.create({
      data: {
        name,
        description,
        statusId,
        userId,
      },
    });

    const ticketResponse = {
      ticketId: newTicket.id,
      name: newTicket.name,
      description: newTicket.description,
      statusId: newTicket.statusId,
      userId: newTicket.userId,
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
    };

    res.status(201).json({
      message: "Ticket created successfully",
      data: ticketResponse,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.editTicket = async (req, res) => {
  const { id } = req.params;
  const { name, description, statusId, userId } = req.body;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const requesterId = decoded.userId;
    const requesterRole = decoded.roleId;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (requesterRole !== 1 && ticket.userId !== requesterId) {
      return res.status(403).json({
        error: "Unauthorized. You can only edit your own ticket",
      });
    }

    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        name: ticket.name,
        description: ticket.description,
        statusId: ticket.statusId,
        updatedBy: requesterId,
      },
    });

    const updateData =
      requesterRole === 1
        ? { name, description, statusId, userId }
        : { name, description, statusId };

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const requesterId = decoded.userId;
    const requesterRole = decoded.roleId;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Non-admin can delete only their own ticket
    if (requesterRole !== 1 && ticket.userId !== requesterId) {
      return res.status(403).json({
        error: "Unauthorized. You can only delete your own ticket",
      });
    }

    // Log to history before delete
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        name: ticket.name,
        description: ticket.description,
        statusId: ticket.statusId,
        updatedBy: requesterId,
      },
    });

    // Perform delete
    await prisma.ticket.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
