import http from "http";
import app from "./src/app.js";
import { Server } from "socket.io";

const server = http.createServer(app);

// SOCKET SETUP
const io = new Server(server, {
  cors: {
    origin: "*", // Your React frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// AUCTION STATE (in-memory)
let auctionState = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // JOIN AUCTION ROOM
  socket.on("joinAuction", (tournamentId) => {
    socket.join(`auction_${tournamentId}`);
    console.log(`📢 Client ${socket.id} joined auction_${tournamentId}`);
  });

  // PLACE BID
  socket.on("placeBid", (data) => {
    const { tournamentId, player, team, amount, bidId } = data;

    auctionState[tournamentId] = {
      player,
      team,
      amount,
      bidId,
      timestamp: new Date(),
    };

    console.log(`💰 Bid placed in tournament ${tournamentId}: ${team.team_name} bid ₹${amount.toLocaleString()} for ${player.name}`);

    // Broadcast to all clients in the auction room
    io.to(`auction_${tournamentId}`).emit("bidUpdate", {
      player,
      team,
      amount,
      bidId,
      timestamp: new Date(),
    });
  });

  // NEXT PLAYER
  socket.on("nextPlayer", (data) => {
    const { tournamentId, player } = data;
    
    console.log(`➡️ Moving to next player in tournament ${tournamentId}: ${player?.name || "Auction Complete"}`);
    
    // Clear auction state for this tournament
    delete auctionState[tournamentId];
    
    // Broadcast next player to all clients
    io.to(`auction_${tournamentId}`).emit("nextPlayer", player);
  });

  // COMPLETE AUCTION
  socket.on("completeAuction", (data) => {
    const { tournamentId } = data;
    
    console.log(`🏆 Auction completed for tournament ${tournamentId}`);
    
    // Clear auction state
    delete auctionState[tournamentId];
    
    // Broadcast auction completion
    io.to(`auction_${tournamentId}`).emit("auctionCompleted");
  });

  // LEAVE AUCTION ROOM
  socket.on("leaveAuction", (tournamentId) => {
    socket.leave(`auction_${tournamentId}`);
    console.log(`👋 Client ${socket.id} left auction_${tournamentId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

// Make io accessible to routes (optional)
app.set("io", io);

// START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});