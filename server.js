;(async function() {
  const express = require("express")
  const path = require("path")
  const app = express()

  const port = 8765

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
  })

  app.listen(port, () => {
    console.log(`listening http://localhost:${port}`)
  })

  const r = require("rethinkdb")

  let conn = null
  try {
    conn = await r.connect({
      host: "localhost",
      port: 28015
    })
  } catch (err) {
    console.log(err)
  }

  const WebSocket = require("ws")
  const socketServer = new WebSocket.Server({port: 3030})

  socketServer.on("connection", (socketClient) => {
    console.log("connected")
    console.log("client set length: ", socketServer.clients.size)

    socketClient.on("close", (socketClient) => {
      console.log("closed")
      console.log("number of clients: ", socketServer.clients.size)
    })
  })

  r.table("plot").changes().run(conn, (err, cursor) => {
    if (err) {
      console.log(err)
      return
    }

    cursor.each((err, row) => {
      if (err) {
        console.log(err)
        return
      }

      console.log(JSON.stringify(row, null, 2))

      socketServer.clients.forEach((client) => {
        client.send(JSON.stringify(row))
      })
    })
  })
})()