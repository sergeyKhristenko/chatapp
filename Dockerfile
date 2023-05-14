# build
FROM node:18-alpine AS build
WORKDIR /app
COPY ./backend ./
RUN npm install
RUN npm run build

# install prod modules
FROM node:18-alpine AS install-prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./package*.json ./
RUN npm install --production

# run the app
FROM gcr.io/distroless/nodejs18-debian11 
EXPOSE 3000
WORKDIR /app
COPY --from=install-prod /app .

ENV NODE_ENV production

CMD ["./dist/index.js"]
