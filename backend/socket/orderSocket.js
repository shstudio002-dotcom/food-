module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ New client connected via Socket.io:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};