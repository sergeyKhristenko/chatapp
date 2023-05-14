FROM node:18-slim

EXPOSE 3000

WORKDIR /app

# # Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# # Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY ./backend/package*.json ./

RUN npm install --production

# These steps will be re-run upon each file change in your working directory:
ADD ./backend/ .

RUN npm run build
# Compile the main app so that it doesn't need to be compiled each startup/entry.

CMD ["node", "./dist/index.js"]
