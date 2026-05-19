FROM node:20-alpine

# We need g++ and make if we are building the simulator binary inside docker, 
# but assuming the simulator binary is compiled and mounted or we build it here.
# For simplicity, we assume simulator is built or we can install build tools.
RUN apk add --no-cache g++ make cmake

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
