# Use an official Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files (for caching)
COPY package*.json ./

# Install packages
RUN npm install

# Copy source code
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start the dev server and expose it to the host network
CMD ["npm", "run", "dev", "--", "--host"]
