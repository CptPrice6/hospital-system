# Use the official Node.js image from Docker Hub
FROM node:14

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire application code
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Command to run the app
CMD [ "node", "index.js" ]