FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p ./uploads ./output

# for testing
RUN npm install axios axios-cookiejar-support tough-cookie

EXPOSE 3000

CMD ["node", "index.js"]