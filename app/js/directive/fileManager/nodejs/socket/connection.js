var file = require("../routes/index.js");
var io= null;

module.exports={
  setup:function(ioInput){
     io = ioInput;
     io.sockets.on('connection',this.connection)
  },

  connection:function(socket){
    file.connection(io,socket);
  }
};
