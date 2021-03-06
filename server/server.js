import geckos from "@geckos.io/server";
import http from "http";
import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

// command: $NODE_DEBUG=server npm start
// to see debug messages
import util from "util";
let debug = util.debuglog("server");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Server {
  constructor() {
    debug("Initializing Server");
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = geckos();
    this.port = 3000;

    this.app.use("/", express.static(path.join(__dirname, "../app")));

    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });

    this.io.addServer(this.server);
    this.io.onConnection((channel) => {
      channel.onDisconnect(() => {
        debug(`${channel.id} got disconnected`);
      });

      channel.on("chat message", (data) => {
        debug(`got ${data} from "chat message"`);
        // emit the "chat message" data to all channels in the same room
        this.io.room(channel.roomId).emit("chat message", data);
      });
    });
    // make sure the client uses the same port
    // @geckos.io/client uses the port 9208 by default
    this.server.listen(this.port, () => {
      debug(`Listening on http://localhost:${this.port}`);
    });

    this.Test();
  }

  Ping() {
    debug("Sending ping");
    this.io.emit("ping", "ping");
  }

  Test() {
    setInterval(() => {
      let messageNumber = Math.floor(Math.random() * 10000);
      debug(`Emitting message with number ${messageNumber}`);
      this.io.emit("chat message", messageNumber);
    }, 1000);
  }
}

const server = new Server();
