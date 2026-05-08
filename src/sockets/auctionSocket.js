const setupAuctionSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinAuction", (auctionId) => {
      socket.join(`auction_${auctionId}`);
    });

    socket.on("placeBid", (data) => {
      io.to(`auction_${data.auctionId}`).emit("newBid", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

export default setupAuctionSocket;