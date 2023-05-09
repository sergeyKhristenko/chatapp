module.exports = {
  apps: [
    {
      name: "chatapp",
      script: "./server.js",
      watch: ["public", "views", "server.js"],
    },
  ],
};
