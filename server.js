
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, { 
  cors: {
    origin: "*", 
  },
});
// Allow all origins, adjust as necessary
app.set("io", io); // Make the `io` instance accessible via `app`

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

